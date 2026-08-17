/**
 * Main render orchestration: cards/rows, empty state, stats panel, category counts.
 * Exposed as window.App.render.
 */
(function (App) {
    "use strict";

    const { dom, esc, util, consts, user, filter, $ } = App;

    function render() {
        const { state } = App;
        const list = filter.filterAndSort();

        dom.contentTitle.textContent = filter.computeTitle();
        dom.resultCount.textContent = `${list.length} 项`;

        // Sync top nav (platform highlight independent of category)
        document.querySelectorAll(".nav-item").forEach(el => {
            const p = el.dataset.platform;
            el.classList.toggle("active", p && p === state.platform);
        });

        // Sync sidebar categories
        document.querySelectorAll(".category-item").forEach(el => {
            el.classList.toggle("active", el.dataset.category === state.category);
        });

        // View class (grid vs list)
        dom.appGrid.className = state.view === "list" ? "app-list" : "app-grid";

        if (list.length === 0) {
            dom.appGrid.innerHTML = "";
            dom.emptyState.style.display = "flex";
            renderEmptyReason();
        } else {
            dom.emptyState.style.display = "none";
            dom.appGrid.innerHTML = state.view === "list" ? renderList(list) : renderGrid(list);
        }

        updateStats();
        updateCategoryCounts();
        updateBatchDownloadButton();
    }

    function renderEmptyReason() {
        const { state } = App;
        const reasons = [];
        if (state.platform !== "all") reasons.push(consts.PLATFORM_LABELS[state.platform]);
        if (state.category === "essential") reasons.push("装机必备");
        else if (state.category !== "all") reasons.push(consts.CATEGORY_LABELS[state.category] || state.category);
        if (state.keyword) reasons.push(`搜索 "${state.keyword}"`);

        const emptyText = dom.emptyState.querySelector("p");
        if (!emptyText) return;
        emptyText.innerHTML = reasons.length > 0
            ? `当前筛选没有匹配的软件<br><small class="empty-reason">${reasons.join(" · ")}</small><br><button class="btn-secondary empty-reset-btn" id="emptyResetBtn">重置筛选</button>`
            : "软件库为空";

        const resetBtn = document.getElementById("emptyResetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                App.state.category = "all";
                App.state.keyword = "";
                if (dom.searchInput) dom.searchInput.value = "";
                App.router.updateHash();
                render();
            });
        }
    }

    function renderGrid(list) {
        return list.map(app => {
            const rec = App.recommended(app);
            const vc = (app.versions && app.versions.length) || 0;
            const attCount = (app.attachments && app.attachments.length) || 0;
            const essential = user.isEssential(app);
            const key = `${app.platform}::${app.name}`;
            const missing = rec && rec.available === false;
            return `
            <div class="app-card${essential ? " essential" : ""}${missing ? " missing" : ""}" data-key="${esc.attr(key)}">
                <button class="star-btn" data-action="star" title="${essential ? "从装机必备移除" : "加入装机必备"}">
                    ${util.starIcon(essential)}
                </button>
                <div class="app-icon">${util.renderIcon(app.icon, app.name)}</div>
                <div class="app-name" title="${esc.attr(app.name)}">${esc.html(app.name)}</div>
                <div class="app-desc">${esc.html(app.desc || "")}</div>
                <div class="app-meta">
                    <span class="app-badge ${app.platform}">${consts.PLATFORM_LABELS[app.platform] || app.platform}</span>
                    ${rec ? `<span class="app-badge">v${esc.html(rec.version)}</span>` : ""}
                    ${rec && rec.size && !missing ? `<span class="app-badge size" title="文件大小">${esc.html(rec.size)}</span>` : ""}
                    ${vc > 1 ? `<span class="app-badge multi" title="共 ${vc} 个版本">${vc} 版</span>` : ""}
                    ${attCount > 0 ? `<span class="app-badge attach" title="${attCount} 个附件">${util.icon("paperclip", 10)} ${attCount}</span>` : ""}
                    ${missing ? `<span class="app-badge missing" title="未上架">未上架</span>` : ""}
                </div>
            </div>`;
        }).join("");
    }

    function renderList(list) {
        return list.map(app => {
            const rec = App.recommended(app);
            const vc = (app.versions && app.versions.length) || 0;
            const attCount = (app.attachments && app.attachments.length) || 0;
            const essential = user.isEssential(app);
            const key = `${app.platform}::${app.name}`;
            const missing = rec && rec.available === false;
            return `
            <div class="app-row${essential ? " essential" : ""}${missing ? " missing" : ""}" data-key="${esc.attr(key)}">
                <button class="star-btn" data-action="star" title="${essential ? "从装机必备移除" : "加入装机必备"}">
                    ${util.starIcon(essential)}
                </button>
                <div class="row-icon">${util.renderIcon(app.icon, app.name)}</div>
                <div class="row-main">
                    <div class="row-name">${esc.html(app.name)}${vc > 1 ? ` <span class="row-multi">${vc} 版</span>` : ""}${attCount > 0 ? ` <span class="row-multi" title="${attCount} 个附件">${util.icon("paperclip", 10)} ${attCount}</span>` : ""}${missing ? ` <span class="row-multi missing" title="未上架">未上架</span>` : ""}</div>
                    <div class="row-desc">${esc.html(app.desc || "")}</div>
                </div>
                <div class="row-col row-platform">
                    <span class="app-badge ${app.platform}">${consts.PLATFORM_LABELS[app.platform] || app.platform}</span>
                </div>
                <div class="row-col row-version">${rec ? "v" + esc.html(rec.version) : "-"}</div>
                <div class="row-col row-size">${rec ? esc.html(rec.size || "-") : "-"}</div>
                <div class="row-col row-used">${user.usedCount(app) ? user.usedCount(app) + " 次" : "-"}</div>
                <div class="row-actions">
                    ${rec && rec.downloadUrl && !missing
                        ? `<a href="${esc.attr(rec.downloadUrl)}" class="row-dl" data-action="dl" title="下载 v${esc.attr(rec.version)}">${util.icon("download", 16)}</a>`
                        : (missing ? `<span class="row-dl disabled" title="未上架">${util.icon("download", 16)}</span>` : "")}
                </div>
            </div>`;
        }).join("");
    }

    function updateStats() {
        const { state } = App;
        const all = window.APPS;
        $("statEssentialMac").textContent     = all.filter(a => a.platform === "mac"     && user.isEssential(a)).length;
        $("statEssentialWin").textContent     = all.filter(a => a.platform === "win"     && user.isEssential(a)).length;
        $("statEssentialLinux").textContent   = all.filter(a => a.platform === "linux"   && user.isEssential(a)).length;
        $("statEssentialAndroid").textContent = all.filter(a => a.platform === "android" && user.isEssential(a)).length;

        document.querySelectorAll("[data-platform-stat]").forEach(el => {
            el.classList.toggle("active", el.dataset.platformStat === state.platform);
        });
    }

    function updateCategoryCounts() {
        const { state } = App;
        const scoped = state.platform === "all"
            ? window.APPS
            : window.APPS.filter(a => a.platform === state.platform);

        document.querySelectorAll("[data-count-for]").forEach(el => {
            const cat = el.dataset.countFor;
            let n;
            if (cat === "all") n = scoped.length;
            else if (cat === "essential") n = scoped.filter(a => user.isEssential(a)).length;
            else n = scoped.filter(a => a.category === cat).length;
            el.textContent = n;
        });
    }

    function updateBatchDownloadButton() {
        const count = window.APPS.filter(a => a.platform === App.state.platform && user.isEssential(a)).length;
        dom.batchDownloadBtn.disabled = count === 0;
        dom.batchDownloadBtn.querySelector("span:last-child").textContent =
            count === 0 ? "暂无必备软件" : `一键下载 ${count} 项`;
    }

    // Convenience helper used by many event handlers
    function persistAndRender() {
        user.save();
        render();
    }

    App.render = { render, updateStats, updateCategoryCounts, updateBatchDownloadButton, persistAndRender };

})(window.App = window.App || {});

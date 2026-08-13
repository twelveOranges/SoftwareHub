/**
 * Detail modal: shows an app's tags, versions, attachments, and note.
 * Exposed as window.App.detail.
 */
(function (App) {
    "use strict";

    const { dom, esc, util, consts, user } = App;

    let currentApp = null;

    function open(app) {
        currentApp = app;
        dom.modalIcon.innerHTML = util.renderIcon(app.icon, app.name);
        dom.modalTitle.textContent = app.name;
        dom.modalDesc.textContent = app.desc || "";
        dom.modalTags.innerHTML = buildTags(app);

        dom.modalNote.textContent = app.note || "（无备注）";
        dom.modalNote.classList.toggle("empty", !app.note);

        const vc = (app.versions && app.versions.length) || 0;
        dom.modalVersionHint.textContent = vc > 1
            ? `${vc} 个版本（第 1 个为推荐）`
            : `1 个版本`;
        dom.modalVersionList.innerHTML = renderVersions(app);

        // Attachments section
        const atts = app.attachments || [];
        if (atts.length > 0) {
            dom.modalAttachmentsSection.style.display = "";
            dom.modalAttachmentsHint.textContent = `${atts.length} 项 · 单独下载`;
            dom.modalAttachmentList.innerHTML = renderAttachments(app);
        } else {
            dom.modalAttachmentsSection.style.display = "none";
        }

        // Star button
        const isE = user.isEssential(app);
        dom.modalStarBtn.innerHTML = `${util.starIcon(isE)}<span>${isE ? "已加入装机必备" : "加入装机必备"}</span>`;
        dom.modalStarBtn.classList.toggle("active", isE);

        dom.modalMask.classList.add("open");
    }

    function close() {
        dom.modalMask.classList.remove("open");
        currentApp = null;
    }

    function isOpen() {
        return dom.modalMask.classList.contains("open");
    }

    // ---------- Sub-renders ----------

    function buildTags(app) {
        const tags = [];
        if (user.isEssential(app)) {
            tags.push(`<span class="tag-chip essential-chip">${util.icon("star", 12)} 装机必备</span>`);
        }
        const vc = (app.versions && app.versions.length) || 0;
        if (vc > 1) {
            tags.push(`<span class="tag-chip">${util.icon("boxOpen", 12)} ${vc} 个历史版本</span>`);
        }
        tags.push(`<span class="tag-chip platform-chip">${consts.PLATFORM_LABELS[app.platform] || app.platform}</span>`);
        tags.push(`<span class="tag-chip">${consts.CATEGORY_LABELS[app.category] || app.category}</span>`);

        const uc = user.usedCount(app);
        if (uc > 0) {
            tags.push(`<span class="tag-chip stat-chip">${util.icon("download", 12)} ${uc} 次</span>`);
        }
        return tags.join("");
    }

    function renderVersions(app) {
        if (!app.versions || app.versions.length === 0) {
            return `<div class="version-empty">此软件暂无可下载的版本</div>`;
        }
        return app.versions.map((v, idx) => `
            <div class="version-row${idx === 0 ? " version-recommended" : ""}" data-version="${esc.attr(v.version)}">
                <div class="version-info">
                    <div class="version-line">
                        <span class="version-tag">v${esc.html(v.version)}</span>
                        ${idx === 0 ? `<span class="version-badge-rec">推荐</span>` : ""}
                        ${v.note ? `<span class="version-note">${esc.html(v.note)}</span>` : ""}
                    </div>
                    <div class="version-meta">
                        <span>${util.icon("boxOpen", 12)} ${esc.html(v.size || "-")}</span>
                        ${v.releaseDate ? `<span>${util.icon("calendar", 12)} ${esc.html(v.releaseDate)}</span>` : ""}
                    </div>
                </div>
                <div class="version-actions">
                    ${v.downloadUrl
                        ? `<a href="${esc.attr(v.downloadUrl)}" class="btn-download" data-action="dl-version" data-version="${esc.attr(v.version)}" target="_blank" rel="noopener">${util.icon("download", 14)}<span>下载</span></a>`
                        : `<span class="btn-download disabled">无链接</span>`}
                </div>
            </div>
        `).join("");
    }

    function renderAttachments(app) {
        return (app.attachments || []).map(att => `
            <div class="attachment-row">
                <div class="attachment-icon">${util.icon("paperclip", 14)}</div>
                <div class="attachment-info">
                    <div class="attachment-name">${esc.html(att.name)}</div>
                    ${att.desc ? `<div class="attachment-desc">${esc.html(att.desc)}</div>` : ""}
                    <div class="attachment-meta">
                        <span>${util.icon("boxOpen", 11)} ${esc.html(att.size || "-")}</span>
                        ${att.installPath ? `<span title="${esc.attr(att.installPath)}">${util.icon("folder", 11)} ${esc.html(att.installPath)}</span>` : ""}
                    </div>
                </div>
                <div class="attachment-actions">
                    ${att.downloadUrl
                        ? `<a href="${esc.attr(att.downloadUrl)}" class="btn-download" data-action="dl-attachment" download="${esc.attr(att.downloadUrl.split('/').pop())}">${util.icon("download", 13)}<span>下载</span></a>`
                        : `<span class="btn-download disabled">无链接</span>`}
                </div>
            </div>
        `).join("");
    }

    // ---------- Event wiring ----------

    function bind() {
        dom.modalClose.addEventListener("click", close);
        dom.modalMask.addEventListener("click", e => {
            if (e.target === dom.modalMask) close();
        });

        // Star toggle within modal
        dom.modalStarBtn.addEventListener("click", () => {
            if (!currentApp) return;
            user.toggleEssential(currentApp);
            user.save();
            open(currentApp);   // rerender with new state
            App.render.render();
        });

        // Download click inside version list → bump usage stats
        dom.modalVersionList.addEventListener("click", e => {
            const a = e.target.closest("[data-action='dl-version']");
            if (!a || !currentApp) return;
            user.bumpUsed(currentApp);
            user.save();
            setTimeout(() => {
                if (isOpen()) open(currentApp);
                App.render.render();
            }, 100);
        });

        // Attachments: default anchor behavior handles the download; no state bump.
    }

    App.detail = { open, close, isOpen, bind, current: () => currentApp };

})(window.App = window.App || {});

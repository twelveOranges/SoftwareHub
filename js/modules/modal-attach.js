/**
 * Attachment picker modal (shown during batch-download when essential apps
 * have attachments). Users can pick which attachments to bundle with the
 * main-program downloads.
 * Exposed as window.App.attachPicker.
 */
(function (App) {
    "use strict";

    const { dom, esc, util } = App;

    let pickerData = [];              // [{ app, attachments }]
    let pendingMainDownloads = [];    // main-program downloads awaiting user decision

    function open(appsWithAtts, mainDownloads) {
        pickerData = appsWithAtts.map(app => ({ app, attachments: app.attachments || [] }));
        pendingMainDownloads = mainDownloads || [];

        const mainCount  = pendingMainDownloads.length;
        const totalCount = pickerData.reduce((n, x) => n + x.attachments.length, 0);
        dom.attachPickerDesc.textContent = `即将下载 ${mainCount} 个必备主程序。以下 ${pickerData.length} 个软件带有共 ${totalCount} 个附件，勾选需要一起下载的项目：`;

        dom.attachPickerTree.innerHTML = pickerData.map((entry, ai) => {
            const app = entry.app;
            return `
            <div class="attach-tree-app" data-app-index="${ai}">
                <label class="attach-tree-app-header">
                    <input type="checkbox" class="attach-tree-checkbox app-check" data-app-index="${ai}" checked>
                    <div class="attach-tree-app-icon">${util.renderIcon(app.icon, app.name)}</div>
                    <span class="attach-tree-app-name">${esc.html(app.name)}</span>
                    <span class="attach-tree-app-count">${entry.attachments.length} 项</span>
                </label>
                <div class="attach-tree-children">
                    ${entry.attachments.map((att, i) => `
                        <label class="attach-tree-item">
                            <input type="checkbox" class="attach-tree-checkbox item-check" data-app-index="${ai}" data-att-index="${i}" checked>
                            <div class="attach-tree-item-info">
                                <div class="attach-tree-item-name">${esc.html(att.name)}</div>
                                <div class="attach-tree-item-meta">
                                    <span>${esc.html(att.size || "-")}</span>
                                    ${att.desc ? `<span>· ${esc.html(att.desc)}</span>` : ""}
                                </div>
                            </div>
                        </label>
                    `).join("")}
                </div>
            </div>`;
        }).join("");

        updateSummary();
        dom.attachPickerMask.classList.add("open");
    }

    function close() {
        dom.attachPickerMask.classList.remove("open");
        pickerData = [];
        pendingMainDownloads = [];
    }

    function isOpen() {
        return dom.attachPickerMask.classList.contains("open");
    }

    function getSelectedAttachments() {
        const selected = [];
        dom.attachPickerTree.querySelectorAll(".item-check:checked").forEach(cb => {
            const ai = parseInt(cb.dataset.appIndex, 10);
            const i  = parseInt(cb.dataset.attIndex, 10);
            const entry = pickerData[ai];
            if (entry && entry.attachments[i] && entry.attachments[i].downloadUrl) {
                selected.push(entry.attachments[i]);
            }
        });
        return selected;
    }

    function updateSummary() {
        const sel = getSelectedAttachments();
        dom.attachPickerSummary.textContent = `已选 ${sel.length} 项附件`;
        // Confirm is always enabled — 0 selected still means "download main programs"
        dom.attachPickerConfirm.disabled = false;

        // Sync each app-level checkbox (indeterminate / checked / unchecked)
        dom.attachPickerTree.querySelectorAll(".attach-tree-app").forEach(node => {
            const items = node.querySelectorAll(".item-check");
            const checked = node.querySelectorAll(".item-check:checked").length;
            const appCheck = node.querySelector(".app-check");
            if (checked === 0) {
                appCheck.checked = false;
                appCheck.indeterminate = false;
            } else if (checked === items.length) {
                appCheck.checked = true;
                appCheck.indeterminate = false;
            } else {
                appCheck.checked = false;
                appCheck.indeterminate = true;
            }
        });
    }

    function bind() {
        // Tree checkbox events
        dom.attachPickerTree.addEventListener("change", e => {
            const t = e.target;
            if (t.classList.contains("app-check")) {
                const ai = t.dataset.appIndex;
                dom.attachPickerTree
                    .querySelectorAll(`.item-check[data-app-index="${ai}"]`)
                    .forEach(cb => { cb.checked = t.checked; });
            }
            updateSummary();
        });

        // X button — cancel everything, no download
        dom.attachPickerClose.addEventListener("click", close);
        dom.attachPickerMask.addEventListener("click", e => {
            if (e.target === dom.attachPickerMask) close();
        });

        // Skip — download only main programs
        dom.attachPickerSkip.addEventListener("click", () => {
            const mains = pendingMainDownloads;
            close();
            if (mains.length) App.download.fireBatchDownloads(mains, []);
        });

        // Confirm — download main + selected attachments
        dom.attachPickerConfirm.addEventListener("click", () => {
            const sel = getSelectedAttachments();
            const mains = pendingMainDownloads;
            const attUrls = sel.map(att => ({ url: att.downloadUrl }));
            close();
            App.download.fireBatchDownloads(mains, attUrls);
        });
    }

    App.attachPicker = { open, close, isOpen, bind };

})(window.App = window.App || {});

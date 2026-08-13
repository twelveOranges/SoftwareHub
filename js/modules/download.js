/**
 * Download orchestration:
 *   - downloadUrls(): fire multiple <a download> clicks with a stagger
 *   - triggerBatchDownload(): download essential apps for current platform,
 *     opening the attachment picker if any essential app has attachments
 *   - fireBatchDownloads(): the SOLE download entry point (main + selected attachments)
 * Exposed as window.App.download.
 */
(function (App) {
    "use strict";

    const STAGGER_MS = 300;

    function downloadUrls(urls) {
        urls.forEach((u, i) => {
            setTimeout(() => {
                const a = document.createElement("a");
                a.href = u.url;
                a.download = u.url.split("/").pop();
                a.rel = "noopener";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (u.onFire) u.onFire();
            }, i * STAGGER_MS);
        });
    }

    function fireBatchDownloads(mainDownloads, attachmentUrls) {
        const all = mainDownloads.concat(attachmentUrls);
        downloadUrls(all);
        setTimeout(() => {
            App.user.save();
            App.render.render();
        }, all.length * STAGGER_MS + 100);
    }

    function triggerBatchDownload() {
        const { state, user } = App;
        if (state.platform === "all") return;

        const essentials = window.APPS.filter(a =>
            a.platform === state.platform && user.isEssential(a));
        if (essentials.length === 0) return;

        // Build the main-program download list (recommended version per app)
        const mainDownloads = [];
        essentials.forEach(app => {
            const rec = App.recommended(app);
            if (rec && rec.downloadUrl) {
                mainDownloads.push({
                    url: rec.downloadUrl,
                    onFire: () => user.bumpUsed(app)
                });
            }
        });
        if (mainDownloads.length === 0) return;

        const appsWithAtts = essentials.filter(a => (a.attachments || []).length > 0);
        if (appsWithAtts.length === 0) {
            // No attachments — just fire main downloads directly
            fireBatchDownloads(mainDownloads, []);
            return;
        }

        // Has attachments — open picker; downloads happen only when user confirms/skips
        App.attachPicker.open(appsWithAtts, mainDownloads);
    }

    function bind() {
        App.dom.batchDownloadBtn.addEventListener("click", triggerBatchDownload);
    }

    App.download = { downloadUrls, fireBatchDownloads, triggerBatchDownload, bind };

})(window.App = window.App || {});

/**
 * On page load, fetch real Content-Length AND Last-Modified for every
 * downloadUrl via HEAD, and update the in-memory size + releaseDate strings
 * so the UI reflects the file server's ground truth.
 * Exposed as window.App.probe.
 */
(function (App) {
    "use strict";

    const CONCURRENCY = 8;
    const { util } = App;

    // Format an HTTP Last-Modified date into "YYYY-MM-DD"
    function formatDate(httpDate) {
        try {
            const d = new Date(httpDate);
            if (isNaN(d.getTime())) return null;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        } catch (e) { return null; }
    }

    async function headProbe(url) {
        try {
            const res = await fetch(url, { method: "HEAD", cache: "no-store" });
            if (!res.ok) return { size: null, date: null };
            const len = res.headers.get("content-length");
            const lm  = res.headers.get("last-modified");
            return {
                size: len ? parseInt(len, 10) : null,
                date: lm  ? formatDate(lm)   : null
            };
        } catch (e) {
            return { size: null, date: null };
        }
    }

    async function run() {
        // Collect all URL → callback pairs that need metadata updates
        const jobs = [];
        window.APPS.forEach(app => {
            (app.versions || []).forEach(v => {
                if (v.downloadUrl) jobs.push({
                    url: v.downloadUrl,
                    apply: info => {
                        if (info.size !== null && info.size > 0) v.size = util.formatBytes(info.size);
                        if (info.date) v.releaseDate = info.date;
                    }
                });
            });
            (app.attachments || []).forEach(att => {
                if (att.downloadUrl) jobs.push({
                    url: att.downloadUrl,
                    apply: info => {
                        if (info.size !== null && info.size > 0) att.size = util.formatBytes(info.size);
                        // Attachments don't show a date in the UI, so skip that
                    }
                });
            });
        });

        let index = 0;
        let updated = 0;

        async function worker() {
            while (index < jobs.length) {
                const job = jobs[index++];
                const info = await headProbe(job.url);
                if (info.size !== null || info.date !== null) {
                    job.apply(info);
                    updated++;
                }
            }
        }

        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);

        if (updated > 0) {
            console.log(`[probe] Updated ${updated}/${jobs.length} entries from HEAD probes`);
            App.render.render();
        }
    }

    App.probe = { run };

})(window.App = window.App || {});

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
            if (!res.ok) {
                // 404 / 403 / 5xx → file not on the server yet.
                // Return ok:false so the caller can grey it out in the UI,
                // instead of leaving a red 404 in the console.
                return { ok: false, size: null, date: null, status: res.status };
            }
            const len = res.headers.get("content-length");
            const lm  = res.headers.get("last-modified");
            return {
                ok: true,
                size: len ? parseInt(len, 10) : null,
                date: lm  ? formatDate(lm)   : null
            };
        } catch (e) {
            // Network error (offline, CORS, etc.) — treat as "unknown", not missing.
            return { ok: null, size: null, date: null };
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
                        if (info.ok === false) {
                            v.available = false;
                            v.size = "未上架";
                            return;
                        }
                        if (info.ok === true) {
                            v.available = true;
                            if (info.size !== null && info.size > 0) v.size = util.formatBytes(info.size);
                            if (info.date) v.releaseDate = info.date;
                        }
                        // ok === null (network error): leave untouched
                    }
                });
            });
            (app.attachments || []).forEach(att => {
                if (att.downloadUrl) jobs.push({
                    url: att.downloadUrl,
                    apply: info => {
                        if (info.ok === false) {
                            att.available = false;
                            att.size = "未上架";
                            return;
                        }
                        if (info.ok === true) {
                            att.available = true;
                            if (info.size !== null && info.size > 0) att.size = util.formatBytes(info.size);
                        }
                    }
                });
            });
        });

        let index = 0;
        let updated = 0;
        let missing = 0;

        async function worker() {
            while (index < jobs.length) {
                const job = jobs[index++];
                const info = await headProbe(job.url);
                if (info.ok === false) missing++;
                if (info.ok !== null) {
                    job.apply(info);
                    updated++;
                }
            }
        }

        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);

        if (updated > 0) {
            console.log(`[probe] Updated ${updated}/${jobs.length} entries (${missing} not yet on server)`);
            App.render.render();
        }
    }

    App.probe = { run };

})(window.App = window.App || {});

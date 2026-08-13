/**
 * Catalog loader — fetches the per-platform YAML files, parses them with
 * js-yaml, and merges them into window.APPS.
 *
 * Runtime contract: exposes App.catalog.load() → Promise<AppList>.
 * On success the global window.APPS is populated (backward-compatible with
 * every module that reads window.APPS directly).
 */
(function (App) {
    "use strict";

    // Defensive default so any code that references window.APPS before
    // load() finishes still sees a valid (empty) array.
    if (!Array.isArray(window.APPS)) window.APPS = [];

    const PLATFORM_FILES = [
        { platform: "mac",     url: "data/mac.yaml"     },
        { platform: "win",     url: "data/win.yaml"     },
        { platform: "android", url: "data/android.yaml" }
    ];

    async function fetchYaml(url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
        const text = await res.text();
        try {
            return window.jsyaml.load(text) || [];
        } catch (e) {
            throw new Error(`YAML parse error in ${url}: ${e.message}`);
        }
    }

    async function load() {
        if (!window.jsyaml || typeof window.jsyaml.load !== "function") {
            throw new Error("js-yaml is not loaded — check <script> order in index.html");
        }

        const results = await Promise.all(PLATFORM_FILES.map(async pf => {
            try {
                const list = await fetchYaml(pf.url);
                if (!Array.isArray(list)) {
                    console.warn(`[catalog] ${pf.url} did not yield a list; got:`, list);
                    return [];
                }
                // Inject platform from filename so every app has it
                return list.map(app => Object.assign({ platform: pf.platform }, app));
            } catch (e) {
                console.error(`[catalog] ${pf.url} load failed:`, e);
                return [];
            }
        }));

        const merged = results.flat();
        window.APPS = merged;
        return merged;
    }

    App.catalog = { load, files: PLATFORM_FILES };

})(window.App = window.App || {});

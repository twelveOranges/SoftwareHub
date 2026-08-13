/**
 * URL hash-based state persistence.
 * Format: #platform=mac&category=game&q=chrome
 * Exposed as window.App.router.
 */
(function (App) {
    "use strict";

    function parseHash() {
        const { consts } = App;
        const raw = location.hash.replace(/^#/, "");
        // Default: mac + all (顶栏不再提供"全部"选项，platform 永不为 all)
        const params = { platform: "mac", category: "all", q: "" };
        if (!raw) return params;

        raw.split("&").forEach(seg => {
            const [k, v] = seg.split("=");
            if (k === "platform" && v) params.platform = decodeURIComponent(v);
            else if (k === "category" && v) params.category = decodeURIComponent(v);
            else if (k === "q" && v) params.q = decodeURIComponent(v);
            else if (k === "essential" && v === "1") params.category = "essential";
        });

        // Defensive validation
        if (!consts.VALID_PLATFORMS.includes(params.platform)) params.platform = "mac";
        if (params.category !== "all"
            && params.category !== "essential"
            && !consts.CATEGORY_LABELS[params.category]) {
            params.category = "all";
        }
        return params;
    }

    function buildHash() {
        const { state } = App;
        const parts = [];
        if (state.platform !== "all") parts.push(`platform=${encodeURIComponent(state.platform)}`);
        if (state.category !== "all") parts.push(`category=${encodeURIComponent(state.category)}`);
        if (state.keyword) parts.push(`q=${encodeURIComponent(state.keyword)}`);
        return parts.length ? "#" + parts.join("&") : "";
    }

    let internalHashChange = false;

    function updateHash() {
        const h = buildHash();
        const target = h || location.pathname + location.search;
        if (location.hash !== h) {
            internalHashChange = true;
            history.replaceState(null, "", target);
        }
    }

    function applyStateFromHash() {
        const { state, dom } = App;
        const p = parseHash();
        state.platform = p.platform;
        state.category = p.category;
        state.keyword = p.q;
        if (dom.searchInput) dom.searchInput.value = p.q;
        App.render.render();
    }

    function bind() {
        window.addEventListener("hashchange", () => {
            if (internalHashChange) { internalHashChange = false; return; }
            applyStateFromHash();
        });
    }

    App.router = { parseHash, buildHash, updateHash, applyStateFromHash, bind };

})(window.App = window.App || {});

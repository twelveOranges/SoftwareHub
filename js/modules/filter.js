/**
 * Filter, sort and title composition for the app list.
 * Exposed as window.App.filter.
 */
(function (App) {
    "use strict";

    function filterAndSort() {
        const { state, user, consts } = App;
        let list = window.APPS.slice();

        if (state.platform !== "all") {
            list = list.filter(a => a.platform === state.platform);
        }

        if (state.category === "essential") {
            list = list.filter(a => user.isEssential(a));
        } else if (state.category !== "all") {
            list = list.filter(a => a.category === state.category);
        }

        if (state.keyword) {
            const kw = state.keyword.toLowerCase();
            list = list.filter(a =>
                a.name.toLowerCase().includes(kw) ||
                (a.desc || "").toLowerCase().includes(kw) ||
                (a.note || "").toLowerCase().includes(kw)
            );
        }

        // Primary sort
        if (state.sort === "used") {
            list.sort((a, b) => user.usedCount(b) - user.usedCount(a));
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name, "zh"));
        }

        // Essential-first (except when we're already filtering to essential-only)
        if (state.category !== "essential") {
            list.sort((a, b) => (user.isEssential(b) ? 1 : 0) - (user.isEssential(a) ? 1 : 0));
        }

        return list;
    }

    function computeTitle() {
        const { state, consts } = App;
        const parts = [];
        if (state.platform !== "all") parts.push(consts.PLATFORM_LABELS[state.platform]);
        if (state.category !== "all") parts.push(consts.CATEGORY_LABELS[state.category]);
        if (state.keyword) parts.push(`搜索 "${state.keyword}"`);
        return parts.length ? parts.join(" · ") : "全部软件";
    }

    App.filter = { filterAndSort, computeTitle };

})(window.App = window.App || {});

/**
 * Application state, label constants, and user data persistence.
 * Exposed under window.App.state, window.App.consts, window.App.user.
 */
(function (App) {
    "use strict";

    // ---------- Mutable UI state ----------
    App.state = {
        keyword: "",
        category: "all",  // "all" | "essential" | design/dev/office/...
        platform: "mac",  // Default landing platform
        sort: "name",     // "name" | "used"
        view: localStorage.getItem("view") || "grid"
    };

    // ---------- Label constants ----------
    App.consts = {
        CATEGORY_LABELS: {
            all: "全部",
            essential: "装机必备",
            design: "设计创意",
            dev: "开发工具",
            office: "办公",
            video: "影音",
            system: "系统工具",
            browser: "浏览器",
            chat: "社交",
            life: "生活服务",
            game: "游戏"
        },
        PLATFORM_LABELS: {
            all: "全部",
            mac: "Mac",
            win: "Windows",
            android: "Android"
        },
        VALID_PLATFORMS: ["mac", "win", "android"],
        FALLBACK_ICON: "icons/_fallback.svg"
    };

    // ---------- User data (localStorage) ----------
    const USER_DATA_KEY = "sw-hub-userdata";

    function load() {
        try { return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {}; }
        catch (e) { return {}; }
    }

    let userData = load();

    App.user = {
        save() {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        },
        entry(name) {
            if (!userData[name]) userData[name] = { usedCount: 0, essential: null };
            return userData[name];
        },
        isEssential(app) {
            const u = userData[app.name];
            if (u && u.essential !== null && u.essential !== undefined) return u.essential;
            return !!app.essential;
        },
        usedCount(app) { return userData[app.name]?.usedCount || 0; },
        bumpUsed(app) {
            const e = this.entry(app.name);
            e.usedCount = (e.usedCount || 0) + 1;
        },
        toggleEssential(app) {
            const e = this.entry(app.name);
            e.essential = !this.isEssential(app);
        }
    };

    // Convenience: get recommended (first) version of an app
    App.recommended = function (app) {
        return (app.versions && app.versions[0]) || null;
    };

})(window.App = window.App || {});

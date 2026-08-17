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
            linux: "Linux",
            android: "Android"
        },
        VALID_PLATFORMS: ["mac", "win", "linux", "android"],
        FALLBACK_ICON: "icons/_fallback.svg"
    };

    // ---------- User data (localStorage) ----------
    const USER_DATA_KEY = "sw-hub-userdata";
    const MIGRATION_FLAG_KEY = "sw-hub-userdata-migrated-v2";

    function load() {
        try { return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {}; }
        catch (e) { return {}; }
    }

    let userData = load();

    // One-shot migration: old records were keyed by bare app name (e.g. "Obsidian"),
    // which conflates same-named apps across platforms. Rekey them to
    // "platform::name". If the app exists on multiple platforms, duplicate
    // the record to each so the user does not lose their stars / usage counts.
    // This runs once per browser (guarded by MIGRATION_FLAG_KEY).
    function migrateIfNeeded() {
        if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return;
        if (!Array.isArray(window.APPS) || window.APPS.length === 0) return; // wait until catalog loaded

        let touched = false;
        Object.keys(userData).forEach(key => {
            if (key.includes("::")) return; // already new format
            const matches = window.APPS.filter(a => a.name === key);
            if (matches.length === 0) return; // orphan, leave it alone
            matches.forEach(a => {
                const newKey = `${a.platform}::${a.name}`;
                if (!userData[newKey]) {
                    userData[newKey] = Object.assign({}, userData[key]);
                    touched = true;
                }
            });
            delete userData[key];
            touched = true;
        });

        if (touched) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        }
        localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    }

    function keyOf(app) {
        return `${app.platform}::${app.name}`;
    }

    App.user = {
        migrate: migrateIfNeeded,
        save() {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        },
        entry(app) {
            const k = keyOf(app);
            if (!userData[k]) userData[k] = { usedCount: 0, essential: null };
            return userData[k];
        },
        isEssential(app) {
            const u = userData[keyOf(app)];
            if (u && u.essential !== null && u.essential !== undefined) return u.essential;
            return !!app.essential;
        },
        usedCount(app) { return userData[keyOf(app)]?.usedCount || 0; },
        bumpUsed(app) {
            const e = this.entry(app);
            e.usedCount = (e.usedCount || 0) + 1;
        },
        toggleEssential(app) {
            const e = this.entry(app);
            e.essential = !this.isEssential(app);
        }
    };

    // Convenience: get recommended (first) version of an app
    App.recommended = function (app) {
        return (app.versions && app.versions[0]) || null;
    };

})(window.App = window.App || {});

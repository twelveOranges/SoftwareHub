/**
 * Application entry point.
 * All logic lives in js/core/ and js/modules/; this file only orchestrates
 * the async catalog load and subsequent init.
 */
(function (App) {
    "use strict";

    async function boot() {
        // Inject SVG icons into static DOM
        App.util.injectStaticIcons();

        // Apply theme early to avoid FOUC
        App.theme.init();
        App.theme.bind();

        // Load the YAML catalog files → populates window.APPS
        try {
            await App.catalog.load();
        } catch (e) {
            console.error("[boot] catalog load failed:", e);
            window.APPS = window.APPS || [];
        }

        // Migrate legacy userData keys (bare name → "platform::name").
        // Must run AFTER catalog is loaded and BEFORE first render.
        App.user.migrate();

        // Wire all event listeners now that data is available
        App.view.apply(App.state.view);   // also triggers first render
        App.router.bind();
        App.detail.bind();
        App.attachPicker.bind();
        App.download.bind();
        App.events.bind();

        // Apply initial state from URL hash (also renders)
        App.router.applyStateFromHash();

        // Refresh file sizes / release dates in the background
        App.probe.run();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

})(window.App = window.App || {});

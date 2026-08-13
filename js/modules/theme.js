/**
 * Theme switcher (light/retro/eye/sea/deep/dark/auto).
 * Exposed as window.App.theme.
 */
(function (App) {
    "use strict";

    const { dom } = App;

    function apply(pref) {
        let effective = pref;
        if (pref === "auto") {
            effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", effective);
        document.documentElement.setAttribute("data-theme-pref", pref);
        localStorage.setItem("theme", pref);

        document.querySelectorAll(".theme-menu .theme-swatch").forEach(s => {
            s.classList.toggle("active", s.dataset.theme === pref);
        });
    }

    function init() {
        const saved = localStorage.getItem("theme") || "auto";
        apply(saved);
        if (window.matchMedia) {
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
                if ((localStorage.getItem("theme") || "auto") === "auto") apply("auto");
            });
        }
    }

    function bind() {
        dom.themeBtn.addEventListener("click", e => {
            e.stopPropagation();
            dom.themeMenu.classList.toggle("open");
        });
        dom.themeMenu.addEventListener("click", e => {
            const s = e.target.closest(".theme-swatch[data-theme]");
            if (!s) return;
            apply(s.dataset.theme);
            dom.themeMenu.classList.remove("open");
        });
        document.addEventListener("click", e => {
            if (!e.target.closest(".theme-switcher")) dom.themeMenu.classList.remove("open");
        });
    }

    App.theme = { apply, init, bind };

})(window.App = window.App || {});

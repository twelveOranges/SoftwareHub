/**
 * Pure utility functions: icon rendering, byte formatting.
 * Exposed as window.App.util.
 */
(function (App) {
    "use strict";

    const { esc, consts } = App;

    // ---------- Lucide SVG icon lookup ----------
    function icon(name, size = 16) {
        const raw = (window.ICONS && window.ICONS[name]) || "";
        if (!raw) return "";
        if (size !== 16) return raw.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
        return raw;
    }

    function injectStaticIcons(root = document) {
        root.querySelectorAll(".icon[data-icon]").forEach(el => {
            if (el.dataset.rendered === "1") return;
            el.innerHTML = icon(el.dataset.icon);
            el.dataset.rendered = "1";
        });
    }

    function starIcon(active) {
        return icon(active ? "starFilled" : "star", 14);
    }

    // ---------- App icon rendering (img vs emoji fallback) ----------
    function isImageIcon(str) {
        return typeof str === "string" && /\.(png|jpe?g|svg|webp|gif)$/i.test(str);
    }

    function renderIcon(iconValue, alt = "") {
        if (isImageIcon(iconValue)) {
            return `<img src="${esc.attr(iconValue)}" alt="${esc.attr(alt)}" loading="lazy"
                         onerror="this.onerror=null;this.src='${consts.FALLBACK_ICON}';this.classList.add('icon-fallback')">`;
        }
        return esc.html(iconValue || "");
    }

    // ---------- Byte size formatting ----------
    function formatBytes(n) {
        if (n === 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(n) / Math.log(1024));
        const v = n / Math.pow(1024, i);
        return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${units[i]}`;
    }

    App.util = { icon, injectStaticIcons, starIcon, renderIcon, formatBytes };

})(window.App = window.App || {});

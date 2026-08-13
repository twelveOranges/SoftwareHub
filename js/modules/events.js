/**
 * Global event wiring:
 *   - Search input (debounced) + "/" keyboard shortcut
 *   - Top-nav platform switching (keeps current category)
 *   - Sidebar category switching (keeps current platform)
 *   - Sort buttons
 *   - Logo click → return to Mac home
 *   - Card/row clicks (star toggle, direct download, open detail)
 *   - Global Esc handling (attach picker > detail modal)
 * Exposed as window.App.events.
 */
(function (App) {
    "use strict";

    const { dom, user, router, render, view, detail, attachPicker } = App;

    let searchTimer;

    function bind() {
        // ---------- Search ----------
        function runSearch() {
            App.state.keyword = dom.searchInput.value.trim();
            router.updateHash();
            render.render();
        }

        dom.searchInput.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(runSearch, 200);
        });
        dom.searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") { clearTimeout(searchTimer); runSearch(); }
            if (e.key === "Escape") { dom.searchInput.value = ""; runSearch(); }
        });

        // ---------- Top nav: platform ----------
        // Preserves current category (e.g. "Mac + 游戏" → click Windows → "Windows + 游戏")
        document.querySelectorAll(".nav-item").forEach(el => {
            if (el.dataset.platform === undefined) return;
            el.addEventListener("click", e => {
                e.preventDefault();
                App.state.platform = el.dataset.platform;
                router.updateHash();
                render.render();
            });
        });

        // ---------- Sidebar: category ----------
        dom.categoryList.addEventListener("click", e => {
            const item = e.target.closest(".category-item");
            if (!item) return;
            App.state.category = item.dataset.category;
            router.updateHash();
            render.render();
        });

        // ---------- Sort ----------
        document.querySelectorAll(".sort-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                App.state.sort = btn.dataset.sort;
                render.render();
            });
        });

        // ---------- Logo → Mac home ----------
        document.querySelector(".logo")?.addEventListener("click", e => {
            e.preventDefault();
            App.state.platform = "mac";
            App.state.category = "all";
            App.state.keyword = "";
            dom.searchInput.value = "";
            router.updateHash();
            render.render();
        });

        // ---------- Card / row clicks ----------
        dom.appGrid.addEventListener("click", e => {
            const target = e.target;
            const card = target.closest(".app-card, .app-row");
            if (!card) return;

            const key = card.dataset.key;
            const app = window.APPS.find(a => `${a.platform}::${a.name}` === key);
            if (!app) return;

            // Star toggle
            if (target.closest("[data-action='star']")) {
                e.stopPropagation();
                user.toggleEssential(app);
                user.save();
                render.render();
                return;
            }

            // Direct download button (list view only)
            if (target.closest("[data-action='dl']")) {
                e.stopPropagation();
                user.bumpUsed(app);
                user.save();
                setTimeout(render.render, 100);
                return;
            }

            detail.open(app);
        });

        // ---------- Global keyboard ----------
        document.addEventListener("keydown", e => {
            // "/" focuses the search box (unless already typing there)
            if (e.key === "/" && document.activeElement !== dom.searchInput && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                dom.searchInput.focus();
                dom.searchInput.select();
                return;
            }
            // Esc closes attach picker (priority) or detail modal
            if (e.key === "Escape") {
                if (attachPicker.isOpen()) attachPicker.close();
                else detail.close();
            }
        });
    }

    App.events = { bind };

})(window.App = window.App || {});

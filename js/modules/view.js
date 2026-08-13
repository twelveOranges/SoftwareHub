/**
 * View mode toggle (grid vs list).
 * Exposed as window.App.view.
 */
(function (App) {
    "use strict";

    const { dom, util } = App;

    function apply(view) {
        App.state.view = view;
        localStorage.setItem("view", view);
        document.documentElement.setAttribute("data-view", view);
        // Button shows the icon of the OTHER view (i.e. what you'd switch to)
        dom.viewIcon.innerHTML = util.icon(view === "list" ? "grid" : "list");
        dom.viewIcon.dataset.rendered = "1";
        dom.viewToggleBtn.title = view === "list" ? "切换到网格视图" : "切换到列表视图";
        App.render.render();
    }

    function bind() {
        dom.viewToggleBtn.addEventListener("click", () => {
            apply(App.state.view === "list" ? "grid" : "list");
        });
    }

    App.view = { apply, bind };

})(window.App = window.App || {});

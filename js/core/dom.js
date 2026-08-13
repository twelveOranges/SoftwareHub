/**
 * DOM cache and HTML/attribute escaping utilities.
 * Exposed as window.App.dom (all element refs), window.App.$ (helper),
 * and window.App.esc (escape utilities).
 */
(function (App) {
    "use strict";

    const $ = id => document.getElementById(id);
    App.$ = $;

    App.dom = {
        // Layout
        appGrid:        $("appGrid"),
        emptyState:     $("emptyState"),
        contentTitle:   $("contentTitle"),
        resultCount:    $("resultCount"),
        searchInput:    $("searchInput"),
        categoryList:   $("categoryList"),
        themeBtn:       $("themeBtn"),
        themeMenu:      $("themeMenu"),
        themeIcon:      $("themeIcon"),
        viewToggleBtn:  $("viewToggleBtn"),
        viewIcon:       $("viewIcon"),
        batchDownloadBtn: $("batchDownloadBtn"),

        // Detail modal
        modalMask:              $("modalMask"),
        modalClose:             $("modalClose"),
        modalIcon:              $("modalIcon"),
        modalTitle:             $("modalTitle"),
        modalDesc:              $("modalDesc"),
        modalTags:              $("modalTags"),
        modalNote:              $("modalNote"),
        modalVersionList:       $("modalVersionList"),
        modalVersionHint:       $("modalVersionHint"),
        modalAttachmentsSection:$("modalAttachmentsSection"),
        modalAttachmentList:    $("modalAttachmentList"),
        modalAttachmentsHint:   $("modalAttachmentsHint"),
        modalStarBtn:           $("modalStarBtn"),

        // Attachment picker modal
        attachPickerMask:    $("attachPickerMask"),
        attachPickerClose:   $("attachPickerClose"),
        attachPickerSkip:    $("attachPickerSkip"),
        attachPickerConfirm: $("attachPickerConfirm"),
        attachPickerTree:    $("attachPickerTree"),
        attachPickerSummary: $("attachPickerSummary"),
        attachPickerDesc:    $("attachPickerDesc")
    };

    // ---------- Escape helpers ----------
    const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, s => HTML_ESCAPES[s]);
    }

    App.esc = {
        html: escapeHtml,
        attr: escapeHtml  // HTML-attr escape has the same rules for our usage
    };

})(window.App = window.App || {});

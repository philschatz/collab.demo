(function() {

  Aloha.ready(function() {
    /*
       Generate a little button next to the cursor that allows quick access to adding semantic tags around text or converting bland elements like sections (headings) into more semantically rich elements like exercises
    */
    /*
       Also, has code for supporting drag-and-drop handles
    */
    var $cmd, $context, $document, $handle, $icon, $menu, $overlay, buttons, changeHandler, cmd, dragScope, getSelectionRect, showContext, _i, _len;
    getSelectionRect = function(rangeObject) {
      if (!rangeObject.getStartDocumentPos) {
        console.error("Couldn't call getStartDocumentPos on rangy (wrong ver of rangy and proper plugins not installed");
        return null;
      }
      return {
        start: rangeObject.getStartDocumentPos(),
        end: rangeObject.getEndDocumentPos()
      };
    };
    showContext = function(rangeObject) {
      var position, selection;
      selection = getSelectionRect(rangeObject);
      if (selection) {
        position = {};
        position.left = selection.end.x;
        position.top = selection.end.y;
        $context.css(position);
        return $icon.fadeIn("fast");
      } else {
        return $icon.hide();
      }
    };
    $document = Aloha.jQuery(".document");
    $overlay = Aloha.jQuery("body");
    $context = Aloha.jQuery("<div class=\"context-cursor\"/>").appendTo($overlay);
    $icon = Aloha.jQuery("<div class=\"context-icon\">&#160;^</div>").hide().appendTo($context);
    $menu = Aloha.jQuery("<div class=\"context-menu\"/>").hide().appendTo($context);
    buttons = [];
    buttons.push({
      title: "Term",
      command: "cmd-term",
      markup: "<span class=\"term\"/>",
      shortcut: "ctrl+shift+t"
    });
    buttons.push({
      title: "Note",
      command: "cmd-note",
      markup: "<span class=\"note\"/>",
      shortcut: "ctrl+shift+n"
    });
    buttons.push({
      title: "Quote",
      command: "cmd-quote",
      markup: "<q />",
      shortcut: "ctrl+shift+q"
    });
    buttons.push({
      title: "Footnote",
      command: "cmd-footnote",
      markup: "<span class=\"footnote\"/>",
      shortcut: "ctrl+shift+f"
    });
    for (_i = 0, _len = buttons.length; _i < _len; _i++) {
      cmd = buttons[_i];
      $cmd = Aloha.jQuery("<div href=\"#\" title=\"" + cmd.title + " (" + cmd.shortcut + ")\" class=\"command " + cmd.command + "\" command=\"" + cmd.command + "\"><span>" + cmd.title + "</span></div>");
      $cmd.click(function() {
        var markup, rangeObject;
        markup = jQuery(cmd.markup);
        rangeObject = Aloha.Selection.rangeObject;
        if (rangeObject.isCollapsed()) GENTICS.Utils.Dom.extendToWord(rangeObject);
        return Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(markup));
      });
      $cmd.appendTo($menu);
    }
    $icon.bind("click", function(evt) {
      evt.stopPropagation();
      $menu.show();
      return $overlay.click(function() {
        $menu.hide();
        return $icon.hide();
      });
    });
    $handle = Aloha.jQuery("<div class=\"handle\" contenteditable=\"false\"></div>").hide().appendTo("body");
    changeHandler = function(event, rangeObject) {
      var $end, $start, css, end, range, ranges, sel, start;
      sel = rangy.getSelection();
      ranges = sel.getAllRanges();
      if (ranges.length === 0) return;
      range = rangeObject || ranges[0];
      start = range.startContainer;
      end = range.endContainer;
      if (rangeObject.getStartDocumentPos) {
        showContext(rangeObject);
      } else {
        console.warn("Not displaying context icon because rangy is missing the rangy-position plugin for pixel-calculation of cursor position");
        $icon.hide();
      }
      $start = Aloha.jQuery(start).parent("h1,h2,h3,h4,h5,h6,p");
      $end = Aloha.jQuery(end).parent("h1,h2,h3,h4,h5,h6,p");
      css = {};
      if ($start.offset() !== null && $end.offset() !== null) {
        css.top = $start.offset().top;
        css.height = $end.offset().top + $end.height() - css.top;
        $handle.data({
          node: $start
        });
        return $handle.css(css).show();
      } else {
        return $handle.hide();
      }
    };
    Aloha.bind("aloha-selection-changed", changeHandler);
    $document.bind("focus", function(evt) {
      return setTimeout((function() {
        return changeHandler(evt, Aloha.Selection.rangeObject);
      }), 10);
    });
    dragScope = "blockish-nodes-only";
    return $handle.draggable({
      scope: dragScope,
      revert: "invalid",
      cursor: "move",
      start: function(el) {
        var $blocks;
        $blocks = $document.find("h1,h2,h3,h4,h5,h6,p");
        return $blocks.droppable({
          scope: dragScope,
          hoverClass: "drop-before",
          drop: function(event, ui) {
            ui.draggable.data("node").insertBefore(Aloha.jQuery(this));
            return ui.draggable.attr("style", "");
          }
        });
      }
    });
  });

  Aloha.ready(function() {
    var $document;
    Aloha.jQuery("<script src=\"./lib/jquery-ui.min.js\"></script>").appendTo("body");
    $document = Aloha.jQuery(".document");
    return $document.aloha();
  });

}).call(this);

Aloha.ready ->

  ###
   Generate a little button next to the cursor that allows quick access to adding semantic tags around text or converting bland elements like sections (headings) into more semantically rich elements like exercises
  ###

  ###
   Also, has code for supporting drag-and-drop handles
  ###

  # Helper functions to get the exact position of the editable cursor (caret)
  getSelectionRect = (rangeObject) ->
    unless rangeObject.getStartDocumentPos
      console.error "Couldn't call getStartDocumentPos on rangy (wrong ver of rangy and proper plugins not installed"
      return null
    start: rangeObject.getStartDocumentPos()
    end: rangeObject.getEndDocumentPos()
  showContext = (rangeObject) ->
    selection = getSelectionRect(rangeObject)
    if selection
      position = {}
      position.left = selection.end.x
      position.top = selection.end.y
      $context.css position
      $icon.fadeIn "fast"
    else
      $icon.hide()

  # Create the elements needed for context popup
  $document = Aloha.jQuery(".document")
  $overlay = Aloha.jQuery("body")
  $context = Aloha.jQuery("<div class=\"context-cursor\"/>").appendTo($overlay)
  $icon = Aloha.jQuery("<div class=\"context-icon\">&#160;^</div>").hide().appendTo($context)
  $menu = Aloha.jQuery("<div class=\"context-menu\"/>").hide().appendTo($context)
  # These are the semanticly rich buttons
  buttons = []
  buttons.push
    title: "Term"
    command: "cmd-term"
    markup: "<span class=\"term\"/>"
    shortcut: "ctrl+shift+t"
  buttons.push
    title: "Note"
    command: "cmd-note"
    markup: "<span class=\"note\"/>"
    shortcut: "ctrl+shift+n"
  buttons.push
    title: "Quote"
    command: "cmd-quote"
    markup: "<q />"
    shortcut: "ctrl+shift+q"
  buttons.push
    title: "Footnote"
    command: "cmd-footnote"
    markup: "<span class=\"footnote\"/>"
    shortcut: "ctrl+shift+f"

  for cmd in buttons
    $cmd = Aloha.jQuery("<div href=\"#\" title=\"" + cmd.title + " (" + cmd.shortcut + ")\" class=\"command " + cmd.command + "\" command=\"" + cmd.command + "\"><span>" + cmd.title + "</span></div>")
    $cmd.click ->
      markup = jQuery(cmd.markup)
      rangeObject = Aloha.Selection.rangeObject
      GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()
      Aloha.Selection.changeMarkupOnSelection Aloha.jQuery(markup)

    $cmd.appendTo $menu

  $icon.bind "click", (evt) ->
    evt.stopPropagation() # Stop propagation so the editor doesn't lose focus
    $menu.show()
    $overlay.click ->
      $menu.hide()
      $icon.hide()

  $handle = Aloha.jQuery("<div class=\"handle\" contenteditable=\"false\"></div>").hide().appendTo("body")
  
  changeHandler = (event, rangeObject) ->
    sel = rangy.getSelection()
    ranges = sel.getAllRanges()
    return  if ranges.length is 0

    range = rangeObject || ranges[0]
    start = range.startContainer
    end = range.endContainer
    if rangeObject.getStartDocumentPos
      showContext rangeObject
    else
      console.warn "Not displaying context icon because rangy is missing the rangy-position plugin for pixel-calculation of cursor position"
      $icon.hide()
    $start = Aloha.jQuery(start).parent("h1,h2,h3,h4,h5,h6,p")
    $end = Aloha.jQuery(end).parent("h1,h2,h3,h4,h5,h6,p")
    css = {}
    if $start.offset() != null and $end.offset() != null
      css.top = $start.offset().top
      css.height = $end.offset().top + $end.height() - css.top
      $handle.data node: $start
      $handle.css(css).show()
    else
      $handle.hide()

  Aloha.bind "aloha-selection-changed", changeHandler
  # On focus the cursor isn't available yet so fire the event after a period of time
  $document.bind "focus", (evt) ->
    setTimeout (() -> changeHandler evt, Aloha.Selection.rangeObject), 10

  dragScope = "blockish-nodes-only"
  $handle.draggable
    scope: dragScope
    revert: "invalid"
    cursor: "move"
    start: (el) ->
      $blocks = $document.find("h1,h2,h3,h4,h5,h6,p")
      $blocks.droppable
        scope: dragScope
        hoverClass: "drop-before"
        drop: (event, ui) ->
          ui.draggable.data("node").insertBefore Aloha.jQuery(this)
          ui.draggable.attr "style", ""

Aloha.ready ->
  Aloha.jQuery("<script src=\"./lib/jquery-ui.min.js\"></script>").appendTo "body"
  $document = Aloha.jQuery(".document")
  $document.aloha()

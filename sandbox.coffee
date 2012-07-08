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
  Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
    sel = rangy.getSelection()
    ranges = sel.getAllRanges()
    return  if ranges.length is 0
    range = rangeObject
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
  Aloha.jQuery(".document").aloha()


###
  Try to start up the collaboration server
###
Aloha.ready ->
  $ = Aloha.jQuery
  
  if io?
    ###
    socket = null
    for url in [ 'http://localhost:3001', 'http://boole.cnx.rice.edu', '' ]
      socket = io.connect url
      if socket
        true
    ###
    socket = io.connect 'http://localhost:3001'
    
    if socket
  
      debugReceive = (command) ->
        socket.on command, (message) ->
          console.log 'Received: ' + command, message
      
      debugReceive 'user:hello'
      debugReceive 'user:list'
      debugReceive 'user:join'
      debugReceive 'user:leave'
      debugReceive 'node:select'
      debugReceive 'node:operation'
  
  
      # Replace the document with one from the server
      $doc = $('.document')
      $doc[0].innerHTML = ''
      
      users = {} # This will be populated by active users
      me = null
      
      socket.on 'user:hello', (msg) ->
        me = msg
  
      socket.on 'user:join', (msg) ->
        users[msg.id] = msg.color
  
      socket.on 'user:leave', (msg) ->
        delete users[msg.id]
      
      # Replay changes made by others
      socket.on 'node:operation', (msg) ->
       switch msg.op
         when 'append'
           parent = $doc
           parent = $('#' + msg.context) if msg.context
           $el = $(msg.html).attr('id', msg.id).appendTo(parent)
          else
            console.log 'Could not understand operation ', msg.op, msg
  
      # Update the handle bars when a selection change occurs
      socket.on 'node:select', (msg) ->
        # Remove all handles TODO: reduce flicker
        $('.handle').remove()
        $('.remote-selected').removeClass('remote-selected').removeAttr('contenteditable')
        
        for node, user of msg
          $node = $('#' + node)

          $handle = $("<div id='#{ node }-handle' contenteditable='false'></div>").addClass('handle')
          $handle.addClass('handle').hide().appendTo('body')

          $handle.attr('style', "background-color: #{ users[user] };")
          css = {}
          css.top = $node.offset().top
          css.height = $node.height()
          $handle.data node: $node
          $handle.css(css).show()
          
          if user != me.id
            $node.addClass('remote-selected')
            $node.attr('contenteditable', false)
  
      socket.on 'node:update', (msg) ->
        $('#' + msg.id)[0].innerHTML = msg.html

      # Lock a node when selection changes
      Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
        parent = $(rangeObject.startContainer).parents('*[id]').first()
        id = parent.attr('id')
        socket.emit 'node:select', [ id ]
        
        # The selection also changes every time text is edited
        socket.emit 'node:update', { id: id, html: parent[0].innerHTML }

    else
      console.warn 'Could not find a collaboration server'

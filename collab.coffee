###
  Try to start up the collaboration server
###
Aloha.ready ->
  if window.io?
    $ = Aloha.jQuery

    $doc = $('.document')
    shared =
      socket: null # Shared between enable and reset
      changeHandler: null

    reset = () ->
      shared.socket.emit 'document:reset'
      $doc[0].innerHTML = '<h1>Heading</h1><p>Paragraph Text</p><h2>Sub Heading</h2><p>Paragraph Text</p><h3>Sub-Sub Heading</h3><p>Paragraph Text</p><h2>Sub Heading</h2><p>Paragraph Text</p><ol><li>Item 1</li><ul><li>Sub Item 1</li><li>Sub Item 2</li></ul><li>Item 2</li></ol><p>Some formatting: <b>bold</b>, <i>italics</i>, <sub>subscript</sub>, <q>quote</q>, <a href="http://cnx.org">link</a>.<p>'
      shared.changeHandler(null, null)

    enable = (evt, url) ->
      
      unless url? then url = prompt 'What is the collaboration server URL?', 'http://localhost:3001'
      shared.socket = socket = io.connect url
    
      socket.on 'connect', () ->
        debugReceive = (command) ->
          socket.on command, (message) ->
            if command == 'node:operation'
              console.log 'Received: OP: ' + message.op, message
            else
              console.log 'Received: ' + command, message
        
        debugReceive 'document.reset'
        debugReceive 'user:hello'
        debugReceive 'user:list'
        debugReceive 'user:join'
        debugReceive 'user:leave'
        debugReceive 'node:select'
        debugReceive 'node:operation'
        debugReceive 'node:update'
    
        $doc[0].innerHTML = ''
        resetBtn.setDisabled false # Enable resetting of the document
    
        users = {} # This will be populated by active users
        me = null
        
        # Replay changes made by others
        onOperation = (msg) ->
         switch msg.op
           when 'append'
             $context = $doc
             $context = $('#' + msg.context) if msg.context
             $el = $(msg.html).attr('id', msg.node).appendTo($context)
           when 'insertbefore'
             $context = $('#' + msg.context)
             $el = $(msg.html).attr('id', msg.node).insertBefore($context)
           when 'delete'
             $context = $('#' + msg.context)
             $context.remove()
           else
              console.log 'Could not understand operation ', msg.op, msg
  
        socket.on 'node:operation', onOperation
  
        socket.on 'document:reset', () ->
          $doc[0].innerHTML = ''
        
        socket.on 'user:hello', (msg) ->
          me = msg
    
        socket.on 'user:join', (msg) ->
          users[msg.user] = msg.color
    
        socket.on 'user:leave', (msg) ->
          delete users[msg.user]
          
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
            
            if user != me.user
              $node.addClass('remote-selected')
              $node.attr('contenteditable', false)
    
        socket.on 'node:update', (msg) ->
          setTimeout( () ->
            n = $('#' + msg.node)
            if n.length
              n[0].innerHTML = msg.html
          , 100)
    
        autoId = 0 # Incremented
        # Lock a node when selection changes
        shared.changeHandler = (event, rangeObject) ->
          if rangeObject
            $parent = $(rangeObject.startContainer).parents('*[id]').first()
            if $parent.length && $doc[0] != $parent[0]
              # make sure the element is a descendant of the document
              if $parent.parents().index($doc) >= 0
                node = $parent.attr('id')
                socket.emit 'node:select', [ node ]
              
                # The selection also changes every time text is edited
                socket.emit 'node:update', { node: node, html: $parent[0].innerHTML }

          # If anything doesn't have @id's treat them as appends
          # The user created a new element by pressing Enter
          # Either it's a insertbefore or an append message
          # Find the new node
          for orphan in $doc.children('*:not([id])')
            $orphan = $(orphan)
  
            id = "auto-#{ me.user }-id#{ ++autoId }"
            html = orphan.outerHTML
            $orphan.attr('id', id)
  
            # The user probably hit enter. so update the previous node
            $prev = $orphan.prev('*[id]')
            if $prev.length
              if $prev.parents().index($doc) >= 0
                socket.emit 'node:update',
                  node: $prev.attr 'id'
                  html: $prev[0].innerHTML
  
            $next = $orphan.next('*[id]')
            if $next.length
              op = 'insertbefore'
              context = $next.attr 'id'
            else
              op = 'append'
              # For now, collab doesn't do nesting. append is always on the doc
              context = null
              #if $doc[0] = parent.parent()[0]
              #  context = null
              #else 
              #  context = parent.parent().attr 'id'
            socket.emit 'node:operation'
              op: op
              node: id
              context: context
              html: html
            socket.emit 'node:select', [ id ]
  
        Aloha.bind "aloha-selection-changed", shared.changeHandler
        # On focus the cursor isn't available yet so fire the event after a period of time
        $doc.bind "focus", (evt) ->
          setTimeout (() ->
            sel = rangy.getSelection()
            ranges = sel.getAllRanges()
            return  if ranges.length is 0
            rangeObject = ranges[0]
            shared.changeHandler evt, rangeObject), 10

    resetBtn = new appmenu.MenuItem('Reset Document', {accel: 'Meta+Shift+E', action: reset, disabled: true})

    window.menubar.append(new appmenu.MenuButton('Collaborate!', new appmenu.Menu([
      new appmenu.MenuItem('Enable!', {accel: 'Meta+E', action: (evt) -> enable evt, 'http://boole.cnx.rice.edu:3001'})
      resetBtn
      new appmenu.Separator()
      new appmenu.MenuItem('Enable localhost (dev)', {accel: 'Meta+Shift+L', action: (evt) -> enable evt, 'http://localhost:3001'})
      new appmenu.MenuItem('Enable...', {action: enable})
    ])))

###
  Try to start up the collaboration server
###
Aloha.ready ->
  $ = Aloha.jQuery

  window.collaborate = (url, $doc) ->
    socket = io.connect url
  
    socket.on 'connect', () ->
      debugReceive = (command) ->
        socket.on command, (message) ->
          console.log 'Received: ' + command, message
      
      debugReceive 'user:hello'
      debugReceive 'user:list'
      debugReceive 'user:join'
      debugReceive 'user:leave'
      debugReceive 'node:select'
      debugReceive 'node:operation'
  
  
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
        # Send a reset and then send the current document
        els = $doc.children() # Save the children before deleting them with 'document:reset'
        $doc[0].innerHTML = ''
        socket.emit 'document:reset'
        nextId = 0
        for el in els
          id ="id-#{ ++nextId }"
          $(el).attr 'id', id
          operation =
            op: 'append'
            node: id
            context: null
            html: el.outerHTML
          socket.emit 'node:operation', operation
          onOperation operation
  
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
          $('#' + msg.node)[0].innerHTML = msg.html
        , 100)
  
      autoId = 0 # Incremented
      # Lock a node when selection changes
      changeHandler = (event, rangeObject) ->
        parent = $(rangeObject.startContainer).parents('*[id]').first()
        if parent.length && $doc[0] != parent[0]
          node = parent.attr('id')
          socket.emit 'node:select', [ node ]
          
          # The selection also changes every time text is edited
          socket.emit 'node:update', { node: node, html: parent[0].innerHTML }
        else
          # The user created a new element by pressing Enter
          # Either it's a insertbefore or an append message
          # Find the new node

          parent = $doc.children('*:not([id])').first()
          id = "auto-#{ me.user }-id#{ ++autoId }"
          html = parent[0].outerHTML
          parent.attr('id', id)

          # The user probably hit enter. so update the previous node          
          socket.emit 'node:update',
            node: parent.prev().attr 'id'
            html: parent.prev()[0].innerHTML


          next = parent.nextAll('*[id]').first()
          if next.length
            op = 'insertbefore'
            context = next.attr 'id'
          else
            op = 'append'
            if $doc[0] = parent.parent()[0]
              context = null
            else 
              context = parent.parent().attr 'id'
          socket.emit 'node:operation'
            op: op
            node: id
            context: context
            html: html
          socket.emit 'node:select', [ id ]

      Aloha.bind "aloha-selection-changed", changeHandler
      # On focus the cursor isn't available yet so fire the event after a period of time
      Aloha.jQuery('.document').bind "focus", (evt) ->
        setTimeout (() ->
          sel = rangy.getSelection()
          ranges = sel.getAllRanges()
          return  if ranges.length is 0
          rangeObject = ranges[0]
          changeHandler evt, rangeObject), 10
    
  
  if io?

    $('.collaborate').show()
    $('.collaborate a').bind 'mousedown', (evt) ->
      evt.preventDefault()
      window.collaborate window.socketUrl, $('.document')

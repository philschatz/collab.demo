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
      
      socket.on 'user:hello', (msg) ->
        me = msg
        # Replace the document with one from the server
        $doc[0].innerHTML = ''
  
      socket.on 'user:join', (msg) ->
        users[msg.user] = msg.color
  
      socket.on 'user:leave', (msg) ->
        delete users[msg.user]
      
      # Replay changes made by others
      socket.on 'node:operation', (msg) ->
       switch msg.op
         when 'append'
           $context = $doc
           $context = $('#' + msg.context) if msg.context
           $el = $(msg.html).attr('id', msg.node).appendTo($context)
         when 'insertbefore'
           $context = $('#' + msg.context)
           $el = $(msg.html).attr('id', msg.node).insertBefore($context)
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
          
          if user != me.user
            $node.addClass('remote-selected')
            $node.attr('contenteditable', false)
  
      socket.on 'node:update', (msg) ->
        setTimeout( () ->
          $('#' + msg.node)[0].innerHTML = msg.html
        , 100)
  
      autoId = 0 # Incremented
      # Lock a node when selection changes
      Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
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
          
  
  if io?

    $('.collaborate').show()
    $('.collaborate a').bind 'mousedown', (evt) ->
      evt.preventDefault()
      window.collaborate window.socketUrl, $('.document')

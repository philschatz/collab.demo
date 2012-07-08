###
  Try to start up the collaboration server
###
Aloha.ready ->
  $ = Aloha.jQuery
  
  if io?

    $('.collaborate').show()
    $('.collaborate a').bind 'mousedown', (evt) ->
      evt.preventDefault()
  
      socket = io.connect window.socketUrl
  
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

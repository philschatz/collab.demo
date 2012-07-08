module.exports = (app) ->
  ###
  Communication protocol:
  
  server              client
  ---------------------------
                  <--    connect
  user:hello  -->
  (operations)*   -->
  node:selected   -->
  user:join     -->>
  
  
                  <--  node:select
  node:select   -->>
  
  
                  <--  node:move
  node:moved      -->> { rev++ }
  
  
                  <-- node:update
  node:updated    -->> { rev++ }
  
  
  
  user: the socket id
  ###

  socketio = require('socket.io')
  io = socketio.listen(app)
  COLORS = [ '#cc3333', '#3333cc', '#cccc33', '#cc33cc' ]
  lastColor = 0
  locks = {}
  history = []
  sessions = {}
  
  
  ###
    Add some operations that create a sample collaborative document
  ###
  populateId = 0
  populate = (outerHTML, context=null) ->
    history.push
      command: 'node:operation'
      message:
        op: 'append'
        node: "id-#{ ++populateId }"
        context: context
        html: outerHTML
    "id-#{ populateId }"

  populate '<h1>Campaign Finance Reform</h1>'
  populate '<h2>Current proposals for reform</h2>'
  dollarsId = populate '<h3>Voting with dollars</h3>'
  populate '<p>The voting with dollars plan would establish a system of modified <span class="term">public financing</span> coupled with an anonymous campaign contribution process. It has two parts: patriot dollars and the secret donation booth. It was originally described in detail by Yale Law School professors Bruce Ackerman and Ian Ayres in their 2004 book Voting with Dollars: A new paradigm for campaign finance.[7] All voters would be given a $50 publicly funded voucher (Patriot dollars) to donate to federal political campaigns. All donations including both the $50 voucher and additional private contributions, must be made anonymously through the FEC. Ackerman and Ayres include model legislation in their book in addition to detailed discussion as to how such a system could be achieved and its legal basis.</p>'
  populate '<h2>Matching Funds</h2>'
  populate '<p>Another paragraph with one<sub>subscript</sub>.</p>'
  
  
  # Keep track of messages emitted so new clients can 'catch up'
  emitAll = (command, params) ->
    console.log "Emit(all) #{ command }"
    io.sockets.emit command, params

  io.sockets.on 'connection', (socket) ->
    emit = (command, params) ->
      console.log "Emit(one) #{ command }"
      socket.emit command, params

    color = COLORS[lastColor++ % COLORS.length]
    sessions[socket.id] = color
    
    # Let the client know which user they are
    emit 'user:hello',
      user: socket.id
      color: color

    # Let everyone know this client has joined in
    socket.broadcast.emit 'user:join',
      user: socket.id
      color: color

    # Give the client a list of active users
    for user, color of sessions
      emit 'user:join',
        user: socket.id
        color: color
    
    # Send a history of changes
    for h in history
      emit h.command, h.message

    # Send a set of locked elements
    emitAll 'node:select', locks
    
    # When a user tries to lock something lock it
    socket.on 'node:select', (nodes) ->
      # Remove all locks this user has
      for node, user of locks
        if user == socket.id
          delete locks[node]
      
      for node in nodes
        if not locks[node]
          locks[node] = socket.id
      emitAll('node:select', locks)

    # Handle document operations
    socket.on 'node:operation', (operation) ->
      # TODO: Check that it's a valid operation
      operation.user = socket.id # Just for good measure/debugging?
      socket.broadcast.emit('node:operation', operation)
      history.push { command: 'node:operation', message: operation }

    # Broadcast edits
    socket.on 'node:update', (msg) ->
      node = msg.node
      # TODO: Check that it's a valid operation
      # operation.user = socket.id # Just for good measure/debugging?
      socket.broadcast.emit 'node:update', msg
      
      # Search through the history and if there's already an edit for this node collapse it
      replacedAnotherEdit = false
      for entry in history
        if entry.command == 'node:update'
          if entry.message.node == node
            entry.message = msg
            replacedAnotherEdit = true
        
      if not replacedAnotherEdit
        history.push { command: 'node:update', message: msg }

    # Handle disconnects by notifying everyone the user disconnected
    socket.on 'disconnect', ->
      emitAll 'user:leave', socket.id

      # Remove all locks held by this user
      for node, user of locks
        if user == socket.id
          delete locks[node]

      emitAll 'node:select', locks

      delete sessions[socket.id]
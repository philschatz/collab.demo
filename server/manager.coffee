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
    
    # Let the client know whic user they are
    emit 'user:hello',
      id: socket.id
      color: color

    # Give the client a list of active users
    emit 'user:list', sessions
    
    # Let everyone know this client has joined in
    emitAll 'user:join',
      id: socket.id
      color: color

    # Send a set of locked elements
    emitAll 'node:select', locks
    
    # When a user tries to lock something lock it
    socket.on 'node:select', (nodes) ->
      for node in nodes
        if not locks[node]
          locks[node] = socket.id
      emitAll('node:select', locks)

    # Handle document operations
    socket.on 'node:operation', (operation) ->
      # Check that this user has a lock on the node
      if socket.id == locks[node]
        # TODO: Check that it's a valid operation
        # operation.user = socket.id # Just for good measure/debugging?
        emitAll('node:operation', operation)
        history.push operation
      else
        console.log "USER DOESN'T HAVE A LOCK ON THE NODE!"

    # Handle disconnects by notifying everyone the user disconnected
    socket.on 'disconnect', ->
      emitAll 'user:leave', socket.id

      # Remove all locks held by this user
      for node, user of locks
        if user == socket.id
          delete locks[node]

      emitAll 'node:select', locks

      delete sessions[socket.id]
(function() {

  module.exports = function(app) {
    /*
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
    */
    var COLORS, emitAll, history, io, lastColor, locks, sessions, socketio;
    socketio = require('socket.io');
    io = socketio.listen(app);
    COLORS = ['#cc3333', '#3333cc', '#33cc33', '#cccc33', '#cc33cc', '#33cccc'];
    lastColor = 0;
    locks = {};
    history = [];
    sessions = {};
    emitAll = function(command, params) {
      console.log("Emit(all) " + command);
      return io.sockets.emit(command, params);
    };
    return io.sockets.on('connection', function(socket) {
      var color, emit, h, user, _i, _len;
      emit = function(command, params) {
        console.log("Emit(one) " + command);
        return socket.emit(command, params);
      };
      color = COLORS[lastColor++ % COLORS.length];
      sessions[socket.id] = color;
      emit('user:hello', {
        user: socket.id,
        color: color
      });
      socket.broadcast.emit('user:join', {
        user: socket.id,
        color: color
      });
      for (user in sessions) {
        color = sessions[user];
        emit('user:join', {
          user: socket.id,
          color: color
        });
      }
      for (_i = 0, _len = history.length; _i < _len; _i++) {
        h = history[_i];
        emit(h.command, h.message);
      }
      emitAll('node:select', locks);
      socket.on('document:reset', function(nodes) {
        var node;
        while (history.length) {
          history.pop();
        }
        for (node in locks) {
          delete locks[node];
        }
        socket.broadcast.emit('document:reset');
        return emitAll('node:select', locks);
      });
      socket.on('node:select', function(nodes) {
        var node, user, _j, _len2;
        for (node in locks) {
          user = locks[node];
          if (user === socket.id) delete locks[node];
        }
        for (_j = 0, _len2 = nodes.length; _j < _len2; _j++) {
          node = nodes[_j];
          if (!locks[node]) locks[node] = socket.id;
        }
        return emitAll('node:select', locks);
      });
      socket.on('node:operation', function(operation) {
        var index, item, _len2, _results;
        operation.user = socket.id;
        socket.broadcast.emit('node:operation', operation);
        switch (operation.op) {
          case 'delete':
            _results = [];
            for (index = 0, _len2 = history.length; index < _len2; index++) {
              item = history[index];
              if (item.message.node === operation.node) {
                history.splice(index, 1);
                break;
              } else {
                _results.push(void 0);
              }
            }
            return _results;
            break;
          default:
            return history.push({
              command: 'node:operation',
              message: operation
            });
        }
      });
      socket.on('node:update', function(msg) {
        var entry, node, replacedAnotherEdit, _j, _len2;
        node = msg.node;
        socket.broadcast.emit('node:update', msg);
        replacedAnotherEdit = false;
        for (_j = 0, _len2 = history.length; _j < _len2; _j++) {
          entry = history[_j];
          if (entry.command === 'node:update') {
            if (entry.message.node === node) {
              entry.message = msg;
              replacedAnotherEdit = true;
            }
          }
        }
        if (!replacedAnotherEdit) {
          return history.push({
            command: 'node:update',
            message: msg
          });
        }
      });
      return socket.on('disconnect', function() {
        var node, user;
        emitAll('user:leave', socket.id);
        for (node in locks) {
          user = locks[node];
          if (user === socket.id) delete locks[node];
        }
        emitAll('node:select', locks);
        return delete sessions[socket.id];
      });
    });
  };

}).call(this);


/*
  Try to start up the collaboration server
*/

(function() {

  Aloha.ready(function() {
    var $;
    $ = Aloha.jQuery;
    if (typeof io !== "undefined" && io !== null) {
      $('.collaborate').show();
      return $('.collaborate a').bind('mousedown', function(evt) {
        var socket;
        evt.preventDefault();
        socket = io.connect(window.socketUrl);
        return socket.on('connect', function() {
          var $doc, debugReceive, me, users;
          debugReceive = function(command) {
            return socket.on(command, function(message) {
              return console.log('Received: ' + command, message);
            });
          };
          debugReceive('user:hello');
          debugReceive('user:list');
          debugReceive('user:join');
          debugReceive('user:leave');
          debugReceive('node:select');
          debugReceive('node:operation');
          $doc = $('.document');
          $doc[0].innerHTML = '';
          users = {};
          me = null;
          socket.on('user:hello', function(msg) {
            return me = msg;
          });
          socket.on('user:join', function(msg) {
            return users[msg.id] = msg.color;
          });
          socket.on('user:leave', function(msg) {
            return delete users[msg.id];
          });
          socket.on('node:operation', function(msg) {
            var $el, parent;
            switch (msg.op) {
              case 'append':
                parent = $doc;
                if (msg.context) parent = $('#' + msg.context);
                return $el = $(msg.html).attr('id', msg.id).appendTo(parent);
              default:
                return console.log('Could not understand operation ', msg.op, msg);
            }
          });
          socket.on('node:select', function(msg) {
            var $handle, $node, css, node, user, _results;
            $('.handle').remove();
            $('.remote-selected').removeClass('remote-selected').removeAttr('contenteditable');
            _results = [];
            for (node in msg) {
              user = msg[node];
              $node = $('#' + node);
              $handle = $("<div id='" + node + "-handle' contenteditable='false'></div>").addClass('handle');
              $handle.addClass('handle').hide().appendTo('body');
              $handle.attr('style', "background-color: " + users[user] + ";");
              css = {};
              css.top = $node.offset().top;
              css.height = $node.height();
              $handle.data({
                node: $node
              });
              $handle.css(css).show();
              if (user !== me.id) {
                $node.addClass('remote-selected');
                _results.push($node.attr('contenteditable', false));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          });
          socket.on('node:update', function(msg) {
            return $('#' + msg.id)[0].innerHTML = msg.html;
          });
          return Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
            var id, parent;
            parent = $(rangeObject.startContainer).parents('*[id]').first();
            id = parent.attr('id');
            socket.emit('node:select', [id]);
            return socket.emit('node:update', {
              id: id,
              html: parent[0].innerHTML
            });
          });
        });
      });
    }
  });

}).call(this);


/*
  Try to start up the collaboration server
*/

(function() {

  Aloha.ready(function() {
    var $;
    $ = Aloha.jQuery;
    window.collaborate = function(url, $doc) {
      var socket;
      socket = io.connect(url);
      return socket.on('connect', function() {
        var autoId, debugReceive, me, users;
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
        $doc[0].innerHTML = '';
        users = {};
        me = null;
        socket.on('user:hello', function(msg) {
          return me = msg;
        });
        socket.on('user:join', function(msg) {
          return users[msg.user] = msg.color;
        });
        socket.on('user:leave', function(msg) {
          return delete users[msg.user];
        });
        socket.on('node:operation', function(msg) {
          var $context, $el;
          switch (msg.op) {
            case 'append':
              $context = $doc;
              if (msg.context) $context = $('#' + msg.context);
              return $el = $(msg.html).attr('id', msg.node).appendTo($context);
            case 'insertbefore':
              $context = $('#' + msg.context);
              return $el = $(msg.html).attr('id', msg.node).insertBefore($context);
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
            if (user !== me.user) {
              $node.addClass('remote-selected');
              _results.push($node.attr('contenteditable', false));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
        socket.on('node:update', function(msg) {
          return setTimeout(function() {
            return $('#' + msg.node)[0].innerHTML = msg.html;
          }, 100);
        });
        autoId = 0;
        return Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
          var context, html, id, next, node, op, parent;
          parent = $(rangeObject.startContainer).parents('*[id]').first();
          if (parent.length && $doc[0] !== parent[0]) {
            node = parent.attr('id');
            socket.emit('node:select', [node]);
            return socket.emit('node:update', {
              node: node,
              html: parent[0].innerHTML
            });
          } else {
            parent = $doc.children('*:not([id])').first();
            id = "auto-" + me.user + "-id" + (++autoId);
            html = parent[0].outerHTML;
            parent.attr('id', id);
            socket.emit('node:update', {
              node: parent.prev().attr('id'),
              html: parent.prev()[0].innerHTML
            });
            next = parent.nextAll('*[id]').first();
            if (next.length) {
              op = 'insertbefore';
              context = next;
            } else {
              op = 'append';
              context = parent.parent();
            }
            socket.emit('node:operation', {
              op: op,
              node: id,
              context: context.attr('id'),
              html: html
            });
            return socket.emit('node:select', [id]);
          }
        });
      });
    };
    if (typeof io !== "undefined" && io !== null) {
      $('.collaborate').show();
      return $('.collaborate a').bind('mousedown', function(evt) {
        evt.preventDefault();
        return window.collaborate(window.socketUrl, $('.document'));
      });
    }
  });

}).call(this);

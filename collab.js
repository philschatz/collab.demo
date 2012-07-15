
/*
  Try to start up the collaboration server
*/

(function() {

  Aloha.ready(function() {
    var $;
    if (window.io != null) {
      $ = Aloha.jQuery;
      $('.collaborate').show();
      $('.collaborate a').bind('mousedown', function(evt) {
        evt.preventDefault();
        window.collaborate(window.socketUrl, $('.document'));
        return $('.collaborate').hide();
      });
      return window.collaborate = function(url, $doc) {
        var socket;
        socket = io.connect(url);
        return socket.on('connect', function() {
          var autoId, changeHandler, debugReceive, me, onOperation, users;
          debugReceive = function(command) {
            return socket.on(command, function(message) {
              return console.log('Received: ' + command, message);
            });
          };
          debugReceive('document.reset');
          debugReceive('user:hello');
          debugReceive('user:list');
          debugReceive('user:join');
          debugReceive('user:leave');
          debugReceive('node:select');
          debugReceive('node:operation');
          users = {};
          me = null;
          onOperation = function(msg) {
            var $context, $el;
            switch (msg.op) {
              case 'append':
                $context = $doc;
                if (msg.context) $context = $('#' + msg.context);
                return $el = $(msg.html).attr('id', msg.node).appendTo($context);
              case 'insertbefore':
                $context = $('#' + msg.context);
                return $el = $(msg.html).attr('id', msg.node).insertBefore($context);
              case 'delete':
                $context = $('#' + msg.context);
                return $context.remove();
              default:
                return console.log('Could not understand operation ', msg.op, msg);
            }
          };
          socket.on('node:operation', onOperation);
          socket.on('document:reset', function() {
            return $doc[0].innerHTML = '';
          });
          socket.on('user:hello', function(msg) {
            var el, els, id, nextId, operation, _i, _len, _results;
            me = msg;
            els = $doc.children();
            $doc[0].innerHTML = '';
            socket.emit('document:reset');
            nextId = 0;
            _results = [];
            for (_i = 0, _len = els.length; _i < _len; _i++) {
              el = els[_i];
              id = "id-" + (++nextId);
              $(el).attr('id', id);
              operation = {
                op: 'append',
                node: id,
                context: null,
                html: el.outerHTML
              };
              socket.emit('node:operation', operation);
              _results.push(onOperation(operation));
            }
            return _results;
          });
          socket.on('user:join', function(msg) {
            return users[msg.user] = msg.color;
          });
          socket.on('user:leave', function(msg) {
            return delete users[msg.user];
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
          changeHandler = function(event, rangeObject) {
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
                context = next.attr('id');
              } else {
                op = 'append';
                if ($doc[0] = parent.parent()[0]) {
                  context = null;
                } else {
                  context = parent.parent().attr('id');
                }
              }
              socket.emit('node:operation', {
                op: op,
                node: id,
                context: context,
                html: html
              });
              return socket.emit('node:select', [id]);
            }
          };
          Aloha.bind("aloha-selection-changed", changeHandler);
          return Aloha.jQuery('.document').bind("focus", function(evt) {
            return setTimeout((function() {
              var rangeObject, ranges, sel;
              sel = rangy.getSelection();
              ranges = sel.getAllRanges();
              if (ranges.length === 0) return;
              rangeObject = ranges[0];
              return changeHandler(evt, rangeObject);
            }), 10);
          });
        });
      };
    }
  });

}).call(this);

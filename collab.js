
/*
  Try to start up the collaboration server
*/

(function() {

  Aloha.ready(function() {
    var $, $doc, enable, reset, resetBtn, shared;
    if (window.io != null) {
      $ = Aloha.jQuery;
      $doc = $('.document');
      shared = {
        socket: null,
        changeHandler: null
      };
      reset = function() {
        shared.socket.emit('document:reset');
        $doc[0].innerHTML = '<h1>Heading</h1><h2>Sub Heading</h2><h3>Sub-Sub Heading</h3><p>Paragraph Text</p>';
        return shared.changeHandler(null, null);
      };
      enable = function(evt, url) {
        var socket;
        if (url == null) {
          url = prompt('What is the collaboration server URL?', 'http://localhost:3001');
        }
        shared.socket = socket = io.connect(url);
        return socket.on('connect', function() {
          var autoId, debugReceive, me, onOperation, users;
          debugReceive = function(command) {
            return socket.on(command, function(message) {
              if (command === 'node:operation') {
                return console.log('Received: OP: ' + message.op, message);
              } else {
                return console.log('Received: ' + command, message);
              }
            });
          };
          debugReceive('document.reset');
          debugReceive('user:hello');
          debugReceive('user:list');
          debugReceive('user:join');
          debugReceive('user:leave');
          debugReceive('node:select');
          debugReceive('node:operation');
          debugReceive('node:update');
          $doc[0].innerHTML = '';
          resetBtn.setDisabled(false);
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
            return me = msg;
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
              var n;
              n = $('#' + msg.node);
              if (n.length) return n[0].innerHTML = msg.html;
            }, 100);
          });
          autoId = 0;
          shared.changeHandler = function(event, rangeObject) {
            var $next, $orphan, $prev, context, html, id, node, op, orphan, parent, _i, _len, _ref, _results;
            if (rangeObject) {
              parent = $(rangeObject.startContainer).parents('*[id]').first();
              if (parent.length && $doc[0] !== parent[0]) {
                if (parent.parents($doc)) {
                  node = parent.attr('id');
                  socket.emit('node:select', [node]);
                  socket.emit('node:update', {
                    node: node,
                    html: parent[0].innerHTML
                  });
                }
              }
            }
            _ref = $doc.children('*:not([id])');
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              orphan = _ref[_i];
              $orphan = $(orphan);
              id = "auto-" + me.user + "-id" + (++autoId);
              html = orphan.outerHTML;
              $orphan.attr('id', id);
              $prev = $orphan.prev('*[id]');
              if ($prev.length) {
                socket.emit('node:update', {
                  node: $prev.attr('id'),
                  html: $prev[0].innerHTML
                });
              }
              $next = $orphan.next('*[id]');
              if ($next.length) {
                op = 'insertbefore';
                context = $next.attr('id');
              } else {
                op = 'append';
                context = null;
              }
              socket.emit('node:operation', {
                op: op,
                node: id,
                context: context,
                html: html
              });
              _results.push(socket.emit('node:select', [id]));
            }
            return _results;
          };
          Aloha.bind("aloha-selection-changed", shared.changeHandler);
          return $doc.bind("focus", function(evt) {
            return setTimeout((function() {
              var rangeObject, ranges, sel;
              sel = rangy.getSelection();
              ranges = sel.getAllRanges();
              if (ranges.length === 0) return;
              rangeObject = ranges[0];
              return shared.changeHandler(evt, rangeObject);
            }), 10);
          });
        });
      };
      resetBtn = new appmenu.MenuItem('Reset Document', {
        accel: 'Meta+Shift+E',
        action: reset,
        disabled: true
      });
      return window.menubar.append(new appmenu.MenuButton('Collaborate!', new appmenu.Menu([
        new appmenu.MenuItem('Enable!', {
          accel: 'Meta+E',
          action: function(evt) {
            return enable(evt, 'http://boole.cnx.rice.edu:3001');
          }
        }), resetBtn, new appmenu.Separator(), new appmenu.MenuItem('Enable localhost (dev)', {
          accel: 'Meta+Shift+L',
          action: function(evt) {
            return enable(evt, 'http://localhost:3001');
          }
        }), new appmenu.MenuItem('Enable...', {
          action: enable
        })
      ])));
    }
  });

}).call(this);

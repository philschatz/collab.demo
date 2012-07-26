
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
        $doc[0].innerHTML = '<h1>Heading</h1><p>Paragraph Text</p><h2>Sub Heading</h2><p>Paragraph Text</p><h3>Sub-Sub Heading</h3><p>Paragraph Text</p><h2>Sub Heading</h2><p>Paragraph Text</p><ol><li>Item 1</li><ul><li>Sub Item 1</li><li>Sub Item 2</li></ul><li>Item 2</li></ol><p>Some formatting: <b>bold</b>, <i>italics</i>, <sub>subscript</sub>, <q>quote</q>, <a href="http://cnx.org">link</a>.<p>';
        return shared.changeHandler(null, null);
      };
      enable = function(evt, url) {
        var socket;
        if (url == null) {
          url = prompt('What is the collaboration server URL?', 'http://localhost:3001');
        }
        shared.socket = socket = io.connect(url);
        return socket.on('connect', function() {
          var autoId, debugReceive, me, nodeMap, onOperation, users;
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
          nodeMap = {};
          users = {};
          me = null;
          onOperation = function(msg) {
            var $context, $el, $node, attrName, attrValue, _ref, _ref2;
            switch (msg.op) {
              case 'append':
                $context = $doc;
                if (msg.context) $context = $('#' + msg.context);
                if (!msg.tag) console.warn('message is missing an element name');
                $el = $("<" + msg.tag + " />").appendTo($context);
                $el.attr('id', msg.node);
                _ref = msg.attrs;
                for (attrName in _ref) {
                  attrValue = _ref[attrName];
                  $el.attr(attrName, attrValue);
                }
                return nodeMap[msg.node] = $el;
              case 'insertbefore':
                $context = $('#' + msg.context);
                $el = $("<" + msg.tag + " />").insertBefore($context);
                $el.attr('id', msg.node);
                _ref2 = msg.attrs;
                for (attrName in _ref2) {
                  attrValue = _ref2[attrName];
                  $el.attr(attrName, attrValue);
                }
                return nodeMap[msg.node] = $el;
              case 'delete':
                if (msg.node in nodeMap) {
                  $node = nodeMap[msg.node];
                  $node.remove();
                } else {
                  console.warn('BUG: Attempting to delete a node that does not exist');
                }
                return delete nodeMap[msg.node];
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
              var $n, $newNode, attrName, attrValue, _ref;
              $n = $('#' + msg.node);
              if (msg.tag && $n[0].tagName.toLowerCase() !== msg.tag) {
                $newNode = Aloha.jQuery("<" + msg.tag + " />");
                $n.replaceWith($newNode);
                $n = $newNode;
                $n.attr('id', msg.node);
              }
              if (msg.attrs) {
                _ref = msg.attrs;
                for (attrName in _ref) {
                  attrValue = _ref[attrName];
                  $n.attr(attrName, attrValue);
                }
              }
              if ($n.length) return $n[0].innerHTML = msg.html;
            }, 10);
          });
          autoId = 0;
          shared.changeHandler = function(event, rangeObject) {
            var $next, $node, $orphan, $parent, $prev, attr, attribs, context, html, id, key, node, op, orphan, orphans, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
            if (rangeObject) {
              $parent = $(rangeObject.startContainer).parents('*[id]').first();
              if ($parent.length && $doc[0] !== $parent[0]) {
                if ($parent.parents().index($doc) >= 0) {
                  node = $parent.attr('id');
                  socket.emit('node:select', [node]);
                  attribs = {};
                  _ref = $parent[0].attributes;
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    attr = _ref[_i];
                    if (attr.name !== 'id') attribs[attr.name] = attr.value;
                  }
                  socket.emit('node:update', {
                    node: node,
                    tag: $parent[0].tagName.toLowerCase(),
                    attribs: attribs,
                    html: $parent[0].innerHTML
                  });
                }
              }
            }
            for (key in nodeMap) {
              $node = nodeMap[key];
              if ($node.parents().index($doc) < 0) {
                socket.emit('node:operation', {
                  op: 'delete',
                  node: key
                });
              }
            }
            $doc.contents().filter(function() {
              return this.nodeType === 3;
            }).wrap('<p></p>');
            $doc.find('br:not(.aloha-end-br)').remove();
            orphans = $doc.children('*:not([id])').add($doc.find('p:not([id]),div:not([id])'));
            _results = [];
            for (_j = 0, _len2 = orphans.length; _j < _len2; _j++) {
              orphan = orphans[_j];
              $orphan = $(orphan);
              id = "auto-" + me.user + "-id" + (++autoId);
              html = orphan.innerHTML;
              attribs = {};
              _ref2 = orphan.attributes;
              for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
                attr = _ref2[_k];
                if (attr.name !== 'id') attribs[attr.name] = attr.value;
              }
              $orphan.attr('id', id);
              nodeMap[id] = $orphan;
              $prev = $orphan.prev('*[id]');
              if ($prev.length) {
                if ($prev.parents().index($doc) >= 0) {
                  socket.emit('node:update', {
                    node: $prev.attr('id'),
                    tag: $prev[0].tagName.toLowerCase(),
                    html: $prev[0].innerHTML
                  });
                }
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
                tag: orphan.tagName.toLowerCase(),
                attribs: attribs,
                html: html
              });
              _results.push(socket.emit('node:select', [id]));
            }
            return _results;
          };
          Aloha.bind("aloha-selection-changed", shared.changeHandler);
          $doc.bind('focus', function(evt) {
            return setTimeout((function() {
              var rangeObject, ranges, sel;
              sel = rangy.getSelection();
              ranges = sel.getAllRanges();
              if (ranges.length === 0) return;
              rangeObject = ranges[0];
              return shared.changeHandler(evt, rangeObject);
            }), 10);
          });
          return $doc.bind('blur', function(evt) {
            return socket.emit('node:select', []);
          });
        });
      };
      resetBtn = new appmenu.MenuItem('Reset Document', {
        accel: 'Meta+Shift+E',
        action: reset,
        disabled: true
      });
      return window.menubar.append(new appmenu.MenuButton('Cool Stuff!', new appmenu.Menu([
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

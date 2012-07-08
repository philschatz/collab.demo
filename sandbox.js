(function() {

  Aloha.ready(function() {
    /*
       Generate a little button next to the cursor that allows quick access to adding semantic tags around text or converting bland elements like sections (headings) into more semantically rich elements like exercises
    */
    /*
       Also, has code for supporting drag-and-drop handles
    */
    var $cmd, $context, $document, $handle, $icon, $menu, $overlay, buttons, cmd, dragScope, getSelectionRect, showContext, _i, _len;
    getSelectionRect = function(rangeObject) {
      if (!rangeObject.getStartDocumentPos) {
        console.error("Couldn't call getStartDocumentPos on rangy (wrong ver of rangy and proper plugins not installed");
        return null;
      }
      return {
        start: rangeObject.getStartDocumentPos(),
        end: rangeObject.getEndDocumentPos()
      };
    };
    showContext = function(rangeObject) {
      var position, selection;
      selection = getSelectionRect(rangeObject);
      if (selection) {
        position = {};
        position.left = selection.end.x;
        position.top = selection.end.y;
        $context.css(position);
        return $icon.fadeIn("fast");
      } else {
        return $icon.hide();
      }
    };
    $document = Aloha.jQuery(".document");
    $overlay = Aloha.jQuery("body");
    $context = Aloha.jQuery("<div class=\"context-cursor\"/>").appendTo($overlay);
    $icon = Aloha.jQuery("<div class=\"context-icon\">&#160;^</div>").hide().appendTo($context);
    $menu = Aloha.jQuery("<div class=\"context-menu\"/>").hide().appendTo($context);
    buttons = [];
    buttons.push({
      title: "Term",
      command: "cmd-term",
      markup: "<span class=\"term\"/>",
      shortcut: "ctrl+shift+t"
    });
    buttons.push({
      title: "Note",
      command: "cmd-note",
      markup: "<span class=\"note\"/>",
      shortcut: "ctrl+shift+n"
    });
    buttons.push({
      title: "Quote",
      command: "cmd-quote",
      markup: "<q />",
      shortcut: "ctrl+shift+q"
    });
    buttons.push({
      title: "Footnote",
      command: "cmd-footnote",
      markup: "<span class=\"footnote\"/>",
      shortcut: "ctrl+shift+f"
    });
    for (_i = 0, _len = buttons.length; _i < _len; _i++) {
      cmd = buttons[_i];
      $cmd = Aloha.jQuery("<div href=\"#\" title=\"" + cmd.title + " (" + cmd.shortcut + ")\" class=\"command " + cmd.command + "\" command=\"" + cmd.command + "\"><span>" + cmd.title + "</span></div>");
      $cmd.click(function() {
        var markup, rangeObject;
        markup = jQuery(cmd.markup);
        rangeObject = Aloha.Selection.rangeObject;
        if (rangeObject.isCollapsed()) GENTICS.Utils.Dom.extendToWord(rangeObject);
        return Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(markup));
      });
      $cmd.appendTo($menu);
    }
    $icon.bind("click", function(evt) {
      evt.stopPropagation();
      $menu.show();
      return $overlay.click(function() {
        $menu.hide();
        return $icon.hide();
      });
    });
    $handle = Aloha.jQuery("<div class=\"handle\" contenteditable=\"false\"></div>").hide().appendTo("body");
    Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
      var $end, $start, css, end, range, ranges, sel, start;
      sel = rangy.getSelection();
      ranges = sel.getAllRanges();
      if (ranges.length === 0) return;
      range = rangeObject;
      start = range.startContainer;
      end = range.endContainer;
      if (rangeObject.getStartDocumentPos) {
        showContext(rangeObject);
      } else {
        console.warn("Not displaying context icon because rangy is missing the rangy-position plugin for pixel-calculation of cursor position");
        $icon.hide();
      }
      $start = Aloha.jQuery(start).parent("h1,h2,h3,h4,h5,h6,p");
      $end = Aloha.jQuery(end).parent("h1,h2,h3,h4,h5,h6,p");
      css = {};
      if ($start.offset() !== null && $end.offset() !== null) {
        css.top = $start.offset().top;
        css.height = $end.offset().top + $end.height() - css.top;
        $handle.data({
          node: $start
        });
        return $handle.css(css).show();
      } else {
        return $handle.hide();
      }
    });
    dragScope = "blockish-nodes-only";
    return $handle.draggable({
      scope: dragScope,
      revert: "invalid",
      cursor: "move",
      start: function(el) {
        var $blocks;
        $blocks = $document.find("h1,h2,h3,h4,h5,h6,p");
        return $blocks.droppable({
          scope: dragScope,
          hoverClass: "drop-before",
          drop: function(event, ui) {
            ui.draggable.data("node").insertBefore(Aloha.jQuery(this));
            return ui.draggable.attr("style", "");
          }
        });
      }
    });
  });

  Aloha.ready(function() {
    Aloha.jQuery("<script src=\"./lib/jquery-ui.min.js\"></script>").appendTo("body");
    return Aloha.jQuery(".document").aloha();
  });

  /*
    Try to start up the collaboration server
  */

  Aloha.ready(function() {
    var $, $doc, debugReceive, me, socket, users;
    $ = Aloha.jQuery;
    if (typeof io !== "undefined" && io !== null) {
      /*
          socket = null
          for url in [ 'http://localhost:3001', 'http://boole.cnx.rice.edu', '' ]
            socket = io.connect url
            if socket
              true
      */
      socket = io.connect('http://localhost:3001');
      if (socket) {
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
      } else {
        return console.warn('Could not find a collaboration server');
      }
    }
  });

}).call(this);

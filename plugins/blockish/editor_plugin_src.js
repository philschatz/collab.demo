(function() {

  tinymce.create('tinymce.plugins.BlockishSelectionPlugin', {
    init: function(ed, url) {
      var G, allowsForA, ancestorThatAllowsForA, mkJQuery;
      G = Cnx.Grammar;
      mkJQuery = function() {
        return function(selector) {
          if (!(ed.getDoc() != null)) {
            console.log("Null editor document for jquery!");
            return console.log("When trying to select: " + selector);
          } else {
            if (selector != null) {
              return jQuery(selector, ed.getDoc());
            } else {
              return jQuery(ed.getDoc());
            }
          }
        };
      };
      allowsForA = function($el, childName) {
        var n;
        n = new G.Node($el, 1);
        return n.allowsForA(childName);
      };
      ancestorThatAllowsForA = function($el, childName) {
        if (allowsForA($el, childName)) {
          return allowsForA($el, childName);
        } else {
          return allowsForA($el.parent(), childName);
        }
      };
      ed.onInit.add(function(ed, cm, n) {
        var $, $body, $startSelect;
        $ = mkJQuery();
        $body = $('#tinymce');
        $startSelect = null;
        $body.on('mousedown', function(evt, b, c, d) {
          var $target;
          $target = $(evt.target);
          $startSelect = $target;
          $body.attr('contenteditable', false);
          $target.prevAll('*:not(p)').attr('contenteditable', false);
          $target.nextAll('*:not(p)').attr('contenteditable', false);
          return $target.parent().attr('contenteditable', true);
        });
        $body.on('mouseup', function(evt) {
          var $target;
          $target = $startSelect;
          $startSelect = null;
          $target.prevAll('*:not(p)').removeAttr('contenteditable');
          $target.nextAll('*:not(p)').removeAttr('contenteditable');
          $target.parent().removeAttr('contenteditable');
          return $body.attr('contenteditable', true);
        });
        return ed.onNodeChange.add(function(ed, cm, el) {
          var $el, name, range, text, _i, _len, _ref, _results;
          console.log("node Change!");
          console.log(ed.selection.getRng());
          $el = $(el);
          if ($el.attr('data-mce-bogus')) $el = $($el.parent());
          if ($el.hasClass('empty')) {
            range = ed.selection.getRng();
            text = range.commonAncestorContainer.textContent;
            if (!($el.data('original') != null)) $el.data('original', text);
            ed.selection.select(el);
          }
          _ref = G.AllElements;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            name = _ref[_i];
            cm.setDisabled(name, true);
            if (ancestorThatAllowsForA($el, name)) {
              _results.push(cm.setDisabled(name, false));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
      });
      /*
          ed.onKeyPress.add (ed, evt) ->
            console.log "on Change!"
            el = ed.selection.getNode()
            $el = $(el)
            if $el.hasClass 'empty'
              # TODO select all the text but not the element
              # See http://www.tinymce.com/wiki.php/API3:method.tinymce.dom.Selection.getRng and setRng
              range = ed.selection.getRng()
              text = range.commonAncestorContainer.textContent
      
              # Discard the "Empty" span (since a keypress occurred)
              #$el.parent().text(text)
              ed.selection.setNode($el.parent().get(0))
              $el.remove()
      */
      return ed.onBeforeRenderUI.add(function() {
        var $, buildTemplate, f, name, _i, _len, _ref, _results;
        $ = mkJQuery();
        buildTemplate = function(name) {
          var $el, child, emptyPlaceholder, tag, _i, _len, _ref;
          emptyPlaceholder = function(tag, title) {
            return $("<" + tag + " class='empty'>&#32;<span class='empty' contenteditable='false'>" + title + "</span> </" + tag + ">");
          };
          tag = G.Elements[name];
          switch (name) {
            case 'title':
              $el = emptyPlaceholder(tag, '[Title]').addClass(name);
              break;
            case 'label':
              $el = emptyPlaceholder(tag, '[Label]').addClass(name);
              break;
            case 'caption':
              $el = emptyPlaceholder(tag, '[Caption]').addClass(name);
              break;
            case 'para':
              $el = emptyPlaceholder(tag, '...').addClass(name);
              break;
            default:
              $el = $("<" + tag + " itemtype='" + name + "'/>").addClass(name);
          }
          _ref = G.Rules[name].templateChildren();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            $el.append(buildTemplate(child));
          }
          return $el;
        };
        _ref = G.AllElements;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          name = _ref[_i];
          console.log("mce-" + name);
          f = function(name) {
            return ed.addCommand("mce-" + name, function() {
              var $context, $template, context, hasContent;
              console.log("Executing command mce-" + name);
              $template = buildTemplate(name);
              context = ed.selection.getNode();
              $context = $(context);
              if ($context.attr('data-mce-bogus')) $context = $($context.parent());
              if (ancestorThatAllowsForA($context, name)) {
                $template.prepend(ancestorThatAllowsForA($context, name));
              }
              $template.insertAfter($context);
              hasContent = $context.children("*:not([data-mce-bogus],.empty)").length > 0 || $context.text().length > 0;
              if (!hasContent && $context.get(0).tagName.toLowerCase() === 'p') {
                $context.remove();
              }
              if ($template.get(0).tagName.toLowerCase() === 'div') {
                $("<p class='cursor before'>&#160;</p>").insertBefore($template);
                $("<p class='cursor after'>&#160;</p>").insertAfter($template);
              }
              return null;
            });
          };
          f(name);
          _results.push(ed.addButton(name, {
            title: "" + name + ".desc",
            cmd: "mce-" + name,
            image: url + ("/img/" + name + ".gif")
          }));
        }
        return _results;
      });
    },
    getInfo: function() {
      return {
        longname: 'Blockish Selection Plugin',
        author: 'Philip Schatz',
        authorurl: '',
        infourl: '',
        version: "1.0"
      };
    }
  });

  tinymce.PluginManager.add('blockish', tinymce.plugins.BlockishSelectionPlugin);

}).call(this);

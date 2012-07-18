(function() {

  define(["aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) {
    var CONTAINER_JQUERY, FloatingMenu_addButton, enabledButtons, toolbar;
    CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body');
    enabledButtons = {
      'b': 'Ctrl+B',
      'i': 'Ctrl+I',
      's': 'Ctrl+Shift+S',
      'sub': 'Ctrl+.',
      'sup': 'Ctrl+,',
      'quote': "Ctrl+\'",
      'ul': 'Ctrl+Shift+7',
      'ol': 'Ctrl+Shift+6',
      'indent-list': 'Tab',
      'outdent-list': 'Shift+Tab',
      'insertLink': 'Ctrl+K',
      'removeLink': 'Ctrl+Shift+K'
    };
    window.toolbar = toolbar = new appmenu.ToolBar();
    toolbar.el.appendTo(CONTAINER_JQUERY);
    FloatingMenu_addButton = function(scope, button, tab, group) {
      var btn;
      btn = new appmenu.ToolButton(button.name, {
        iconCls: button.iconClass,
        toolTip: button.name,
        accel: enabledButtons[button.name],
        action: function(evt) {
          evt.preventDefault();
          button.btnEl = {
            dom: this.el[0]
          };
          return button.onclick(button, evt);
        }
      });
      button.setPressed = function(pressed) {
        if (pressed) {
          return btn.setChecked(true);
        } else {
          return btn.setChecked(false);
        }
      };
      button.disable = function() {
        return btn.setDisabled(true);
      };
      button.enable = function() {
        return btn.setDisabled(false);
      };
      if (!enabledButtons[button.name]) return;
      return toolbar.append(btn);
    };
    /*
       register the plugin with unique name
    */
    return Plugin.create("toolbar", {
      init: function() {
        var applyHeading, h, headingButtons, headingsButton, labels, order;
        FloatingMenu.addButton = FloatingMenu_addButton;
        applyHeading = function() {
          var $newEl, $oldEl, rangeObject;
          rangeObject = Aloha.Selection.getRangeObject();
          if (rangeObject.isCollapsed()) {
            GENTICS.Utils.Dom.extendToWord(rangeObject);
          }
          Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(this.markup));
          $oldEl = $(rangeObject.getCommonAncestorContainer());
          $newEl = $(Aloha.Selection.getRangeObject().getCommonAncestorContainer());
          return $newEl.addClass($oldEl.attr('class'));
        };
        order = ['p', 'h1', 'h2', 'h3'];
        labels = {
          'p': 'Normal Text',
          'h1': 'Heading 1',
          'h2': 'Heading 2',
          'h3': 'Heading 3'
        };
        headingButtons = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = order.length; _i < _len; _i++) {
            h = order[_i];
            _results.push(new appmenu.custom.Heading("<" + h + " />", labels[h], {
              accel: "Ctrl+" + (h.charAt(1)),
              action: applyHeading
            }));
          }
          return _results;
        })();
        headingsButton = new appmenu.ToolButton("Heading 1", {
          subMenu: new appmenu.Menu(headingButtons)
        });
        toolbar.append(headingsButton);
        toolbar.append(new appmenu.Separator());
        return Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
          var $el, h, i, isActive, _len, _results;
          $el = Aloha.jQuery(rangeObject.startContainer);
          _results = [];
          for (i = 0, _len = order.length; i < _len; i++) {
            h = order[i];
            isActive = $el.parents(h).length > 0;
            headingButtons[i].setChecked(isActive);
            if (isActive) {
              _results.push(headingsButton.setText(labels[h]));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
      },
      /*
           toString method
      */
      toString: function() {
        return "toolbar";
      }
    });
  });

}).call(this);

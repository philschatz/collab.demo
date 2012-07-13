(function() {

  define(["aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) {
    var CONTAINER_JQUERY, FloatingMenu_addButton, enabledButtons, toolbar;
    CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body');
    enabledButtons = ["b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink"];
    window.toolbar = toolbar = new appmenu.ToolBar();
    toolbar.el.appendTo(CONTAINER_JQUERY);
    FloatingMenu_addButton = function(scope, button, tab, group) {
      var btn;
      btn = new appmenu.ToolButton(button.name, {
        iconCls: button.iconClass,
        toolTip: button.name,
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
      if (enabledButtons.indexOf(button.name) < 0) return;
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
          var rangeObject;
          rangeObject = Aloha.Selection.rangeObject;
          if (rangeObject.isCollapsed()) {
            GENTICS.Utils.Dom.extendToWord(rangeObject);
          }
          return Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(this.markup));
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

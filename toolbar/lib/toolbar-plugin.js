(function() {

  define(["aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) {
    var CONTAINER_JQUERY, FloatingMenu_addButton, enabledButtons, rangeHack, toolbar;
    CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body');
    rangeHack = null;
    enabledButtons = ["b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink"];
    toolbar = new menubar.ToolBar();
    toolbar.render().appendTo(CONTAINER_JQUERY);
    FloatingMenu_addButton = function(scope, button, tab, group) {
      var btn;
      if (enabledButtons.indexOf(button.name) < 0) return;
      btn = new menubar.ToolButton(button.name, {
        iconCls: button.iconClass,
        toolTip: button.name,
        action: function(evt) {
          evt.stopPropagation();
          Aloha.Selection.rangeObject = rangeHack;
          return button.onclick();
        }
      });
      toolbar.append(btn);
      return button.setPressed = function(pressed) {
        if (pressed) {
          return btn.checked(true);
        } else {
          return btn.checked(false);
        }
      };
    };
    /*
       register the plugin with unique name
    */
    return Plugin.create("toolbar", {
      init: function() {
        FloatingMenu.addButton = FloatingMenu_addButton;
        return Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
          return rangeHack = rangeObject;
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

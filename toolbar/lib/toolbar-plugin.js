(function() {

  define(["aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) {
    var FloatingMenu_addButton, TOOLBAR_JQUERY, enabledButtons, rangeHack;
    TOOLBAR_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar').appendTo('body');
    rangeHack = null;
    enabledButtons = ["b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink"];
    FloatingMenu_addButton = function(scope, button, tab, group) {
      var $button;
      if (enabledButtons.indexOf(button.name) < 0) return;
      $button = jQuery("<div class=\"button\"><button class=\"inner " + button.iconClass + " " + button.name + "\"></div></div>").appendTo(TOOLBAR_JQUERY);
      $button.attr("title", button.name);
      $button.bind("mousedown", function(evt) {
        evt.stopPropagation();
        Aloha.Selection.rangeObject = rangeHack;
        return button.onclick();
      });
      return button.setPressed = function(pressed) {
        if (pressed) {
          return $button.addClass("pressed");
        } else {
          return $button.removeClass("pressed");
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

define(
['aloha', 'aloha/plugin', 'aloha/jquery', 'aloha/floatingmenu', 'i18n!format/nls/i18n', 'i18n!aloha/nls/i18n', 'aloha/console',
 		'css!toolbar/css/toolbar.css'],
function(Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) {
    
    var TOOLBAR_JQUERY = jQuery('<div class="toolbar"></div>').appendTo('body');
    
    //Changed every time selectionChanged event is fired
    var rangeHack = null;
    
    var enabledButtons = ['b', 'i', /* 'strong', 'em', */ 's', 'sub', 'sup', 'quote', 'ul', 'ol', 'indent-list', 'outdent-list', 'insertLink', 'removeLink' ];

    var FloatingMenu_addButton = function(scope, button, tab, group) {

      // Disable all the buttons except the ones we want to support
      if (enabledButtons.indexOf(button.name) < 0) {
        return;
      }
      
      // Note: Use a <button> so the aloha css rules apply and the buttons get a fancy icon
      var $button = jQuery('<div class="button"><button class="inner ' + button.iconClass + ' ' + button.name + '"></div></div>').appendTo(TOOLBAR_JQUERY);
      $button.attr('title', button.name);
      // mousedown instead of click because Aloha.activeEditable.obj is somehow set to null on click
      $button.bind('mousedown', function(evt) {
        evt.stopPropagation(); // Don't lose focus from the editor
        Aloha.Selection.rangeObject = rangeHack;
        button.onclick();
      });

      // Customize the setPressed (called when selection updates)
      button.setPressed = function(pressed) {
        if (pressed) {
          $button.addClass('pressed');
        } else {
          $button.removeClass('pressed');
        }
      };
    
    };
    
    
	/**
	 * register the plugin with unique name
	 */
	return Plugin.create('toolbar', {

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			// Prepare
			var me = this;

            // Override the FloatingMenu.addButton
            FloatingMenu.addButton = FloatingMenu_addButton;
            
            			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed',function(event,rangeObject){
				// Squirrel away the range because clicking the button changes focus and removed the range
				rangeHack = rangeObject;
            });
    
		},
        
		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'toolbar';
		}
	});
});

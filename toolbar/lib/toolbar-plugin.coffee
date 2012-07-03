define [ "aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) ->

  TOOLBAR_JQUERY = jQuery("<div class=\"toolbar\"></div>").appendTo("body")
  # Changed every time selectionChanged event is fired
  rangeHack = null
  enabledButtons = [ "b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink" ]

  FloatingMenu_addButton = (scope, button, tab, group) ->
    # Disable all the buttons except the ones we want to support
    return  if enabledButtons.indexOf(button.name) < 0

    # Note: Use a <button> so the aloha css rules apply and the buttons get a fancy icon
    $button = jQuery("<div class=\"button\"><button class=\"inner " + button.iconClass + " " + button.name + "\"></div></div>").appendTo(TOOLBAR_JQUERY)
    $button.attr "title", button.name

    # mousedown instead of click because Aloha.activeEditable.obj is somehow set to null on click
    $button.bind "mousedown", (evt) ->
      evt.stopPropagation() # Don't lose focus from the editor
      Aloha.Selection.rangeObject = rangeHack
      button.onclick()

    # Customize the setPressed (called when selection updates)
    button.setPressed = (pressed) ->
      if pressed
        $button.addClass "pressed"
      else
        $button.removeClass "pressed"

  ###
   register the plugin with unique name
  ###
  Plugin.create "toolbar",
    init: ->

      # Override the FloatingMenu.addButton
      FloatingMenu.addButton = FloatingMenu_addButton

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        rangeHack = rangeObject

    ###
     toString method
    ###
    toString: ->
      "toolbar"
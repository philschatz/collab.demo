define [ "aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body')
  # Changed every time selectionChanged event is fired
  rangeHack = null
  enabledButtons = [ "b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink" ]

  window.toolbar = toolbar = new appmenus.ToolBar()
  toolbar.render().appendTo CONTAINER_JQUERY
  
  FloatingMenu_addButton = (scope, button, tab, group) ->
    # Disable all the buttons except the ones we want to support
    return  if enabledButtons.indexOf(button.name) < 0

    btn = new appmenus.ToolButton button.name, 
      iconCls: button.iconClass
      toolTip: button.name
      action: (evt) ->
        evt.preventDefault() # Don't lose focus from the editor
        Aloha.Selection.rangeObject = rangeHack
        button.onclick()

    toolbar.append btn

    # Customize the setPressed (called when selection updates)
    button.setPressed = (pressed) ->
      if pressed
        btn.checked(true)
      else
        btn.checked(false)

  ###
   register the plugin with unique name
  ###
  Plugin.create "toolbar",
    init: ->

      # Override the FloatingMenu.addButton
      FloatingMenu.addButton = FloatingMenu_addButton
      
      applyHeading = () ->
        rangeObject = Aloha.Selection.rangeObject
        GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()
        Aloha.Selection.changeMarkupOnSelection Aloha.jQuery(@markup)

      
      headingButtons = [
        new appmenus.custom.Heading("<p></p>", "Normal Text", {action: applyHeading } )
        new appmenus.custom.Heading("<h1></h1>", "Heading 1", {action: applyHeading } )
        new appmenus.custom.Heading("<h2></h2>", "Heading 2", {action: applyHeading } )
        new appmenus.custom.Heading("<h3></h3>", "Heading 3", {action: applyHeading } )
      ]
      
      headings = new appmenus.ToolButton("Heading 1", {subMenu: new appmenus.Menu(headingButtons)})
      toolbar.append(headings)
      toolbar.append(new appmenus.Separator())

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        rangeHack = rangeObject

      Aloha.bind "focus", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        rangeHack = rangeObject

    ###
     toString method
    ###
    toString: ->
      "toolbar"
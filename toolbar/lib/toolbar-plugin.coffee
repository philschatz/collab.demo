define [ "aloha", "aloha/plugin", "aloha/jquery", "aloha/floatingmenu", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, jQuery, FloatingMenu, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body')
  # Changed every time selectionChanged event is fired
  rangeHack = null
  enabledButtons = [ "b", "i", "s", "sub", "sup", "quote", "ul", "ol", "indent-list", "outdent-list", "insertLink", "removeLink" ]

  window.toolbar = toolbar = new appmenu.ToolBar()
  toolbar.render().appendTo CONTAINER_JQUERY
  
  FloatingMenu_addButton = (scope, button, tab, group) ->
    # Note: button is an Aloha.ui.Button which wrapts an ExtJS button
  
    btn = new appmenu.ToolButton button.name, 
      iconCls: button.iconClass
      toolTip: button.name
      action: (evt) ->
        evt.preventDefault() # Don't lose focus from the editor
        Aloha.Selection.rangeObject = rangeHack
        # ExtJS hack. tableCreate uses this DOM element to create a dialog box
        button.btnEl =
          dom: @el[0]
        
        button.onclick(button, evt)

    # Customize the setPressed (called when selection updates)
    button.setPressed = (pressed) ->
      if pressed
        btn.setChecked true
      else
        btn.setChecked false
    # Other operations defined by Aloha.ui.Button and used by the various plugins
    button.disable = () ->
      btn.setDisabled true
    button.enable = () ->
      btn.setDisabled false

    # Disable all the buttons except the ones we want to support
    # Aloha still calls functions on the Aloha.ui.Button and expects them to
    # have been rendered somewhere so we override the functions and just not
    # include the button so Aloha doesn't fail when trying to update the ExtButton
    return  if enabledButtons.indexOf(button.name) < 0

    toolbar.append btn

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

      
      order = [ 'p', 'h1', 'h2', 'h3' ]
      labels =
        'p':  'Normal Text'
        'h1': 'Heading 1'
        'h2': 'Heading 2'
        'h3': 'Heading 3'

      headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {action: applyHeading }) for h in order)
      
      headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons)})
      toolbar.append(headingsButton)
      toolbar.append(new appmenu.Separator())

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        rangeHack = rangeObject
        $el = Aloha.jQuery(rangeObject.startContainer)
        for h, i in order
          isActive = $el.parents(h).length > 0
          headingButtons[i].setChecked(isActive)
          # Update the toolbar to show the current heading level
          if isActive
            headingsButton.setText labels[h]

      Aloha.bind "focus", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        rangeHack = rangeObject

    ###
     toString method
    ###
    toString: ->
      "toolbar"
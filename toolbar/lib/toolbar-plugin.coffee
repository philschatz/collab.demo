# including "ui/settings" has weird side effects, namely most of the buttons don't load
menuSettings = [
  text: "Format"
  subMenu: [ "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "quote", '', {text: 'Paragraph Styles', subMenu: ["indentList", "outdentList"] }, { text: "Align", subMenu: [ "alignLeft", "alignCenter", "alignRight", "alignJustify"] }, "formatLink", "formatAbbr", "formatNumeratedHeaders", "toggleMetaView", "wailang", "toggleFormatlessPaste" ]
,
  text: "Insert"
  subMenu: [ "characterPicker", "insertLink", "insertImage", 'insertFigure', "insertAbbr", "insertToc", "insertHorizontalRule", "insertTag" ]
,
  text: "Table"
  subMenu: [ "createTable", '', {text: "Cell", subMenu: ["mergecells", "splitcells", "tableCaption", "tableSummary", "formatTable"]}, { text: "Row", subMenu: ["addrowbefore", "addrowafter", "deleterows", "rowheader", "mergecellsRow", "splitcellsRow", "formatRow"]}, '', { text: "Column", subMenu: ["addcolumnleft", "addcolumnright", "deletecolumns", "columnheader", "mergecellsColumn", "splitcellsColumn", "formatColumn"] } ]
]

toolbarSettings = [
 'bold', 'italic', 'underline', '', 'insertLink', 'insertImage', 'insertFigure', '', 'orderedList', 'unorderedList', 'outdentList', 'indentList', '', "alignLeft", "alignCenter", "alignRight", "alignJustify"
]

define [ "aloha", "aloha/plugin", "ui/ui", 'ribbon/ribbon-plugin', "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, Ui, Ribbon, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body')
  
  ###
   register the plugin with unique name
  ###
  Plugin.create "toolbar",
    init: ->

      window.menubar = menubar = new appmenu.MenuBar []
      menubar.el.appendTo $('.menubar')

      window.toolbar = toolbar = new appmenu.ToolBar()
      toolbar.el.appendTo CONTAINER_JQUERY
      toolbar.el.addClass 'aloha'

      menuLookup = {}
      toolbarLookup = {}

      recurse = (item, lookupMap) ->
        if 'string' == $.type item
          if '' == item
            return new appmenu.Separator()
          menuItem = new appmenu.MenuItem 'EMPTY_LABEL'
          lookupMap[item] = menuItem
          return menuItem
        else
          subItems = for subItem in item.subMenu or []
            recurse subItem, lookupMap
          subMenu = new appmenu.Menu subItems
          subMenu.el.addClass 'aloha' # Hack to get the Aloha icons working
          menuItem = new appmenu.MenuItem item.text,
            subMenu: subMenu
          return menuItem

      
      for tab in menuSettings
        subMenuItems = for item in tab.subMenu
          recurse item, menuLookup

        menu = new appmenu.Menu subMenuItems
        menu.el.addClass 'aloha' # Added so the CSS for aloha icons gets matched
        
        menubar.append(new appmenu.MenuButton tab.text, menu)

      for item in toolbarSettings
          toolbar.append (recurse item, toolbarLookup)

        

      # Hijack the toolbar buttons so we can customize where they are placed.
      
      Ui.adopt = (slot, type, settings) ->
        if slot of menuLookup and slot of toolbarLookup
          item = menuLookup[slot]
          item2 = toolbarLookup[slot]
          item.element = item.el # CreateTable and some others do onclick () -> this.element
          item2.element = item2.el # CreateTable and some others do onclick () -> this.element

          item.setText(settings.tooltip)
          item.setIcon(settings.icon)
          item.setAction(settings.click)

          item2.setText(settings.tooltip)
          item2.setIcon(settings.icon)
          item2.setAction(settings.click)

          return {
            show: () ->
              item.setHidden false
              item2.setHidden false
            hide: () ->
              item.setHidden true
              item2.setHidden true
            setActive: (bool) ->
              item.setChecked bool
              item2.setChecked bool
            setState: (bool) ->
              item.setChecked(bool)
              item2.setChecked(bool)
            enable: () ->
              item.setDisabled false
              item2.setDisabled false
            disable: () ->
              item.setDisabled true
              item2.setDisabled true
            setActiveButton: (a, b) ->
              console.log "#{slot} TODO:SETACTIVEBUTTON:", a, b
            focus: (a) ->
              console.log "#{slot} TODO:FOCUS:", a
            foreground: (a) ->
              console.log "#{slot} TODO:FOREGROUND:", a
          }
          
        else if slot of menuLookup or slot of toolbarLookup
          item = menuLookup[slot] or toolbarLookup[slot]
        else
          item = new appmenu.MenuItem 'DUMMY_ITEM_THAT_SQUASHES_STATE_CHANGES'
                    
        item.setText(settings.tooltip)
        item.setIcon(settings.icon)
        item.setAction(settings.click)
        item.element = item.el # CreateTable and some others do onclick () -> this.element

        return {
          show: () ->
            item.setHidden false
          hide: () ->
            item.setHidden true
          setActive: (bool) ->
            item.setChecked bool
          setState: (bool) ->
            item.setChecked(bool)
          setActiveButton: (a, b) ->
            console.log "#{slot} SETACTIVEBUTTON:", a, b
          enable: () ->
            item.setDisabled false
          disable: () ->
            item.setDisabled true
          focus: (a) ->
            console.log "#{slot} TODO:FOCUS:", a
          foreground: (a) ->
            console.log "#{slot} TODO:FOREGROUND:", a
        }
        

      
      applyHeading = () ->
        rangeObject = Aloha.Selection.getRangeObject()
        GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()

        Aloha.Selection.changeMarkupOnSelection Aloha.jQuery(@markup)
        # Attach the id and classes back onto the new element
        $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer())
        $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer())
        $newEl.addClass($oldEl.attr('class'))
        # $newEl.attr('id', $oldEl.attr('id))
        # Setting the id is commented because otherwise collaboration wouldn't register a change in the document

      
      order = [ 'p', 'h1', 'h2', 'h3' ]
      labels =
        'p':  'Normal Text'
        'h1': 'Heading 1'
        'h2': 'Heading 2'
        'h3': 'Heading 3'

      ###
      headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {accel: "Ctrl+#{ h.charAt(1) }", action: applyHeading }) for h in order)
      
      headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons)})
      toolbar.append(headingsButton)
      toolbar.append(new appmenu.Separator())
      ###

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        $el = Aloha.jQuery(rangeObject.startContainer)
        for h, i in order
          isActive = $el.parents(h).length > 0
          #headingButtons[i].setChecked(isActive)
          # Update the toolbar to show the current heading level
          #if isActive
          #  headingsButton.setText labels[h]

    ###
     toString method
    ###
    toString: ->
      "toolbar"
###
The 2 base classes are Menu and MenuItem.
For a MenuBar the children can be MenuButtons (MenuItem w/ just text)
For a ToolBar the children can be ToolButtons (optional tooltip)

Menus:

MenuBar > ToolBar = [ MenuButton ] # changes the class of the bar
MenuButton > MenuItem # Only contains text and submenu

Menu = [ MenuItem | MenuGroup ]
MenuItem = { iconCls+, text, accel+, disabled?, checked?, visible?, submenu+, action() }

MenuGroup > Menu # Used for visually grouping MenuItems so they can scroll
Separator > MenuItem

# One-off cases: (for custom rendering)
Heading > MenuItem # Uses a different class so the text is different
MakeTable > Menu # Offers a 5*5 grid to create a new table

# Unused but worth noting (for completeness)
ColorPicker > Menu



Toolbars:

ToolBar > Menu = [ ToolButton ]

ToolButton > MenuItem = [ tooltop+, (checked means pressed) ]

###
window.menubar = menubar = {}

MenuBase = class MenuBase
  constructor: (@cls = '') ->
  
  addClass: (cls) ->
    @cls += ' ' + cls
  
  # Helper function
  _newDiv: (cls) ->
    $el = Aloha.jQuery('<div></div>')
    $el.addClass(cls) if cls?
    $el
  
  render: () ->
    el = @_newDiv(@cls)
    # Add hover/selection
    el.bind 'mouseenter', () ->
      el.addClass('selected')
    el.bind 'mouseleave', () ->
      el.removeClass('selected')

    el


menubar.Menu = class Menu extends MenuBase
  constructor: (@items=[]) ->
    @addClass 'menu'
  
  render: () ->
    if not @el?
      @el = super()

    @el.children().remove()
    for item in @items
      $item = item.render()
      @_closeEverythingBut(item, $item)
      @el.append($item)
    
    @el

  _closeEverythingBut: (item, $item) ->
    that = @
    $item.bind 'mouseenter', () ->
      for child in that.items
        if child.subMenu and child != item
          child.subMenu.close()

  append: (item) ->
    @items.push(item)
    item.render().appendTo(@el)

  open: (position) ->
    $sub = @render()
    $sub.css(position).appendTo('body')
    $sub.show()
  
  close: () ->
    # TODO: Close their submenus
    for item in @items
      if item.subMenu
        item.subMenu.close()
    @el.hide()

menubar.MenuItem = class MenuItem extends MenuBase
  constructor: (@text, conf = {}) ->
    @addClass 'menu-item'
    @action = conf.action || null
    @iconCls = conf.iconCls || null
    @accel = conf.accel || null
    @isDisabled = conf.disabled || false
    @isChecked = conf.checked || false
    @isHidden = conf.hidden || false
    @subMenu = conf.subMenu || null
    # By default it's a right arrow, but the toolbar buttons use a down arrow
    @subMenuChar = '\u25B6'

  checked: (@isChecked) ->
    if @isChecked
      @el.addClass('checked')
      # Insert a div the the checkbox character
      @_newDiv('checked-icon').append('\u2713').appendTo(@el)
    else
      @el.removeClass('checked')
      @el.children('.checked-icon').remove()
  
  _addEvents: ($el) ->
    that = @
    if @subMenu?
      $el.bind 'mouseenter', () ->
        that._openSubMenu($el, true) # true == open-to-the-right

  _openSubMenu: ($el, toTheRight = false) ->
    if @subMenu?
      # TODO: calculate the position of the submenu
      offset = $el.offset()
      top = offset.top - $el.scrollTop()
      left = offset.left - $el.scrollLeft()
      if toTheRight
        left += $el.outerWidth()
      else # below
        top += $el.outerHeight()
      position = { top: top, left: left }
      @subMenu.open(position)
  _closeSubMenu: () ->
    @subMenu.close()

  # Just generates the correct elements. Doesn't add mouseover/click events
  render: () ->
    if not @el?
      @el = super()

      @el.removeClass 'disabled hidden checked'
      @el.children().remove()
      
      # Add all the classes and child elements (ie icon, accelerator key)
      if @iconCls? then @_newDiv('menu-icon').addClass(@iconCls).appendTo(@el)
      # @accel must go before @text otherwise shows up on next line
      if @accel? then @_newDiv('accel').append(@accel).appendTo(@el)
      if @isDisabled then @el.addClass('disabled')
      if @isHidden then @el.addClass('hidden')
      @checked(@isChecked)
      if @text? then @_newDiv('text').append(@text).appendTo(@el)
      if @subMenu?
        @el.addClass('submenu')
        @_newDiv('submenu').appendTo(@el).append(@subMenuChar)
      @el
      
      # Add some event handlers
      if not @isDisabled
        if @accel? then console.log("TODO: Adding hotkey handler #{ @accel }")
        if @action?
          that = @
          @el.bind 'mousedown', (evt) ->
            evt.stopPropagation()
            # TODO: Hide all menus
            Aloha.jQuery('.menu').hide()
            that.action(evt)
  
        @_addEvents(@el)
    @el
      

menubar.Separator = class Separator extends MenuItem
  constructor: () ->
    super(null, { disabled: true })
    @addClass 'separator'
  _addEvents: () ->

# ---- Specific to ToolBar ---

menubar.ToolBar = class ToolBar extends Menu
  constructor: (items=[]) ->
    super items
    @cls = 'tool-bar' # Don't add it to 'menu'

menubar.ToolButton = class ToolButton extends MenuItem
  constructor: (text, conf) ->
    super(text, conf)
    @addClass 'tool-button'
    @toolTip = conf.toolTip || null
    # By default it's a right arrow, but the toolbar buttons use a down arrow
    @subMenuChar = '\u25BC'

  
  _addEvents: ($el) ->
    tip = @_newDiv('tool-tip').appendTo($el)
    if @toolTip?
      tip.append(@toolTip)
    else
      tip.append(@text)
      if @accel
        tip.append(" (#{ @accel })")

    if @subMenu?
      that = @
      $el.bind 'mousedown', () ->
        that._openSubMenu($el, false) # false == open-below

# ---- Specific to MenuBar ---

menubar.MenuBar = class MenuBar extends Menu
  constructor: (@items) ->
    @cls = 'menu-bar' # Don't add it to 'menu'
  

menubar.MenuButton = class MenuButton extends MenuItem
  constructor: (text, subMenu) ->
    super(text, { subMenu: subMenu })
    @addClass 'menu-button'

  _addEvents: ($el) ->
    if @subMenu?
      that = @
      # Open the menu on click
      $el.bind 'mousedown', (evt) ->
        evt.stopPropagation()
        that._openSubMenu($el, false) # false == open-below
        # Close the menu on second click
        # Add a handler for when someone clicks outside the menu
        Aloha.jQuery('body').one 'mousedown', () ->
          setTimeout(that.subMenu.close.bind(that.subMenu), 10)







  simple = new MenuItem('Format C:')
  simple2 = new MenuItem('Submenu',
    action: () -> alert 'submenu clicked!'
  )
  
  withIcon = new MenuItem('Bold',
    action: () -> alert 'unbolding'
    checked: true
    #iconCls: 'bold'
  )
  
  complex1 = new MenuItem('Disabled but Complex',
    action: () -> alert "Clicked!"
    iconCls: 'bold'
    accel: 'Ctrl+B'
    disabled: true
  )
  
  complex2 = new MenuItem('Has Submenu',
    iconCls: 'bold'
    checked: true
    subMenu: new Menu([ simple2 ])
  )
  
  menu1 = new Menu([ new MenuItem('New...'), new MenuItem('Save'), new MenuItem('Print') ])
  menu2 = new Menu([ simple, withIcon, complex1, new Separator(), complex2 ])
  
  menubar.exampleMenu = new MenuBar([ new MenuButton('File', menu1), new MenuButton('Edit', menu2) ])
  menubar.exampleTool = new ToolBar([ new ToolButton('Insert', { iconCls: 'bold', accel: 'Ctrl+B', subMenu: new Menu([ complex1, complex2 ]) } ), new Separator(), new ToolButton('Bold', { iconCls: 'bold' }) ])

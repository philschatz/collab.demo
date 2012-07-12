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
window.appmenu = appmenu = {}

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


appmenu.Menu = class Menu extends MenuBase
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

    # Close the menu on second click
    # Add a handler for when someone clicks outside the menu
    that = @
    Aloha.jQuery('body').one 'mouseup', () ->
      setTimeout( () ->
        Aloha.jQuery('body').one 'click', () ->
          setTimeout(that.close.bind(that), 10)
      , 10)
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

appmenu.MenuItem = class MenuItem extends MenuBase
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

  setChecked: (@isChecked) ->
    if @el
      @el.children('.checked-icon').remove() # Always remove
      if @isChecked
        @el.addClass('checked')
        # Insert a div the the checkbox character
        @_newDiv('checked-icon').append('\u2713').appendTo(@el)
      else
        @el.removeClass('checked')

  setText: (@text) ->
    if @el
      @el.children('.text')[0].innerHTML = @text
  
  _addEvents: ($el) ->
    that = @
    if @subMenu?
      $el.bind 'mouseenter', () ->
        that._openSubMenu($el, true) # true == open-to-the-right

  _openSubMenu: ($el, toTheRight = false) ->
    if @subMenu?
      # TODO: calculate the position of the submenu
      offset = $el.offset()
      top = $el.scrollTop()
      left = $el.scrollLeft()
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
      if @iconCls? 
        @el.addClass('icon')
        @_newDiv('menu-icon').addClass(@iconCls).appendTo(@el)
      # @accel must go before @text otherwise shows up on next line
      if @accel? then @_newDiv('accel').append(@accel).appendTo(@el)
      if @isDisabled then @el.addClass('disabled')
      if @isHidden then @el.addClass('hidden')
      @setChecked(@isChecked)
      if @text? then @_newDiv('text').append(@text).appendTo(@el)
      if @subMenu?
        @el.addClass('submenu')
        @_newDiv('submenu').appendTo(@el).append(@subMenuChar)
      @el
      
      # Add some event handlers
      if not @isDisabled
        if @accel? then console.log("TODO: Adding hotkey handler #{ @accel }")
        that = @
        @el.bind 'mousedown', (evt) ->
          evt.preventDefault()
          # TODO: Hide all menus
          Aloha.jQuery('.menu').hide()
          if that.action?
            that.action(evt)
  
        @_addEvents(@el)
    @el
      

appmenu.Separator = class Separator extends MenuItem
  constructor: () ->
    super(null, { disabled: true })
    @addClass 'separator'
  _addEvents: () ->

# ---- Specific to ToolBar ---

appmenu.ToolBar = class ToolBar extends Menu
  constructor: (items=[]) ->
    super items
    @cls = 'tool-bar' # Don't add it to 'menu'
  
  close: () ->
    # Never close a toolbar

appmenu.ToolButton = class ToolButton extends MenuItem
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

appmenu.MenuBar = class MenuBar extends Menu
  constructor: (@items) ->
    @cls = 'menu-bar' # Don't add it to 'menu'
  

appmenu.MenuButton = class MenuButton extends MenuItem
  constructor: (text, subMenu) ->
    super(text, { subMenu: subMenu })
    @addClass 'menu-button'

  _addEvents: ($el) ->
    if @subMenu?
      that = @
      # Open the menu on click
      $el.bind 'mousedown', (evt) ->
        evt.preventDefault()
        that._openSubMenu($el, false) # false == open-below


# ---- Custom MenuItems and Menus ---
appmenu.custom = {}
class appmenu.custom.Heading extends MenuItem
  constructor: (@markup, text, conf) ->
    super(text, conf)
  
  _newDiv: (cls) ->
    # HACK: Only override the text div
    if cls == 'text'
      $el = Aloha.jQuery(@markup)
      $el.addClass(cls)
      $el.addClass('custom-heading')
      $el
    else
      super(cls)

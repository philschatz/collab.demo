
/*
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
*/

(function() {
  var Menu, MenuBar, MenuBase, MenuButton, MenuItem, Separator, ToolBar, ToolButton, menubar,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  window.menubar = menubar = {};

  MenuBase = MenuBase = (function() {

    function MenuBase(cls) {
      this.cls = cls != null ? cls : '';
    }

    MenuBase.prototype.addClass = function(cls) {
      return this.cls += ' ' + cls;
    };

    MenuBase.prototype._newDiv = function(cls) {
      var $el;
      $el = Aloha.jQuery('<div></div>');
      if (cls != null) $el.addClass(cls);
      return $el;
    };

    MenuBase.prototype.render = function() {
      var el;
      el = this._newDiv(this.cls);
      el.bind('mouseenter', function() {
        return el.addClass('selected');
      });
      el.bind('mouseleave', function() {
        return el.removeClass('selected');
      });
      return el;
    };

    return MenuBase;

  })();

  menubar.Menu = Menu = (function(_super) {

    __extends(Menu, _super);

    function Menu(items) {
      this.items = items != null ? items : [];
      this.addClass('menu');
    }

    Menu.prototype.render = function() {
      var $item, item, _i, _len, _ref;
      if (!(this.el != null)) this.el = Menu.__super__.render.call(this);
      this.el.children().remove();
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        $item = item.render();
        this._closeEverythingBut(item, $item);
        this.el.append($item);
      }
      return this.el;
    };

    Menu.prototype._closeEverythingBut = function(item, $item) {
      var that;
      that = this;
      return $item.bind('mouseenter', function() {
        var child, _i, _len, _ref, _results;
        _ref = that.items;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (child.subMenu && child !== item) {
            _results.push(child.subMenu.close());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    };

    Menu.prototype.append = function(item) {
      this.items.push(item);
      return item.render().appendTo(this.el);
    };

    Menu.prototype.open = function(position) {
      var $sub;
      $sub = this.render();
      $sub.css(position).appendTo('body');
      return $sub.show();
    };

    Menu.prototype.close = function() {
      var item, _i, _len, _ref;
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.subMenu) item.subMenu.close();
      }
      return this.el.hide();
    };

    return Menu;

  })(MenuBase);

  menubar.MenuItem = MenuItem = (function(_super) {

    __extends(MenuItem, _super);

    function MenuItem(text, conf) {
      this.text = text;
      if (conf == null) conf = {};
      this.addClass('menu-item');
      this.action = conf.action || null;
      this.iconCls = conf.iconCls || null;
      this.accel = conf.accel || null;
      this.isDisabled = conf.disabled || false;
      this.isChecked = conf.checked || false;
      this.isHidden = conf.hidden || false;
      this.subMenu = conf.subMenu || null;
      this.subMenuChar = '\u25B6';
    }

    MenuItem.prototype.checked = function(isChecked) {
      this.isChecked = isChecked;
      if (this.isChecked) {
        this.el.addClass('checked');
        return this._newDiv('checked-icon').append('\u2713').appendTo(this.el);
      } else {
        this.el.removeClass('checked');
        return this.el.children('.checked-icon').remove();
      }
    };

    MenuItem.prototype._addEvents = function($el) {
      var that;
      that = this;
      if (this.subMenu != null) {
        return $el.bind('mouseenter', function() {
          return that._openSubMenu($el, true);
        });
      }
    };

    MenuItem.prototype._openSubMenu = function($el, toTheRight) {
      var left, offset, position, top;
      if (toTheRight == null) toTheRight = false;
      if (this.subMenu != null) {
        offset = $el.offset();
        top = offset.top - $el.scrollTop();
        left = offset.left - $el.scrollLeft();
        if (toTheRight) {
          left += $el.outerWidth();
        } else {
          top += $el.outerHeight();
        }
        position = {
          top: top,
          left: left
        };
        return this.subMenu.open(position);
      }
    };

    MenuItem.prototype._closeSubMenu = function() {
      return this.subMenu.close();
    };

    MenuItem.prototype.render = function() {
      var that;
      if (!(this.el != null)) {
        this.el = MenuItem.__super__.render.call(this);
        this.el.removeClass('disabled hidden checked');
        this.el.children().remove();
        if (this.iconCls != null) {
          this._newDiv('menu-icon').addClass(this.iconCls).appendTo(this.el);
        }
        if (this.accel != null) {
          this._newDiv('accel').append(this.accel).appendTo(this.el);
        }
        if (this.isDisabled) this.el.addClass('disabled');
        if (this.isHidden) this.el.addClass('hidden');
        this.checked(this.isChecked);
        if (this.text != null) {
          this._newDiv('text').append(this.text).appendTo(this.el);
        }
        if (this.subMenu != null) {
          this.el.addClass('submenu');
          this._newDiv('submenu').appendTo(this.el).append(this.subMenuChar);
        }
        this.el;
        if (!this.isDisabled) {
          if (this.accel != null) {
            console.log("TODO: Adding hotkey handler " + this.accel);
          }
          if (this.action != null) {
            that = this;
            this.el.bind('mousedown', function(evt) {
              evt.stopPropagation();
              Aloha.jQuery('.menu').hide();
              return that.action(evt);
            });
          }
          this._addEvents(this.el);
        }
      }
      return this.el;
    };

    return MenuItem;

  })(MenuBase);

  menubar.Separator = Separator = (function(_super) {

    __extends(Separator, _super);

    function Separator() {
      Separator.__super__.constructor.call(this, null, {
        disabled: true
      });
      this.addClass('separator');
    }

    Separator.prototype._addEvents = function() {};

    return Separator;

  })(MenuItem);

  menubar.ToolBar = ToolBar = (function(_super) {

    __extends(ToolBar, _super);

    function ToolBar(items) {
      if (items == null) items = [];
      ToolBar.__super__.constructor.call(this, items);
      this.cls = 'tool-bar';
    }

    return ToolBar;

  })(Menu);

  menubar.ToolButton = ToolButton = (function(_super) {

    __extends(ToolButton, _super);

    function ToolButton(text, conf) {
      ToolButton.__super__.constructor.call(this, text, conf);
      this.addClass('tool-button');
      this.toolTip = conf.toolTip || null;
      this.subMenuChar = '\u25BC';
    }

    ToolButton.prototype._addEvents = function($el) {
      var that, tip;
      tip = this._newDiv('tool-tip').appendTo($el);
      if (this.toolTip != null) {
        tip.append(this.toolTip);
      } else {
        tip.append(this.text);
        if (this.accel) tip.append(" (" + this.accel + ")");
      }
      if (this.subMenu != null) {
        that = this;
        return $el.bind('mousedown', function() {
          return that._openSubMenu($el, false);
        });
      }
    };

    return ToolButton;

  })(MenuItem);

  menubar.MenuBar = MenuBar = (function(_super) {

    __extends(MenuBar, _super);

    function MenuBar(items) {
      this.items = items;
      this.cls = 'menu-bar';
    }

    return MenuBar;

  })(Menu);

  menubar.MenuButton = MenuButton = (function(_super) {
    var complex1, complex2, menu1, menu2, simple, simple2, withIcon;

    __extends(MenuButton, _super);

    function MenuButton(text, subMenu) {
      MenuButton.__super__.constructor.call(this, text, {
        subMenu: subMenu
      });
      this.addClass('menu-button');
    }

    MenuButton.prototype._addEvents = function($el) {
      var that;
      if (this.subMenu != null) {
        that = this;
        return $el.bind('mousedown', function(evt) {
          evt.stopPropagation();
          that._openSubMenu($el, false);
          return Aloha.jQuery('body').one('mousedown', function() {
            return setTimeout(that.subMenu.close.bind(that.subMenu), 10);
          });
        });
      }
    };

    simple = new MenuItem('Format C:');

    simple2 = new MenuItem('Submenu', {
      action: function() {
        return alert('submenu clicked!');
      }
    });

    withIcon = new MenuItem('Bold', {
      action: function() {
        return alert('unbolding');
      },
      checked: true
    });

    complex1 = new MenuItem('Disabled but Complex', {
      action: function() {
        return alert("Clicked!");
      },
      iconCls: 'bold',
      accel: 'Ctrl+B',
      disabled: true
    });

    complex2 = new MenuItem('Has Submenu', {
      iconCls: 'bold',
      checked: true,
      subMenu: new Menu([simple2])
    });

    menu1 = new Menu([new MenuItem('New...'), new MenuItem('Save'), new MenuItem('Print')]);

    menu2 = new Menu([simple, withIcon, complex1, new Separator(), complex2]);

    menubar.exampleMenu = new MenuBar([new MenuButton('File', menu1), new MenuButton('Edit', menu2)]);

    menubar.exampleTool = new ToolBar([
      new ToolButton('Insert', {
        iconCls: 'bold',
        accel: 'Ctrl+B',
        subMenu: new Menu([complex1, complex2])
      }), new Separator(), new ToolButton('Bold', {
        iconCls: 'bold'
      })
    ]);

    return MenuButton;

  })(MenuItem);

}).call(this);

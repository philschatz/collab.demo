
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
  var Menu, MenuBar, MenuBase, MenuButton, MenuItem, Separator, ToolBar, ToolButton, appmenu,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  window.appmenu = appmenu = {};

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

  appmenu.Menu = Menu = (function(_super) {

    __extends(Menu, _super);

    function Menu(items) {
      this.items = items != null ? items : [];
      Menu.__super__.constructor.call(this, 'menu');
    }

    Menu.prototype.render = function() {
      var $item, item, that, _i, _len, _ref;
      if (!(this.el != null)) this.el = Menu.__super__.render.call(this);
      this.el.children().remove();
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        $item = item.render();
        this._closeEverythingBut(item, $item);
        this.el.append($item);
      }
      that = this;
      Aloha.jQuery('body').one('mouseup', function() {
        return setTimeout(function() {
          return Aloha.jQuery('body').one('click', function() {
            return setTimeout(that.close.bind(that), 10);
          });
        }, 10);
      });
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

  appmenu.MenuItem = MenuItem = (function(_super) {

    __extends(MenuItem, _super);

    function MenuItem(text, conf) {
      this.text = text;
      if (conf == null) conf = {};
      MenuItem.__super__.constructor.call(this, 'menu-item');
      this.action = conf.action || null;
      this.iconCls = conf.iconCls || null;
      this.accel = conf.accel || null;
      this.isDisabled = conf.disabled || false;
      this.isChecked = conf.checked || false;
      this.isHidden = conf.hidden || false;
      this.subMenu = conf.subMenu || null;
      this.subMenuChar = '\u25B6';
    }

    MenuItem.prototype._cssToggler = function(val, clazz) {
      if (this.el) {
        if (val) this.el.addClass(clazz);
        if (!val) return this.el.removeClass(clazz);
      }
    };

    MenuItem.prototype.setChecked = function(isChecked) {
      this.isChecked = isChecked;
      this._cssToggler(this.isChecked, 'checked');
      if (this.el) {
        this.el.children('.checked-icon').remove();
        if (this.isChecked) {
          return this._newDiv('checked-icon').append('\u2713').appendTo(this.el);
        }
      }
    };

    MenuItem.prototype.setDisabled = function(isDisabled) {
      this.isDisabled = isDisabled;
      return this._cssToggler(this.isDisabled, 'disabled');
    };

    MenuItem.prototype.setText = function(text) {
      this.text = text;
      if (this.el) return this.el.children('.text')[0].innerHTML = this.text;
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
        top = $el.scrollTop();
        left = $el.scrollLeft();
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
          this.el.addClass('icon');
          this._newDiv('menu-icon').addClass(this.iconCls).appendTo(this.el);
        }
        if (this.accel != null) {
          this._newDiv('accel').append(this.accel).appendTo(this.el);
        }
        this.setDisabled(this.isDisabled);
        if (this.isHidden) this.el.addClass('hidden');
        this.setChecked(this.isChecked);
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
          that = this;
          this.el.bind('mousedown', function(evt) {
            evt.preventDefault();
            Aloha.jQuery('.menu').hide();
            if (that.action != null) return that.action(evt);
          });
          this._addEvents(this.el);
        }
      }
      return this.el;
    };

    return MenuItem;

  })(MenuBase);

  appmenu.Separator = Separator = (function(_super) {

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

  appmenu.ToolBar = ToolBar = (function(_super) {

    __extends(ToolBar, _super);

    function ToolBar(items) {
      if (items == null) items = [];
      ToolBar.__super__.constructor.call(this, items);
      this.cls = 'tool-bar';
    }

    ToolBar.prototype.close = function() {};

    return ToolBar;

  })(Menu);

  appmenu.ToolButton = ToolButton = (function(_super) {

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

  appmenu.MenuBar = MenuBar = (function(_super) {

    __extends(MenuBar, _super);

    function MenuBar(items) {
      this.items = items;
      this.cls = 'menu-bar';
    }

    return MenuBar;

  })(Menu);

  appmenu.MenuButton = MenuButton = (function(_super) {

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
          evt.preventDefault();
          return that._openSubMenu($el, false);
        });
      }
    };

    return MenuButton;

  })(MenuItem);

  appmenu.custom = {};

  appmenu.custom.Heading = (function(_super) {

    __extends(Heading, _super);

    function Heading(markup, text, conf) {
      this.markup = markup;
      Heading.__super__.constructor.call(this, text, conf);
    }

    Heading.prototype._newDiv = function(cls) {
      var $el;
      if (cls === 'text') {
        $el = Aloha.jQuery(this.markup);
        $el.addClass(cls);
        $el.addClass('custom-heading');
        return $el;
      } else {
        return Heading.__super__._newDiv.call(this, cls);
      }
    };

    return Heading;

  })(MenuItem);

}).call(this);

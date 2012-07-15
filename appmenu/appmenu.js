
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

    function MenuBase() {}

    MenuBase.prototype._newDiv = function(cls, markup) {
      var $el;
      if (cls == null) cls = '';
      if (markup == null) markup = '<div></div>';
      $el = Aloha.jQuery(markup);
      $el.addClass(cls);
      $el.bind('mousedown', function(evt) {
        evt.stopPropagation();
        return evt.preventDefault();
      });
      return $el;
    };

    return MenuBase;

  })();

  appmenu.Menu = Menu = (function(_super) {

    __extends(Menu, _super);

    function Menu(items) {
      var item, _i, _len, _ref;
      this.items = items != null ? items : [];
      this.el = this._newDiv('menu');
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        this._closeEverythingBut(item);
        this.el.append(item.el);
      }
    }

    Menu.prototype._closeEverythingBut = function(item) {
      var that;
      that = this;
      return item.el.bind('mouseenter', function() {
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
      return item.el.appendTo(this.el);
    };

    Menu.prototype.open = function(position) {
      var $canvas, that;
      $canvas = Aloha.jQuery('body');
      position.top -= $canvas.scrollTop();
      position.left -= $canvas.scrollLeft();
      this.el.css(position).appendTo($canvas);
      this.el.show();
      that = this;
      return Aloha.jQuery('body').one('mousedown', function() {
        return setTimeout(that.close.bind(that), 10);
      });
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
      var that, translated;
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
      this.subMenuChar = conf.subMenuChar || '\u25B6';
      this.el = this._newDiv('menu-item');
      if (this.iconCls != null) {
        this.el.addClass('icon');
        this._newDiv('menu-icon').addClass(this.iconCls).appendTo(this.el);
      }
      if (this.accel != null) {
        translated = this.accel.replace('Shift+', '⇧').replace('Meta+', '⌘');
        this._newDiv('accel').append(translated).appendTo(this.el);
        this.el.attr('title', "" + this.text + " (" + translated + ")");
      }
      this.setDisabled(this.isDisabled);
      this.setHidden(this.isHidden);
      this.setChecked(this.isChecked);
      if (this.text != null) {
        this._newDiv('text').append(this.text).appendTo(this.el);
      }
      if (this.subMenu != null) {
        this.el.addClass('submenu');
        this._newDiv('submenu').appendTo(this.el).append(this.subMenuChar);
      }
      that = this;
      if (this.accel != null) {
        Aloha.jQuery('body').bind('keydown', this.accel.toLowerCase(), function(evt) {
          if (!that.isDisabled && that.action) return that.action(evt);
        });
      }
      this.el.bind('click', function(evt) {
        if (!that.disabled && that.action) {
          evt.preventDefault();
          Aloha.jQuery('.menu').hide();
          return that.action(evt);
        }
      });
      this.el.bind('mouseenter', function() {
        return that.el.addClass('selected');
      });
      this.el.bind('mouseleave', function() {
        return that.el.removeClass('selected');
      });
      this._addEvents();
    }

    MenuItem.prototype._addEvents = function() {
      var that;
      if (this.subMenu != null) {
        that = this;
        return this.el.bind('mouseenter', function() {
          return that._openSubMenu(true);
        });
      }
    };

    MenuItem.prototype._openSubMenu = function(toTheRight) {
      var $parent, left, offset, parentOffset, position, top;
      if (toTheRight == null) toTheRight = false;
      if (this.subMenu != null) {
        offset = this.el.offset();
        $parent = this.el.offsetParent();
        parentOffset = $parent.offset();
        top = offset.top - parentOffset.top + $parent.position().top;
        left = offset.left - parentOffset.left + $parent.position().left;
        if (toTheRight) {
          left += this.el.outerWidth();
        } else {
          top += this.el.outerHeight();
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

    MenuItem.prototype._cssToggler = function(val, cls) {
      if (val) this.el.addClass(cls);
      if (!val) return this.el.removeClass(cls);
    };

    MenuItem.prototype.setChecked = function(isChecked) {
      this.isChecked = isChecked;
      this._cssToggler(this.isChecked, 'checked');
      this.el.children('.checked-icon').remove();
      if (this.isChecked) {
        return this._newDiv('checked-icon').append('\u2713').appendTo(this.el);
      }
    };

    MenuItem.prototype.setDisabled = function(isDisabled) {
      this.isDisabled = isDisabled;
      return this._cssToggler(this.isDisabled, 'disabled');
    };

    MenuItem.prototype.setHidden = function(isHidden) {
      this.isHidden = isHidden;
      return this._cssToggler(this.isHidden, 'hidden');
    };

    MenuItem.prototype.setText = function(text) {
      this.text = text;
      return this.el.children('.text')[0].innerHTML = this.text;
    };

    return MenuItem;

  })(MenuBase);

  appmenu.Separator = Separator = (function(_super) {

    __extends(Separator, _super);

    function Separator() {
      Separator.__super__.constructor.call(this, null, {
        disabled: true
      });
      this.el.addClass('separator');
    }

    Separator.prototype._addEvents = function() {};

    return Separator;

  })(MenuItem);

  appmenu.ToolBar = ToolBar = (function(_super) {

    __extends(ToolBar, _super);

    function ToolBar(items) {
      if (items == null) items = [];
      ToolBar.__super__.constructor.call(this, items);
      this.el.addClass('tool-bar');
      this.el.removeClass('menu');
    }

    ToolBar.prototype.close = function() {};

    return ToolBar;

  })(Menu);

  appmenu.ToolButton = ToolButton = (function(_super) {

    __extends(ToolButton, _super);

    function ToolButton(text, conf) {
      conf.subMenuChar = '\u25BC';
      ToolButton.__super__.constructor.call(this, text, conf);
      this.el.addClass('tool-button');
      this.toolTip = conf.toolTip || null;
    }

    ToolButton.prototype._addEvents = function() {
      var that, tip;
      tip = this._newDiv('tool-tip').appendTo(this.el);
      if (this.toolTip != null) {
        tip.append(this.toolTip);
      } else {
        tip.append(this.text);
        if (this.accel) tip.append(" (" + this.accel + ")");
      }
      if (this.subMenu != null) {
        that = this;
        return this.el.bind('click', function() {
          return that._openSubMenu(false);
        });
      }
    };

    return ToolButton;

  })(MenuItem);

  appmenu.MenuBar = MenuBar = (function(_super) {

    __extends(MenuBar, _super);

    function MenuBar(items) {
      MenuBar.__super__.constructor.call(this, items);
      this.el.addClass('menu-bar');
      this.el.removeClass('menu');
    }

    MenuBar.prototype.close = function() {};

    return MenuBar;

  })(Menu);

  appmenu.MenuButton = MenuButton = (function(_super) {

    __extends(MenuButton, _super);

    function MenuButton(text, subMenu) {
      MenuButton.__super__.constructor.call(this, text, {
        subMenu: subMenu
      });
      this.el.addClass('menu-button');
    }

    MenuButton.prototype._addEvents = function() {
      var that;
      that = this;
      this.el.bind('click', function(evt) {
        return that._openSubMenu(false);
      });
      return this.el.bind('mouseenter', function(evt) {
        var openMenu, _i, _len, _ref, _results;
        _ref = Aloha.jQuery('.menu');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          openMenu = _ref[_i];
          if (openMenu !== that.el[0]) {
            _results.push(Aloha.jQuery(openMenu).hide());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
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
        $el = Heading.__super__._newDiv.call(this, cls, this.markup);
        $el.addClass('custom-heading');
        return $el;
      } else {
        return Heading.__super__._newDiv.call(this, cls);
      }
    };

    return Heading;

  })(MenuItem);

}).call(this);

(function() {
  var menuSettings, toolbarSettings;

  menuSettings = [
    {
      text: "Format",
      subMenu: [
        "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "quote", '', {
          text: 'Paragraph Styles',
          subMenu: ["indentList", "outdentList"]
        }, {
          text: "Align",
          subMenu: ["alignLeft", "alignCenter", "alignRight", "alignJustify"]
        }, "formatLink", "formatAbbr", "formatNumeratedHeaders", "toggleMetaView", "wailang", "toggleFormatlessPaste"
      ]
    }, {
      text: "Insert",
      subMenu: ["characterPicker", "insertLink", "insertImage", "insertAbbr", "insertToc", "insertHorizontalRule", "insertTag"]
    }, {
      text: "Table",
      subMenu: [
        "createTable", '', {
          text: "Cell",
          subMenu: ["mergecells", "splitcells", "tableCaption", "tableSummary", "formatTable"]
        }, {
          text: "Row",
          subMenu: ["addrowbefore", "addrowafter", "deleterows", "rowheader", "mergecellsRow", "splitcellsRow", "formatRow"]
        }, '', {
          text: "Column",
          subMenu: ["addcolumnleft", "addcolumnright", "deletecolumns", "columnheader", "mergecellsColumn", "splitcellsColumn", "formatColumn"]
        }
      ]
    }
  ];

  toolbarSettings = ['bold', 'italic', 'underline', '', 'insertLink', 'insertImage', '', 'orderedList', 'unorderedList', 'outdentList', 'indentList', '', "alignLeft", "alignCenter", "alignRight", "alignJustify"];

  define(["aloha", "aloha/plugin", "ui/ui", 'ribbon/ribbon-plugin', "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, Ui, Ribbon, i18n, i18nCore) {
    var CONTAINER_JQUERY;
    CONTAINER_JQUERY = jQuery('.toolbar') || jQuery('<div></div>').addClass('toolbar-container').appendTo('body');
    /*
       register the plugin with unique name
    */
    return Plugin.create("toolbar", {
      init: function() {
        var applyHeading, item, labels, menu, menuLookup, menubar, order, recurse, subMenuItems, tab, toolbar, toolbarLookup, _i, _j, _len, _len2;
        window.menubar = menubar = new appmenu.MenuBar([]);
        menubar.el.appendTo($('.menubar'));
        window.toolbar = toolbar = new appmenu.ToolBar();
        toolbar.el.appendTo(CONTAINER_JQUERY);
        toolbar.el.addClass('aloha');
        menuLookup = {};
        toolbarLookup = {};
        recurse = function(item, lookupMap) {
          var menuItem, subItem, subItems, subMenu;
          if ('string' === $.type(item)) {
            if ('' === item) return new appmenu.Separator();
            menuItem = new appmenu.MenuItem('EMPTY_LABEL');
            lookupMap[item] = menuItem;
            return menuItem;
          } else {
            subItems = (function() {
              var _i, _len, _ref, _results;
              _ref = item.subMenu || [];
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                subItem = _ref[_i];
                _results.push(recurse(subItem, lookupMap));
              }
              return _results;
            })();
            subMenu = new appmenu.Menu(subItems);
            subMenu.el.addClass('aloha');
            menuItem = new appmenu.MenuItem(item.text, {
              subMenu: subMenu
            });
            return menuItem;
          }
        };
        for (_i = 0, _len = menuSettings.length; _i < _len; _i++) {
          tab = menuSettings[_i];
          subMenuItems = (function() {
            var _j, _len2, _ref, _results;
            _ref = tab.subMenu;
            _results = [];
            for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
              item = _ref[_j];
              _results.push(recurse(item, menuLookup));
            }
            return _results;
          })();
          menu = new appmenu.Menu(subMenuItems);
          menu.el.addClass('aloha');
          menubar.append(new appmenu.MenuButton(tab.text, menu));
        }
        for (_j = 0, _len2 = toolbarSettings.length; _j < _len2; _j++) {
          item = toolbarSettings[_j];
          toolbar.append(recurse(item, toolbarLookup));
        }
        Ui.adopt = function(slot, type, settings) {
          var item2;
          if (slot in menuLookup && slot in toolbarLookup) {
            item = menuLookup[slot];
            item2 = toolbarLookup[slot];
            item.element = item.el;
            item2.element = item2.el;
            item.setText(settings.tooltip);
            item.setIcon(settings.icon);
            item.setAction(settings.click);
            item2.setText(settings.tooltip);
            item2.setIcon(settings.icon);
            item2.setAction(settings.click);
            return {
              show: function() {
                item.setHidden(false);
                return item2.setHidden(false);
              },
              hide: function() {
                item.setHidden(true);
                return item2.setHidden(true);
              },
              setActive: function(bool) {
                item.setChecked(bool);
                return item2.setChecked(bool);
              },
              setState: function(bool) {
                item.setChecked(bool);
                return item2.setChecked(bool);
              },
              enable: function() {
                item.setDisabled(false);
                return item2.setDisabled(false);
              },
              disable: function() {
                item.setDisabled(true);
                return item2.setDisabled(true);
              },
              setActiveButton: function(a, b) {
                return console.log("" + slot + " TODO:SETACTIVEBUTTON:", a, b);
              },
              focus: function(a) {
                return console.log("" + slot + " TODO:FOCUS:", a);
              },
              foreground: function(a) {
                return console.log("" + slot + " TODO:FOREGROUND:", a);
              }
            };
          } else if (slot in menuLookup || slot in toolbarLookup) {
            item = menuLookup[slot] || toolbarLookup[slot];
          } else {
            item = new appmenu.MenuItem('DUMMY_ITEM_THAT_SQUASHES_STATE_CHANGES');
          }
          item.setText(settings.tooltip);
          item.setIcon(settings.icon);
          item.setAction(settings.click);
          item.element = item.el;
          return {
            show: function() {
              return item.setHidden(false);
            },
            hide: function() {
              return item.setHidden(true);
            },
            setActive: function(bool) {
              return item.setChecked(bool);
            },
            setState: function(bool) {
              return item.setChecked(bool);
            },
            setActiveButton: function(a, b) {
              return console.log("" + slot + " SETACTIVEBUTTON:", a, b);
            },
            enable: function() {
              return item.setDisabled(false);
            },
            disable: function() {
              return item.setDisabled(true);
            },
            focus: function(a) {
              return console.log("" + slot + " TODO:FOCUS:", a);
            },
            foreground: function(a) {
              return console.log("" + slot + " TODO:FOREGROUND:", a);
            }
          };
        };
        applyHeading = function() {
          var $newEl, $oldEl, rangeObject;
          rangeObject = Aloha.Selection.getRangeObject();
          if (rangeObject.isCollapsed()) {
            GENTICS.Utils.Dom.extendToWord(rangeObject);
          }
          Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(this.markup));
          $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer());
          $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer());
          return $newEl.addClass($oldEl.attr('class'));
        };
        order = ['p', 'h1', 'h2', 'h3'];
        labels = {
          'p': 'Normal Text',
          'h1': 'Heading 1',
          'h2': 'Heading 2',
          'h3': 'Heading 3'
        };
        /*
              headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {accel: "Ctrl+#{ h.charAt(1) }", action: applyHeading }) for h in order)
              
              headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons)})
              toolbar.append(headingsButton)
              toolbar.append(new appmenu.Separator())
        */
        return Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
          var $el, h, i, isActive, _len3, _results;
          $el = Aloha.jQuery(rangeObject.startContainer);
          _results = [];
          for (i = 0, _len3 = order.length; i < _len3; i++) {
            h = order[i];
            _results.push(isActive = $el.parents(h).length > 0);
          }
          return _results;
        });
      },
      /*
           toString method
      */
      toString: function() {
        return "toolbar";
      }
    });
  });

}).call(this);

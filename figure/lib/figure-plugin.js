(function() {

  define(["aloha", "aloha/plugin", 'block/block', "block/blockmanager"], function(Aloha, Plugin, block, BlockManager, i18n, i18nCore) {
    /*
       Monkey patch a couple of things in Aloha so figures can be draggable blocks
    */    block.AbstractBlock.prototype._postProcessElementIfNeeded = function() {
      this.createEditablesIfNeeded();
      this._checkThatNestedBlocksAreStillConsistent();
      this._makeNestedBlockCollectionsSortable();
      this.renderBlockHandlesIfNeeded();
      if (this.isDraggable() && this.$element[0].tagName.toLowerCase() === 'span') {
        this._setupDragDropForInlineElements();
        return this._disableUglyInternetExplorerDragHandles();
      } else if (this.isDraggable()) {
        this._setupDragDropForBlockElements();
        return this._disableUglyInternetExplorerDragHandles();
      }
    };
    BlockManager._blockify = function(element, instanceDefaults) {
      var $element, attributes, tagName;
      $element = jQuery(element);
      tagName = $element[0].tagName.toLowerCase();
      attributes = this.getConfig($element, instanceDefaults);
      if (!this.blockTypes.has(attributes['aloha-block-type'])) {
        Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['aloha-block-type'] + ' not found!');
        return;
      }
      block = new (this.blockTypes.get(attributes['aloha-block-type']))($element);
      block.$element.addClass('aloha-block-' + attributes['aloha-block-type']);
      jQuery.each(attributes, function(k, v) {
        return block._setAttribute(k, v);
      });
      return this.blocks.register(block.getId(), block);
    };
    /*
       register the plugin with unique name
    */
    return Plugin.create("figure", {
      init: function() {
        var EditableImageBlock;
        EditableImageBlock = block.AbstractBlock.extend({
          title: 'Image',
          getSchema: function() {
            return {
              'image': {
                type: 'string',
                label: 'Image URI'
              },
              'position': {
                type: 'select',
                label: 'Position',
                values: [
                  {
                    key: '',
                    label: 'No Float'
                  }, {
                    key: 'left',
                    label: 'Float left'
                  }, {
                    key: 'right',
                    label: 'Float right'
                  }
                ]
              }
            };
          },
          init: function($element, postProcessFn) {
            this.attr('image', $element.find('img').attr('src'));
            return postProcessFn();
          },
          update: function($element, postProcessFn) {
            if (this.attr('position') === 'right') {
              $element.css('float', 'right');
            } else if (this.attr('position') === 'left') {
              $element.css('float', 'left');
            } else {
              $element.css('float', '');
            }
            $element.find('img').attr('src', this.attr('image'));
            return postProcessFn();
          }
        });
        return BlockManager.registerBlockType('EditableImageBlock', EditableImageBlock);
      },
      /*
           toString method
      */
      toString: function() {
        return "figure";
      }
    });
  });

}).call(this);

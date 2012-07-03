/*

Show/hide a context button above the cursor

*/

// Uses rangy2: adds rangy-position to rangy-core (aloha only uses rangy-core and sets the window variable to it)
Aloha.ready(function () {
  var $document = Aloha.jQuery('.document');
  
  var $overlay = Aloha.jQuery('body');
  var $context = Aloha.jQuery('<div class="context-cursor"/>').appendTo($overlay);
  var $icon = Aloha.jQuery('<div class="context-icon">&#160;^</div>').hide().appendTo($context);
  var $menu = Aloha.jQuery('<div class="context-menu"/>').hide().appendTo($context);

  // FROM wikimedia's VisualEditor ve.ce.Surface
  function getSelectionRect(rangeObject) {
    if(! rangeObject.getStartDocumentPos) {
      console.error("Couldn't call getStartDocumentPos on rangy (wrong ver of rangy and proper plugins not installed");
      return null;
    }
    return {
      start: rangeObject.getStartDocumentPos(),
      end: rangeObject.getEndDocumentPos()
    };
  }

  function showContext(rangeObject) {
    // put a context button next to the cursor
    // FROM wikimedia's VisualEditor ve.ui.Context
    var selection = getSelectionRect();
    if (selection) {
      var position = {};
  
      //if(selection.start && selection.end) {
        //if( selection.to > selection.from ) {
          position.left = selection.end.x;
          position.top = selection.end.y;
        //} else {
        //  position.left = selection.start.x;
        //  position.top = selection.start.y;
        //}
    
        
        $context.css(position); //move the icon
        $icon.fadeIn('fast');
      //} else {
      //  $icon.hide();
      //}
    } else {
      $icon.hide();
    }
  }

  var buttons = [
    //{ title: '<em>i</em>',      command: 'em', markup: '<em/>',      shortcut: 'ctrl+shift+e' },
    //{ title: '<strong>B</strong>',        command: 'strong', markup: '<strong/>',  shortcut: 'ctrl+shift+s' },

    //{ title: 'a<sub>x</sub>',     command: 'sub', markup: '<sub/>', shortcut: 'ctrl+shift+down' },
    { title: 'Term',          command: 'cmd-term', markup: '<span class="term"/>',      shortcut: 'ctrl+shift+t' },
    { title: 'Note',          command: 'cmd-note', markup: '<span class="note"/>',      shortcut: 'ctrl+shift+n' },
    { title: 'Quote',         command: 'cmd-quote', markup: '<q />',     shortcut: 'ctrl+shift+q' },
    { title: 'Footnote',      command: 'cmd-footnote', markup: '<span class="footnote"/>',  shortcut: 'ctrl+shift+f' }

  ];

  for(var i=0; i < buttons.length; i++) {
    var f = function() { //for scoping the click handler functions
      var cmd = buttons[i];
      var $cmd = Aloha.jQuery('<div href="#" title="' + cmd.title + ' (' + cmd.shortcut + ')" class="command ' + cmd.command + '" command="' + cmd.command + '"><span>' + cmd.title + '</span></div>');
      $cmd.click(function() {
        var markup = jQuery(cmd.markup);
        var rangeObject = Aloha.Selection.rangeObject;
  
        // when the range is collapsed, extend it to a word
        if (rangeObject.isCollapsed()) {
          GENTICS.Utils.Dom.extendToWord(rangeObject);
        }
  
        // add the markup
//        GENTICS.Utils.Dom.addMarkup(rangeObject, markup);
          Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(markup));

      });
      $cmd.appendTo($menu);
    };
    f();
  }


  $icon.bind('click', function(evt) {
    evt.stopPropagation();
    
    $menu.show();

    $overlay.click(function() {
      $menu.hide();
      $icon.hide();
    });
  });

  // Because of contenteditable, this needs to be outside the editable region
  var $handle = Aloha.jQuery('<div class="handle" contenteditable="false"></div>').hide().appendTo('body');

  // or Aloha.bind('aloha-selection-changed',function(event,rangeObject){
  //$document.contentEditableSelectionChange( function(evt) {
  Aloha.bind('aloha-selection-changed',function(event, rangeObject){
    var sel = rangy.getSelection();
    var ranges = sel.getAllRanges();
    if (ranges.length == 0) {
      return;
    }
    var range = rangeObject; //ranges[0]
    var start = range.startContainer;
    var end = range.endContainer;
    //if(ranges.length && (ranges[0].startContainer != ranges[0].endContainer) || (ranges[0].startOffset != ranges[0].endOffset)) {
      if (rangeObject.getStartDocumentPos) {
        showContext(rangeObject);
      } else {
        console.warn("Not displaying context icon because rangy is missing the rangy-position plugin for pixel-calculation of cursor position");
        $icon.hide();
      }
    //} else {
      // Wait a couple of seconds before showing
    //  $icon.hide();
    //}
    
    //Draw a handle around the selection for moving
    var $start = Aloha.jQuery(start).parent('h1,h2,h3,h4,h5,h6,p');
    var $end = Aloha.jQuery(end).parent('h1,h2,h3,h4,h5,h6,p');
    var css = {};
    if($start.offset()) {

      css.top = $start.offset().top;
      css.height = $end.offset().top + $end.height() - css.top;
      $handle.data({node: $start});
      $handle.css(css).show();
    } else {
      $handle.hide();
    }
  });


  var dragScope = 'blockish-nodes-only';

//  if($document.draggable) {

    // Aloha traps events at the editable root. This re-delegates them.
/*
    function delegate(name) {
      $document.bind(name, function(evt) {
        var $el = Aloha.jQuery(evt.srcElement);
        if(!evt.srcElement) {
          return;
        }
        // Do something about the event
        $el.trigger(name);
      });
    }
    Aloha.jQuery.each('click focusin focusout mousemove mouseover mousedown mouseup mouseenter mouseleave'.split(' '), function(i, event) {
      delegate(event);
    });
*/

//    $blocks.draggable({
//      handle: '.handle',
$handle.draggable({

      scope: dragScope,
      revert: "invalid",
      cursor: "move",
      start: function(el) {
        // TODO Make sure the current user locks the node

        // Aloha seems to "clean up" all the special classes on these elements so make them droppable just-in-time
        var $blocks = $document.find('h1,h2,h3,h4,h5,h6,p');
        $blocks.droppable({
          scope: dragScope,
          hoverClass: "drop-before",
          drop: function(event, ui) {
            // Get back the node id from the html id (replace "_" with "/")
            ui.draggable.data('node').insertBefore(Aloha.jQuery(this));
            ui.draggable.attr('style', '');
          }
        });

      },
    });

    // Handle Drag and Drop

//  }


}); // aloha ready

Aloha.ready(function () {

    // include jquery-ui for drag and drop:
    Aloha.jQuery('<script src="./lib/jquery-ui.min.js"></script>').appendTo('body');
    Aloha.jQuery('.document').aloha();
    
});

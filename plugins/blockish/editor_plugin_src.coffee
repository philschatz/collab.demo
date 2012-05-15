# Load plugin specific language pack
# tinymce.PluginManager.requireLangPack('section');
tinymce.create 'tinymce.plugins.BlockishSelectionPlugin',
  init: (ed, url) ->
  
    G = Cnx.Grammar
    
    # TODO: ed.getDoc() doesn't exist during init 
    mkJQuery = () ->
      (selector) ->
        if not ed.getDoc()?
          console.log "Null editor document for jquery!"
          console.log "When trying to select: #{ selector }"
        else
          if selector?
            jQuery selector, ed.getDoc()
          else
            jQuery ed.getDoc()
    
    ed.onInit.add (ed, cm, n) ->
      # Use the TinyMCE document so wrap all jquery selector calls with the editor doc
      $ = mkJQuery()
      $body = $('#tinymce')

      $startSelect = null
      
      # Restrict what is selectable by changing the contenteditable property when
      # the mouse is clicked or Shift-Arrow is pressed
      $body.on 'mousedown', (evt, b, c, d) ->
        # Decide what to disable
        $target = $(evt.target)
        $startSelect = $target
        
        $body.attr 'contenteditable', false
        
        # Enable on this parent and disable on block (div) siblings
        $target.prevAll('*:not(p)').attr 'contenteditable', false
        $target.nextAll('*:not(p)').attr 'contenteditable', false
        $target.parent().attr 'contenteditable', true

      $body.on 'mouseup', (evt) ->
        # Decide what to disable
        $target = $startSelect
        # For debugging, clear it
        $startSelect = null
        
        # Enable on this parent and disable on block (div) siblings
        $target.prevAll('*:not(p)').removeAttr 'contenteditable'
        $target.nextAll('*:not(p)').removeAttr 'contenteditable'
        $target.parent().removeAttr 'contenteditable'

        $body.attr 'contenteditable', true
        
        # $body.find('*:not(.empty)').removeAttr 'contenteditable'

      # TinyMCE doesn't distinguish between clicks, key presses, etc so we need to
      #   peform all the logic in this method.
      # Add event handlers for clicking on empty/optional/placeholder tags (label/title)
      # http://stackoverflow.com/questions/1391278/contenteditable-change-events#1411296
      # $().on 'focus keydown', 'h1', (evt) ->
      # $().on 'blur keyup paste', '.empty', (evt) ->
      ed.onNodeChange.add (ed, cm, el) ->
        console.log "node Change!"
        console.log ed.selection.getRng()
        $el = $(el)
        if $el.hasClass 'empty'
          # TODO select all the text but not the element
          # See http://www.tinymce.com/wiki.php/API3:method.tinymce.dom.Selection.getRng and setRng
          range = ed.selection.getRng()
          text = range.commonAncestorContainer.textContent

          # Store the original text
          if not $el.data('original')?
            $el.data 'original', text

          # Always select all text in the "empty" node
          ed.selection.select el

      ###
      ed.onKeyPress.add (ed, evt) ->
        console.log "on Change!"
        el = ed.selection.getNode()
        $el = $(el)
        if $el.hasClass 'empty'
          # TODO select all the text but not the element
          # See http://www.tinymce.com/wiki.php/API3:method.tinymce.dom.Selection.getRng and setRng
          range = ed.selection.getRng()
          text = range.commonAncestorContainer.textContent

          # Discard the "Empty" span (since a keypress occurred)
          #$el.parent().text(text)
          ed.selection.setNode($el.parent().get(0))
          $el.remove()
      ###
      
    ed.onBeforeRenderUI.add () ->
      # Use the TinyMCE document so wrap all jquery selector calls with the editor doc
      $ = mkJQuery()

      buildTemplate = (name) ->
        emptyPlaceholder = (tag, title) ->
          # Jquery seems to  strip space when creating elements and the space is needed so when
          # the user selects some "empty" placeholder tag and presses backspace or starts typing
          # they type in the correct element
          $("<#{ tag } class='empty'>&#32;<span class='empty' contenteditable='false'>#{ title }</span> </#{ tag }>")
          
        tag = G.Elements[name]
        switch name
          when 'title' then $el = emptyPlaceholder(tag, '[Title]').addClass(name)
          when 'label' then $el = emptyPlaceholder(tag, '[Label]').addClass(name)
          when 'caption' then $el = emptyPlaceholder(tag, '[Caption]').addClass(name)
          when 'para' then $el = emptyPlaceholder(tag, '...').addClass(name)
          else
            $el = $("<#{ tag }/>").addClass(name)
        # Append all the necessary child elements
        for child in G.Rules[name].templateChildren()
          $el.append buildTemplate(child)
        $el
      
      for name in G.AllElements
        console.log "mce-#{ name }"
        # Wrap in a function so the vars are bound in a closure (like name)
        f = (name) ->
          ed.addCommand "mce-#{ name }", () ->
            console.log "Executing command mce-#{ name }"
            $template = buildTemplate(name)
            context = ed.selection.getNode()
            $context = $(context)
            $template.insertAfter($context)
            
            # If the context is empty then just remove it
            hasContent = $context.children("*:not([data-mce-bogus],.empty)").length > 0 or $context.text().length > 0
            if not hasContent and $context.get(0).tagName.toLowerCase() == 'p'
              $context.remove()
            
            # Either find a para to inject this one into or append it after the newly inserted element
            #if $context.get(0).tagName.toLowerCase() == 'p'
            #  $templatePara = $template.find('p:first')
            #  $templatePara.replaceWith($context) if $templatePara
            
            # Insert para's that allow the user to select before and after one of these blockish pieces
            if $template.get(0).tagName.toLowerCase() == 'div'
              $("<p class='cursor before'>&#160;</p>").insertBefore($template)
              $("<p class='cursor after'>&#160;</p>").insertAfter($template)
            
            null # Return null otherwise TinyMCE will try to re-add the element
        f(name)
        
        ed.addButton name,
          title: "#{ name }.desc"
          cmd: "mce-#{ name }"
          image: url + "/img/#{ name }.gif"

  getInfo: () ->
    longname : 'Blockish Selection Plugin'
    author : 'Philip Schatz'
    authorurl: ''
    infourl: ''
    version: "1.0"


# Register plugin
tinymce.PluginManager.add('blockish', tinymce.plugins.BlockishSelectionPlugin)

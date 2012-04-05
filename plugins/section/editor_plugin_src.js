(function() {
	// Load plugin specific language pack
	// tinymce.PluginManager.requireLangPack('section');

	tinymce.create('tinymce.plugins.SectionPlugin', {
			init : function(ed, ul) {
				ed.addCommand('mceSection', function(ui,v) {
					    if (v==true) {
						 var el = ed.dom.create('section', {}, '<h2 class="title">[Title]</h2><p>[Enter section content here]</p>');
						 ed.selection.setNode(el);   
					    } else {
						 var selected = ed.selection.getNode();
						 var par = ed.dom.getParent(selected,'section');
						 ed.selection.select(par);
						 ed.selection.collapse(false);
						 var el = ed.dom.create('section', {}, '<h2 class="title">[Title]</h2><p>[Enter section content here]</p>');
						 ed.selection.setNode(el); 
					    }
                                });
                        },
	    createControl: function(n, cm) {
			   switch (n) {
			    case 'sectionsplitbutton':
				var c = cm.createSplitButton('sectionsplitbutton', {
				    title : 'Section',
				    image : 'img/exercise.gif',
				    onclick : function() {
					tinyMCE.activeEditor.execCommand('mceSection',false,false);
				    }
				});
		
				c.onRenderMenu.add(function(c, m) {
				    m.add({title : 'Section', onclick : function() {
					tinyMCE.activeEditor.execCommand('mceSection',false,false);
				    }});
		
				    m.add({title : 'Subsection', onclick : function() {
					tinyMCE.activeEditor.execCommand('mceSection',false,true);
				    }});
				});
		
				// Return the new splitbutton instance
				return c;
			}
		
			return null;
		    },
	    

		getInfo : function() {
			return {
				longname : 'Section Plugin',
				author : 'Roché Compaan',
				authorurl : '',
				infourl : '',
				version : "1.0"
			};
		}
	});


	// Register plugin
	tinymce.PluginManager.add('section', tinymce.plugins.SectionPlugin);
})();

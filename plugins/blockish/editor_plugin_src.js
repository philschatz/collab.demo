(function() {
	// Load plugin specific language pack
	// tinymce.PluginManager.requireLangPack('section');

	tinymce.create('tinymce.plugins.BlockishSelectionPlugin', {
			init : function(ed, ul) {
                            ed.onInit.add(function(ed, cm, n, d, e) {
                            
                                var $body = $(ed.getDoc()).find('#tinymce');

                                $body.on('mousedown', function(evt, b, c, d) {
                                    //Decide what to disable
                                    $body.find('*').attr('contenteditable', 'false');
                                    //Enable on this node (and maybe siblings)
                                    $el = $(evt.srcElement);
                                    $el.removeAttr('contenteditable');
                                    $el.parents().removeAttr('contenteditable');
                                    // TODO: Hack because elements are wrapped in div items (for drag and drop )
                                    $el.siblings('p').removeAttr('contenteditable');
                                    $body.attr('contenteditable', 'true');
                                });
                                $body.on('mouseup', function(a, b, c, d) {
                                    $body.find('*').removeAttr('contenteditable');
                                });

                            })

                        },

		getInfo : function() {
			return {
				longname : 'Blockish Selection Plugin',
				author : 'Philip Schatz',
				authorurl : '',
				infourl : '',
				version : "1.0"
			};
		}
	});


	// Register plugin
	tinymce.PluginManager.add('blockish', tinymce.plugins.BlockishSelectionPlugin);
})();

(function() {
	// Load plugin specific language pack
	// tinymce.PluginManager.requireLangPack('exercise');

	tinymce.create('tinymce.plugins.ExercisePlugin', {
		init : function(ed, url) {
			ed.addCommand('mceExercise', function() {
                var el = ed.dom.create('exercise', {},
                                       '<problem><p>[Enter your problem here]</p></problem><solution><p>[Enter your solution here]</p></solution><p>&nbsp;</p>');
                ed.selection.setNode(el);
                console.debug(tinyMCE.activeEditor.getContent());
			});

			ed.addButton('exercise', {
				title : 'exercise.desc',
				cmd : 'mceExercise',
				image : url + '/img/exercise.gif'
			});

			ed.onNodeChange.add(function(ed, cm, n) {
				//cm.setActive('exercise', n.nodeName == 'IMG');
                //cm.setDisabled('bold', true);
                return false;
			});
		},

		getInfo : function() {
			return {
				longname : 'Exercise Plugin',
				author : 'Roché Compaan',
				authorurl : '',
				infourl : '',
				version : "1.0"
			};
		}
	});


	// Register plugin
	tinymce.PluginManager.add('exercise', tinymce.plugins.ExercisePlugin);
})();

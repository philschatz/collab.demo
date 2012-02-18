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
			ed.addCommand('mceSolution', function() {
					var selected = ed.selection.getNode();
					var par = ed.dom.getParent(selected,'problem,solution');
					ed.selection.select(par);
					ed.selection.collapse(false);
					var el = ed.dom.create('solution',{},'<p>[Enter your solution here]</p>');
					ed.selection.setNode(el);
			});
			
			ed.addButton('exercise', {
				title : 'exercise.desc',
				cmd : 'mceExercise',
				image : url + '/img/exercise.gif'
			});
			ed.addButton('solution', {
				title : 'solution.desc',
				cmd : 'mceSolution',
				image : url + '/img/solution.gif'
			});
		
			ed.onNodeChange.add(function(ed, cm, n) {
				var exercise = ed.dom.getParent(n, 'exercise');
				cm.setDisabled('exercise', exercise != null);
				cm.setDisabled('solution', ed.dom.getParent(n, 'problem,solution') == null);
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

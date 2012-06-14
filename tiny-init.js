//JS file providing all init functions for tinymce editor ala oerpub

tinyMCE.init({
        mode: "textareas",
        theme: "advanced",
        theme_advanced_buttons1: "bold,italic,|,undo,redo,|,bullist,numlist,|,fullscreen",
        theme_advanced_buttons2: "exercise,note,figure,section,|,title,label,|,solution,sectionsplitbutton",
        theme_advanced_buttons3: "",
        extended_valid_elements: "figure,caption",
        custom_elements: "figure,caption",
        valid_children: "+body[figure],+p[figure],figure[caption]",
        doctype: "<!DOCTYPE html>",
        content_css: "custom_content.css",
        plugins: "blockish,section,fullscreen",
        theme_advanced_toolbar_location : "top",
        theme_advanced_statusbar_location : "bottom",

        // added pbrian - just to look half decent size
        width : "640",
        height: "480",

});


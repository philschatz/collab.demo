var fs        = require('fs');
var express   = require('express');

/* Load coffee files instead of js files using require.js */
require('coffee-script');

var app = express.createServer();
var dm        = new (require('./manager'))(app);


/* Run a static debug page */
var jquery_js = fs.readFileSync(__dirname+ '/jquery-1.7.2.min.js', 'utf-8');
app.get('/jquery-1.7.2.min.js', function(req,res){
  res.contentType('js');
  res.send(jquery_js);
});
app.get('/client.js', function(req,res){
  // Reload debug.js
  var debug_js = fs.readFileSync(__dirname+ '/client.js', 'utf-8');
  res.contentType('js');
  res.send(debug_js);
});
app.get('/client', function(req, res){
  var index_html = fs.readFileSync(__dirname+ '/client.html', 'utf-8');
  res.send(index_html);
});


app.listen(3001);



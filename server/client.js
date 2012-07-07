$(function() {

// Try to connect to localhost
var socket = io.connect();

var debugReceive = function(command) {
  return socket.on(command, function(message) {
    console.log('Received: ' + command, message);
  });
};

debugReceive('user:hello');
debugReceive('user:list');
debugReceive('user:join');
debugReceive('user:leave');
debugReceive('node:select');
debugReceive('node:operation');

$('.send').on('click', function() {
  var command = $('.command').val();
  var message = $('.message').val();
  message = eval(message);

  console.log('Sending: ' + command, message);
  socket.emit(command, message);
});

});
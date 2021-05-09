var socket = io();
var lastY = 0;
var lastSetHeight = 0;


socket.on('connect', function(){
  console.log(socket.id);
  console.log('socket connected');
  // $('#submitLogin').on('click', fileChangeDialog);
  console.log(socket);
  socket.emit('google login')

});

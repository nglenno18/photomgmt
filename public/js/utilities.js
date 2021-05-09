initListeners = function(e){
  var images = imageC.getElementsByTagName('img');
  images[0].addEventListener('click', triggerChangeDialog);
  images[0].addEventListener('mouseover', changeCursor);
  images[0].addEventListener('mouseout', defaultCursor);
  document.getElementById('headerLabel').addEventListener('mouseover', changeCursor);
  document.getElementById('headerLabel').addEventListener('mouseout', changeCursor);
  $('#batchTest').on('click', redirect);
  $('#batchTest_Template').on('click', redirect);
  $('#gdriveTest').on('click', redirect);
  $('#dbTest').on('click', redirect);
}

changeCursor = function(e){
  console.log('cursor : ', e);
  switch(e.type){
    case 'mouseover':
      document.body.style.cursor = 'pointer';
      break;
    case 'mouseout':
      document.body.style.cursor = 'auto';
      break;
    default: 'auto'
  }
}
defaultCursor = function(e){
  document.body.style.cursor = 'auto';
}

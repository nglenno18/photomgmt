var socket = io();
var currentTarget = '';
// var previewID = 'imageC';
socket.on('connect', function(){
  console.log(socket.id);
  console.log('socket connected');
  var imageC = document.getElementById('imageC');
  $('#singlefd1').on('click', fileChangeDialog);
  while(!imageC){}
  initListeners();
  initFileChangeListeners();
});

// initListeners = function(e){
//   var images = imageC.getElementsByTagName('img');
//   images[0].addEventListener('click', triggerChangeDialog);
//   images[0].addEventListener('mouseover', changeCursor);
//   images[0].addEventListener('mouseout', defaultCursor);
//   document.getElementById('headerLabel').addEventListener('mouseover', changeCursor);
//   document.getElementById('headerLabel').addEventListener('mouseout', changeCursor);
//   $('#batchTest').on('click', redirect);
//   $('#batchTest_Template').on('click', redirect);
//   $('#gdriveTest').on('click', redirect);
//   $('#dbTest').on('click', redirect);
// }

initFileChangeListeners = function(image){
  if(image) return image.addEventListener('click', triggerChangeDialog);
          // will need to create another triggerChangeDialog that changes only a specific Box
  // var boxes = document.getElementsByClassName('box1');
  // console.log('All Boxes : ', boxes);
  // boxes.split(',').forEach((box)=>{
  //   console.log('Box Listener Lists : ', box, box.EventListeners);
  // });
}


redirect = function(e){
  var target= e.target;
  console.log('target : ', target);
  console.log('evt : ', e);
  // console.log(e.currentTarget.classList);
e.currentTarget.classList.forEach((cla)=>{
    console.log('cla: ', cla);
    if(cla === 'test'){
      testRoutes(e);
    }
  });
}

testRoutes = function(e){
  console.log('\nTESTING ROUTES : ', e);
  var route = false;
  switch (e.currentTarget.id){
    case 'dbTest':
      route = '/database';
      break;
    case 'gdriveTest':
      route = '/gDrive';
      break;
    case 'batchTest':
      route = '/batch.html';
      break;
    case 'batchTest_Template':
      route = '/uploadImages.html';
      break;
    default: route = false;
  }
  if(route) window.location.href = route;
}

triggerChangeDialog = function(e){
  console.log('triggerChangeDialog()', e);
  currentTarget = e.target;
  $('#singlefd1').click();
}

fileChangeDialog = function(e){
  var targ = e.target;
  console.log('fileChangeDialog TARGET : ', targ);
  $('#singlefd1').unbind('change');
  $('#singlefd1').on('change', function(evt){
    console.log('Changed : ', evt);
    console.log('Files: ', this.files, window.location.href);
    // scaleAndDisplay(evt);
    if(window.location.href.indexOf('/batch.html')>-1) scaleAndDisplay(evt, 'imageC');
    else previewImages(this.files, 'imageC');
  });
};

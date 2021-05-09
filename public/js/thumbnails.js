var numThumbsRow = 8;
var thumbLength = 0;

setDefaultNumRows = function(windowSize){
    if(!windowSize) windowSize = $(window).width();
    var windowOverThumbs = (windowSize / getThumbLength()).toString();
    if(windowOverThumbs.indexOf('.')>-1) windowOverThumbs = windowOverThumbs.substring(0, windowOverThumbs.indexOf('.'));
    windowOverThumbs = Number(windowOverThumbs);
    console.log('windowOverThumbs : ', windowOverThumbs);

    if(windowSize < 1200) setNumThumbsRow(5);

    // if(windowOverThumbs > 3) numThumbsRow = windowOverThumbs;
}

getNumThumbsRow = function(){
  return this.numThumbsRow;
}

incrementNumThumbsRow = function(truefalse){
  if(truefalse < 0)  this.numThumbsRow--;
  else this.numThumbsRow++;
}

setNumThumbsRow = function(newnum){
  this.numThumbsRow = newnum
}

// THUMB LENGTH
getThumbLength = function(){
  return this.thumblength;
}

setThumbLength = function(newnum){
  this.thumblength = newnum
}

/*
  Determines status of current action on the image
*/
setThumbnailStatus = function(element, status, action, error){
  console.log('set thumbnail status : ', status);
  if(!status) return false;

  var status_object = element.parentNode.querySelector('.thumbWrap_actions .status');
  console.log('set thumbnail status : ', status_object);
  if(!status_object) {
    console.log('\n\nNo Status Object FOUND : ', status_object);
    status_object = createStatus(element, (status || 'success'), (action || 'batchrotate'));
    console.log('\n\nStatus Object Created : ', status_object);
  }
  console.log('\nsetThumbnailStatus : ', status_object);
  if(status === 'success'){
    status_object.className = 'thumbaction status success';
    status_object.innerHTML = '<img class = "thumbstatus" src=".././images/success-action.png"/>';
    if(action === 'move') {
      element.parentNode.classList.add('disabled');
      element.parentNode.parentNode.title = 'Image Moved to another gallery';
      element.parentNode.parentNode.removeEventListener('mouseup', addViewLinkListener);
    }
  }else if(status === 'failed'){
    status_object.className = 'thumbaction status failed';
    status_object.innerHTML = '<img class = "thumbstatus" src=".././images/failed-action.png"/>';
    status_object.title = "FAILED " + action.toUpperCase();
    if(error) status_object.title += ' : ' + error;
  }else{
    status_object.className = 'thumbaction status batchrotate';
    status_object.innerHTML = '<img class = "thumbstatus" src=".././images/pending-batchrotate.png"/>';
  }
}

createStatus = function(element, status, action){
  console.log('createStatus() : ', status);
  var actions = element.parentNode.querySelector('.thumbWrap_actions');
  console.log('createStatus() : ', actions);
  if(!actions) return false;

  clearActions(actions);

  var st = document.createElement('div');
  st.className = 'thumbaction status'+' '+action;
  var src = '.././images/';
  if(status === 'success') src = src + status + '-action.png';
  else{
    src = src + status + '-' + action + '.png';
  }
  st.innerHTML = '<img class="thumbstatus" src="'+ src +'"/>'

  var old = actions.innerHTML;
  actions.append(st);
  return st;
}

clearActions = function(actions){
  console.log('createStatus() -- clearActions() : ', actions);
  var eaches = actions.querySelectorAll('.status');
  if(eaches.length > 0) eaches.forEach((stat)=>{
    stat.parentNode.removeChild(stat);
  })
}

setRotationTimer = function(){
  var rot = 0;
  var def = 20;
  var doc_rot = document.styleSheets;
  console.log('\nSTYLE SHEETS : ', doc_rot[0]);
  var docu = null;
  Object.keys(doc_rot).some((styles)=>{
    var style = doc_rot[styles];
    console.log(style);
    if(style.href.substring(style.href.lastIndexOf('/')).indexOf('gallery_notifs.css') > -1) return docu = style;
  })
  var rot_rule = null;
  console.log('DOCUMENT RULES : ', docu.rules);
  Object.keys(docu.rules).some((rule)=>{
    var dr = docu.rules[rule];
    if(dr.selectorText === '.thumbaction:not(.success):not(.failed) img') rot_rule = dr.style
  })
  console.log('ROT RULE : ', rot_rule);

  return setInterval(function(){
    if((rot + def) >= 360) rot = 0;
    else rot = rot + def;
    console.log('rotating... ', rot);
    rot_rule.setProperty('transform', 'rotate('+rot+'deg)')
  }, 500)
}

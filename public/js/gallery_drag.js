var dragging = false;
var destinationFolderID = false;

startGalleryDrag = function(e){
  e.preventDefault();
  if(e.target.id != "galleryDrag") return;
  var container = document.getElementById('dropdown_gallery');
  var clientY = e.clientY;
  console.log('Start Drag with Target : ', e);
  if(e.changedTouches){
    console.log('Touched');
    clientY = e.changedTouches[0].clientY;
  }else{
    console.log('Clicked');
  }
  lastSetHeight = container.offsetHeight;
  lastY = clientY;
  // lastY = e.target.offsetTop + e.target.offsetHeight;
  console.log('clientY : ', clientY);
  console.log('lastY : ', lastY);
  console.log('Offset Top : ', e.target.offsetTop);
  console.log('Offset Height : ', e.target.offsetHeight);
  console.log('Height : ', e.target.height);
  console.log('LastSetHeight : ', lastSetHeight);
  if(document.getElementById('galleryDrag').className.indexOf('fixed')===-1){
    // gallery is not fixed, should be DRAGGABLE
    container.style.cursor = "row-resize";
    e.target.style.height = '40px';
    e.target.style.position.top = '-15px';
    document.addEventListener('mousemove',dragGallery);
    document.addEventListener('touchmove',dragGallery, {passive: false});
    document.addEventListener('mouseup', endGalleryDrag);
    document.addEventListener('touchend', endGalleryDrag);
  }else{
    console.log('Gallery is set to fixed');
  }
}

dragGallery = function(e){
  e.preventDefault();
  console.log('DRAAAAAGGGGGG', e);
  var container = document.getElementById('dropdown_gallery');
  var yClient = e.clientY || e.changedTouches[0].clientY;
  console.log('Y :', yClient);
  console.log('Last Y : ', lastY);
  console.log('Height Difference ? : ', lastY - yClient);
  var newHeight = lastSetHeight - (lastY - yClient);
  console.log('New Height: ', newHeight);
  console.log('\n\nCSS ');
  // if(newHeight > )container.style.height = newHeight + 'px';
  // if(e.target.id === 'dropdown_gallery' || e.target.id === "galleryDrag" || e.target.id === "main_top" || e.target.id === "dropgallery_wrapper"){
    container.style.height = newHeight + 'px';
  // }
}

endGalleryDrag = function(e){
  var container = document.getElementById('dropdown_gallery');
  console.log('endGalleryDrag : ', container, e, '\n\nDragging : ', dragging);

  container.style.cursor = "auto";
  document.removeEventListener('mousemove', dragGallery);
  document.removeEventListener('mouseup', endGalleryDrag);
  if(!dragging){
    document.removeEventListener('touchmove', dragGallery);
    dragging = true;
    // document.removeEventListener('touchend', endGalleryDrag);
  }else{
    dragging = false;
  }
  console.log('AFTER Dragging : ', dragging);

  // document.removeEventListener('touchend', endGalleryDrag);
  // document.getElementById('galleryDrag').style.height = '8px';
}


// DRAG AND DROP
initDropBox = function(dropbox){
  return;

  console.log('INITIALIZE DROP BOX');
  dropbox.addEventListener('dragenter', dragenter, false);
  dropbox.addEventListener('dragover', dragover, false);
  dropbox.addEventListener('dragleave', dragout, false);
  dropbox.addEventListener('drop', dropdrag, false);
}

function dragout(e){
	e.stopPropagation();
	e.preventDefault();
	console.log('\n\n\n\nDRAG EXCAPED !!! ', e.target);
	e.target.classList.remove('dragovered');
}
function dragenter(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('\n\nDRAG ENETER : ', e.target);
  	document.getElementById('dropdown_gallery').classList.add('dragovered');
}
function dragover(e){
  e.stopPropagation();
  e.preventDefault();
  	console.log('\n\n\n\nDRAG hovering !!! ');
}

function dropdrag(e){
  e.stopPropagation();
  e.preventDefault();

  var transfer = e.dataTransfer;
  var files = transfer.files;
	fileLength = files.length;
	var batch = false;
    if(window.location.href.indexOf('/batch.html')>-1) return scaleAndDisplay(evt, previewID);
    else if(fileLength > 1) batch = true;

	var cb = addToDB;
	if(fileLength>1) cb = batchToDB;


	e.target.classList.remove('dragovered');
  	document.getElementById('dropdown_gallery').classList.remove('dragovered');
  	document.getElementById('dropgallery_wrapper').classList.remove('dragovered');
  try{document.getElementById('dropdown_gallery').scrollTop = document.getElementById('dropdown_gallery').scrollHeight;}catch(e){console.log('Scroll Error: ',e);};

  if(fileLength === 0) return;
  var promptTxt = 'Upload ' + fileLength + ' files?';
  if(loadingGal){
    alert('Please wait for current uploads to be committed...');
    return;
  }

  if(fileLength>0){
      galleryLoading(true);
      // try{disableListRef(['co_dropdown'])}catch(en){console.log('No ListRef Elements!\n -->', en)};
      if(!confirm(promptTxt) || fileLength === 0) {
        galleryLoading(false);
        // try{enableListRef(['co_dropdown'])}catch(en){console.log('No ListRef Elements!\n -->', en)};
        return;
      }

      checkDestination(()=>{
        previewImages(files, previewID, batch, cb);
      });
  }
}

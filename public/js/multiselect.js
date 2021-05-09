var multiSelect = false;
var clickTime = false;
var startingIndex = -1;
var shifting = 'yes';
var startingID = null;

getMultiSelect = function(){
  return this.multiSelect;
}
setMultiSelect = function(mull){
  this.multiSelect = mull;
}
setStart = function(indi, id){
  console.log('NEW START !  ', indi);
  this.startingIndex = indi;
  if(id && id != undefined){
    this.startingID = id;
    var newStart = document.getElementById(id);
    if(newStart) newStart.classList.add('firstSelection');
  }
  else this.startingID = null;
  if(indi === -1) {
    var ele = document.body.querySelectorAll('.firstSelection');
    console.log('eliminate first selection');
    if(ele){
      ele.forEach((el)=>{
        el.classList.remove('firstSelection');
      })
    }
    clearLabelCount();
    setImageCountLabel({count: getImageCount(), outOf: null, gallery: currentGallery.replace('_tab', '').toLowerCase()});
  }
}
getStart = function(){
  return {index: this.startingIndex, id: this.startingID};
}
getShift = function(){
  return this.shifting;
}
setShift = function(yesno){
  console.log('toggleShift() getShift : ', yesno);
  this.shifting = yesno;
}


/*
  Reveals the Batch-only action-buttons on the right-hand top of the gallery
*/
showMultiOptions = function(show){
  console.log('Show Multi Opts : ', show);
	if(show === true){
    document.getElementById('movePhotos').classList.remove('hidedisable');
    document.getElementById('deletePhotos').classList.remove('hidedisable');
    document.getElementById('editPhotos').classList.remove('hidedisable');
    document.getElementById('downloadPhotos').classList.remove('hidedisable');
    document.getElementById('uploadPhoto').classList.add('unclickable');
		document.body.querySelector('#photo_section h2').textContent = 'Multi-Select Images';
	}else{
		document.body.querySelector('#photo_section h2').textContent = 'Photo Section';
    document.getElementById('movePhotos').classList.add('hidedisable');
    document.getElementById('deletePhotos').classList.add('hidedisable');
    document.getElementById('editPhotos').classList.add('hidedisable');
		document.getElementById('uploadPhoto').classList.remove('unclickable');
    document.getElementById('downloadPhotos').classList.add('hidedisable');
	}
  showSelectToggle(show);
}

/*
  ENABLES multiSelect Mode, shows the selectAll option
*/
showSelectToggle = function(show){
  console.log('\nShow Select Toggle : ', show);
  $('#selectAllCheckbox').prop("checked",false);
  $('#selectLabel').prop("checked", false);
  var selectLabel = document.getElementById('selectLabel');
  var selectAllDiv = document.getElementById('selectAllDiv');
  var galleryCount = document.getElementById('galleryCount');

  if(show)document.querySelectorAll('.selectAll').forEach((el)=>{
    el.classList.remove('reserverClass');
    selectLabel.classList.remove('checked');
    selectAllDiv.classList.remove('checked');
    galleryCount.classList.add('checked');

  });
  else{
    galleryCount.classList.remove('checked');
    document.querySelectorAll('.selectAll').forEach((el)=>{
      el.classList.add('reserverClass');
    });
  }
}

selectAllEvent = function(e){
  console.log('selectAll Toggle Clicked! ', e);
  if(multiSelect === false) return;
  $('#selectAllDiv').bind('change');
  console.log('Binded selectAll Toggle with the entire select all div (checkbox + label)');
  var toggleStatus = $('#selectAllCheckbox').prop("checked");

  console.log('\n\nE: selectAll toggleStatus = ', toggleStatus);
  var selectLabel = document.getElementById('selectLabel');
  var selectAllDiv = document.getElementById('selectAllDiv');
  var galleryCount = document.getElementById('galleryCount');
  if(toggleStatus) {
    selectLabel.classList.add('checked');
    selectAllDiv.classList.add('checked');
    // galleryCount.classList.add('checked');
  }
  else {
    selectLabel.classList.remove('checked');
    selectAllDiv.classList.remove('checked');
    // galleryCount.classList.remove('checked');
  }
  selectAll(toggleStatus);
}

/*
  adds or removes the multi-select "fade" on the thumbnails
*/
selectAll = function(toggle){
  var qu = '.thumbnail:not(.hideThumbnail) .thumbWrap:not(.disabled) img.vert';
  // TEST : test server-side stability by allowing the status-icons to be sent in replace of the actual images
    // this will throw an error when the google drive returns a null file
    // var qu = '.thumbnail:not(.hideThumbnail) .thumbWrap img.vert';
  if(!toggle) qu = '.multiselected';
  if(!toggle) setStart(-1);

  if(toggle==='gallery') qu = '.thumbnail .thumbWrap img';
  var tNails = document.getElementById('dropdown_gallery').querySelectorAll(qu);
  console.log('\n\nMultiSelect ALL?? \n', toggle);
  tNails.forEach((ele)=>{
    // var elDoc = document.getElementById(ele.id);
    // console.log('ELDOC to remove multiselected tag from...', elDoc,'\n\nClasses: ', elDoc.className);
    console.log('multiSelect (selectAll) tNail : ', ele.id);
    if(toggle){
      ele.className = ele.className.trim() + ' multiselected';
      try{ele.parentNode.parentNode.classList.add('multiselected');}catch(erel){console.log('Error retreiving image\'s thumbnail wrapper!\n',erel);};
    }
    else {
      ele.className = ele.className.replace(/multiselected/g, '');
      ele.className = ele.className.trim();
      try{ele.parentNode.parentNode.classList.remove('multiselected');}catch(erel){console.log('Error retreiving image\'s thumbnail wrapper!\n',erel);};
    }
  });
  setSelectionCount(getSelectionCount());
}


/*
  click event on a thumbnail item
*/
toggleOffListen = function(e){
	console.log('Toggle Off Listen ', e, e.srcElement.localName, e.path.toString());
	var toggleOff = false;
	if(e.path[0].id != 'dropgallery_wrapper' && e.path[0].id != 'dropdown_gallery'
      && e.path[0].id != 'galleryDrag' && e.path[0].id != 'selectLabel' && e.path[0].id.indexOf('selectAll')===-1){
		console.log('toggle multiSelect OFF : ', e.path[0]);
		toggleOff = true;
		e.path.forEach((ele)=>{
			if(ele.id === 'dropdown_gallery') toggleOff = false;
      if(ele.id) if(ele.id === 'location_form') toggleOff = false;
      if(ele.className) if(ele.className.indexOf('rotate-submit') >-1 || ele.className.indexOf('popout') >-1) toggleOff = false;
			console.log('ele : ', ele.id);
		});
	}
  console.log('e.srcElement.parentNode.className : ', e.srcElement.parentNode.className);
	if(e.srcElement.localName != 'img' && e.srcElement.className.indexOf('thumbWrap')===-1 && toggleOff === true){
		console.log('safe');
		      setMultiSelect(false); //multiSelect = false;
					showMultiOptions(false);
          document.getElementById('deletePhotos').removeEventListener('click', deleteImage);
          setStart(-1);
		document.getElementById('dropdown_gallery').querySelectorAll('.multiselected').forEach((pic)=>{
			pic.classList.remove('multiselected');
		});
    document.body.removeEventListener('mousedown', toggleOffListen);
    document.body.removeEventListener('keydown', shiftKeyListener);
    document.body.removeEventListener('keyup', shiftKeyListener);
	}else if((e.srcElement.localName === 'img' || e.srcElement.className.indexOf('thumbWrap')>-1) && e.srcElement.parentNode.className.indexOf('photoButtons')===-1){
		// the img should be selected with multi select
		 console.log('CLICKED ON wrap: ', e.srcElement.className);
		if(e.srcElement.className.indexOf('multiselected') === -1  && e.srcElement.parentNode.className.indexOf('thumb')>-1) addToSelect(e.srcElement);
		else {
			if(e.srcElement.localName === 'img') removeFromSelect(e.srcElement);
			else removeFromSelect(e.srcElement.querySelector('img'));
		}
	}
}

shiftKeyListener = function(e){
  // console.log('KEY CODE : ', e.keyCode, '\nkeyType = ', e.type);
  if(e.keyCode === 16){
    if(e.type === 'keydown'){
      // console.log('keydown');
        setShift('yes');
    }
    else if(e.type === 'keyup'){
      // console.log('de-Activate SHIFT KEY TOGGLE');
      setShift('no');
    }
  }
}


addToSelect = function(e, firstTag, collection){
		console.log('Add image to multiselected array : ', e, '\n belons to \n', e.parentNode);
		// e.classList.add('multiselected');
    var thumbnails = e;
    var thisThumb = thumbnails.parentNode;
    if(getStart().index === -1) {
      console.log('\n\nTRIGGER first Selection');
      firstTag = true;
    }
    if(e.localName === 'img'){
      thisThumb = e.parentNode.parentNode;
    }else if(e.parentNode.className.indexOf('thumbnail')>-1){
      thisThumb = e.parentNode;
    }
    thisThumb.classList.add('multiselected');
    thisThumb.querySelector('img.vert').classList.add('multiselected');
    var tIndex = getThumbnailIndex(thisThumb);
    if(firstTag === true){
      console.log('First Selection Flag, set new startpoint : ', tIndex);
      setStart(tIndex, thisThumb.id);
    }
    // console.log('if getShift() = true : ', getShift(), ' -- shifting : ', this.shifting, ' collectThumbnails() collection? : ', collection);
    if(getShift() === 'yes' && collection === undefined) collectThumbnails(getStart(), {index: tIndex, id:thisThumb.id});
    else setSelectionCount(getSelectionCount());
		// try{
		// 	console.log('multiselected retreive parent: ', thumbnails.parentNode.parentNode);
		// 	if(thisThumb.parentNode.className.indexOf('thumbnail')>-1){
    //     thisThumb = thisThumb.parentNode;
    //     thisThumb.parentNode.classList.add('multiselected');
    //     thisThumb.querySelector('img').classList.add('multiselected');
    //     if(firstTag === true) thisThumb.parentNode.classList.add('firstSelection');
    //   }
		// }catch(err){
		// 	console.log('error caught:', err);
		// 	if(pare.className.indexOf('thumbnail')>-1) {
		// 		thisThumb.classList.add('multiselected');
		// 		thisThumb.querySelector('img').classList.add('multiselected');
    //     if(firstTag === true) thisThumb.querySelector('img').classList.add('firstSelection');
		// 	}
		// }finally{
    //
    //   // console.log('\n\nFirst Selection : ', getStart());
    // }
}


removeFromSelect = function(sou){
  console.log('Show Select Remove from Select : ', sou);
	clickTime = false;
  try{
    var selectLabel = document.getElementById('selectLabel');
    var selectAllDiv = document.getElementById('selectAllDiv');
    var galleryCount = document.getElementById('galleryCount');

    $('#selectAllCheckbox').prop("checked", false);
    $('#selectLabel').prop("checked", false);
      selectLabel.classList.remove('checked');
      selectAllDiv.classList.remove('checked');

  }catch(eselect){
    console.log('Error selecting the selectAll checkbox element!\n', eselect);
  }
	console.log('Remove image from multiselected array : ', sou);
  sou.classList.remove('multiselected');
	var thumbnail = document.getElementById(sou.id);
	try{
    thumbnail.parentNode.classList.remove('multiselected');
		thumbnail.parentNode.parentNode.classList.remove('multiselected');
    thumbnail.parentNode.classList.remove('firstSelection');
    thumbnail.parentNode.parentNode.classList.remove('firstSelection');
	}catch(e){
		console.log('thumbnail selected : REMOVED : ', thumbnail);
	}finally{
    // if(getSelectedThumbnails().length === 0) setStart(-1);
    setSelectionCount(getSelectionCount());
  }
}


collectThumbnails = function(startObj, endObj){
  console.log('Trigger collectThumbnails()\nstartObj : ', startObj, '\nendObj : ', endObj);
  setShift('no');
  var thumbs = document.body.querySelectorAll('.thumbnail');
  var reachedEnd = false;
  var toSelect = [];
  var greaterIndex = endObj.index;
  if(endObj.index < startObj.index) greaterIndex = startObj.index;

  thumbs.forEach((thumb, indi)=>{
    if(endObj.index > startObj.index){
      if(reachedEnd === false && indi > startObj.index){
        if(thumb.className.indexOf('hideThumbnail') === -1) {
          addToSelect(thumb.querySelector('img.vert'), null, true);
          // thumb.querySelector('img').classList.add('inc');
        }
      }else if(indi < startObj.index){
        removeFromSelect(thumb.querySelector('img.vert'));
      }
    }else if(endObj.index < startObj.index){
      console.log('collectThumbnails() : starting Point (' + startObj.index + ') > new index (' + endObj.index + ')!\ncurrentIndex : ', indi, '\nreachedEnd : ', reachedEnd);
      if(indi > startObj.index){
        console.log('remove rightside selection!');
        if(thumb.className.indexOf('hideThumbnail') === -1){
          removeFromSelect(thumb.querySelector('img.vert'));
        }
      }else if(indi < startObj.index && indi >= endObj.index){
        if(thumb.className.indexOf('hideThumbnail') === -1){
          addToSelect(thumb.querySelector('img.vert'), null, true);
        }
      }
    }
    if(indi === greaterIndex) reachedEnd = true;
  });
  setSelectionCount(getSelectionCount());
}

getThumbnailIndex = function(thumbnail){
  var thumbs = document.body.querySelectorAll('.thumbnail');
  var found = -1;
  var length = thumbs.length;
  var index = 0;
    while (length > index && found === -1) {
      if(thumbs[index].id === thumbnail.id) found = index;
      index++;
    }
    return found;
}

detectLongClick = function(e){
  if(getUserType() === "Contractor") return;
  clickTime = true;
	setTimeout(function(){
		if(clickTime === true && e.srcElement.parentNode.className.indexOf('thumb')>-1 && e.srcElement.className.indexOf('delete')===-1){
			console.log('LONG PRESS DETECTED', clickTime);
			// toggleMultiSelect();

			setMultiSelect(true) //multiSelect = true;
			showMultiOptions(true);
      setTimeout(function(f){
        console.log('E.TARGET = ', e.target);
        addToSelect(e.target)
      }, 0);
      document.getElementById('deletePhotos').addEventListener('click', deleteImage);
      document.body.addEventListener('mousedown', toggleOffListen);
      document.body.addEventListener('keydown', shiftKeyListener);
      document.body.addEventListener('keyup', shiftKeyListener);
		}
		clickTime = false;
		console.log('Turn off timer: ', clickTime);
	}, 1000);
  // addToSelect(e.srcElement);
	// console.log('Toggle MultiSELECT! ', e);
	console.log('ClickTime: ', clickTime);
}



// COUNT LABEL!
clearLabelCount = function(){
  var labelcount = document.getElementById('galleryCount');
  return labelcount.style.opacity = '0';
}
setSelectionCount = function(countObj){
  var labelcount = document.getElementById('galleryCount');
  labelcount.style.opacity = '1';
  return labelcount.textContent = countObj + " selected";
}
getSelectionCount = function(countObj){
  var ts = document.body.querySelectorAll('.thumbnail.multiselected');
  if(ts) return ts.length;
  return null;
}

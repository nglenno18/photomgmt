var socket = io();
var lastY = 0;
var lastSetHeight = 0;
var dragging = false;
var minGalleryHeight = 'calc(var(--thumbnail_length) + var(--gallery_margin_factor)';
var imageButtonNum = 0;
var imagePreview = '';
const fileUploadID = 'uppy_upload';
var imageNum = 0;
var thumbnailSize = 80;
var currentGallery = '';
var currentCount = 0;
var imageCount = 0;
var galleryImCount = 0;
var currentWorkOrder = '';
var fileLength = 0;
var loadingGal = false;
var widestThumb = 0;
var widestScale = 0;
var deleteGal = currentGallery;

var firstLoad = false;
var viewerJS = null;

var thisUser = false;
var addToGDrive = function(e){console.log(e);};
var addToDB = function(e){console.log(e);};
var dropdown = function(e){console.log(e);};
var batchToDB = function(e){console.log(e);};
var deleteImage = function(e){console.log(e);};
var batchDelete = function(e){console.log(e);};
var parseForGoogleID = function(e){console.log(e);};

var dbImageArray = [];


// var GOOGLE_URL = "https://drive.google.com/uc?export=view&id=";
// const GOOGLE_URL = "https://drive.google.com/uc?export=view&id=";

window.onload = function(e){
  initUploadListeners();
  var windowSize = $(window).width();
  var windowOverThumbs = Math.floor(windowSize/300);
  // if(windowOverThumbs > 3) numThumbsRow = windowOverThumbs;
  setDefaultNumRows(windowSize);
  var u = (window.location.host);
  console.log('\n\n\nWindows Location! ', u);
  // GOOGLE_URL = u + '/media/';
  // console.log('GOOGLE URL = ', GOOGLE_URL);
}

socket.on('connect', function(){
    console.log('Socket connected : ', socket.connected, '\nSocket : ', socket.ids, '\n', socket.id);

    $('#photoupload1').on('click', function(e){
      $('uppy_upload').click();
    });

    socket.on('whoAmI', function(params){
      thisUser = params.socketUser;
      console.log('Load Properties Triggered from the Serverside!');
      // console.log('Properties of this User: ', params.socketUser.properties);
      // console.log('Files written in this users storage: ', params.socketUser);
      // console.log('Likst of existing gallery items: ', params.socketUser.gallery);
      var fileTemp = './temp-storage/'+params.socketUser.user_name+'/';
    });

	// ADD BATCH DELETE LISTENER TO the deleteButton
    var selectAllDiv = document.getElementById('selectAllDiv');
    if(deleteImage) document.getElementById('deletePhotos').removeEventListener('click', deleteImage);
		// $('#deletePhotos').on('click', deleteImage);
    $('#selectAllDiv').on('click', selectAllEvent);



    addToDB = function(entryInfo, callback){
      console.log('Adding Image to DATABASE', '\n');
	     entryInfo.workOrder = currentWorkOrder;
       entryInfo.currentGallery = getGalleryTag().replace('_tab', '').toLowerCase();
       socket.emit('addToDB', entryInfo, function(results){
          console.log('Image saved to DATABASE from the server (this is callback to client)');
          // console.log('Image opacity should be 100%', results);
          document.getElementById(entryInfo.imageName).classList.remove('inc');
          if (callback) return callback({results, entryInfo});
          return callback;
      });
    };


	// var batchSafeGuardTimer = false;
	var lastIndex = 0;
	var delayed = false;
	var setTi = function(){};
	var failedArray = [];
	var currentFiles = {};

	socket.on('addTempFile', function(tempStoreFile){
		 // currentFiles.push({tempStoreFile, imageName, gDriveImg});
		 currentFiles[tempStoreFile.filePath] = tempStoreFile;
		 return;
	});

  socket.on('successGD', function(gFile){
    console.log('gDriveUploaded: imageID', gFile);
    // currentFiles[gFile.filePath] = null
    gFile.returned = gFile.filePath;

    // gFile.workOrder = currentFiles[gFile.filePath].
    document.getElementById(gFile.gDriveData.name+'image').parentNode.querySelector('.delete').id = gFile.gDriveData.id;
    dbImageArray.push(gFile);
    currentCount =  currentCount + 1;
    setImageCount(getImageCount() + 1);
    setImageCountLabel({count: currentCount, outOf: fileLength, gallery: currentGallery.replace('_tab', '').toLowerCase()});
    document.getElementById(gFile.gDriveData.name).classList.remove('inc');

    if(currentCount === fileLength && currentCount!=0){
      setImageCountLabel({count: getImageCount(), outOf: null, gallery: currentGallery.replace('_tab', '').toLowerCase()});
      fileLength = 0;
    }
    delete currentFiles[gFile.filePath];
  });


  initLazyLoading = function(){
    console.log('TRIGGER LAZY LOADING ');
    return;

  } // end initlaxyloading

  socket.on('triggerLazyLoading', function(){
    initLazyLoading();
  });


    socket.on('successBatchDL', function(gResults){
      console.log('Batch Delete gDriveImages Results: \n', gResults);
      currentCount = 0;
      console.log('\ngalleryImCount : ', galleryImCount , '\nimagecount :', getImageCount()+1);
    });
  });

addToGoogleDrive = function(e){
  console.log('\n\nADD ALL IMAGES to Google Drive\n\nshould change each image grey while it uploads');
  socket.emit('myGallery', function(images){
    console.log('Images');
  })
}

addToSession = function(image, imgName){
  console.log('Add an Image to the Session Storage');
  socket.emit('addSessionImage', image, imgName, function(e){
    console.log('Callback event after client submits an image to the server\n\t'+
      'The Server adds the image to the session, and returns to this callback: ', e
    );

    socket.emit('whoAmI', function(iAm){
      console.log('\n\nI Am User: ', iAm);
    })
  })
}

clearTabSelected = function(){
  var classList = document.querySelectorAll('.selected');
  console.log('.SELECTED Class list : ', classList);
  var was = false;
  classList.forEach((entry)=>{
    if(entry.className.indexOf('tab')=== -1) return false;
    console.log('list entry : ', entry, '\nTarg : ');
    if(entry.disabled === true) was = entry;
    entry.disabled = false;
    console.log('\n\n\nREMOVE ENTRY FROM SELECTED : ', entry);
      entry.classList.remove('selected');
  });

  var classList = document.getElementById('timeselection').querySelectorAll('.checked');
  console.log('.SELECTED Class list : ', classList);
  var was = false;
  classList.forEach((entry)=>{
    if(entry.className.indexOf('tab')=== -1) return false;
    console.log('list entry : ', entry, '\nTarg : ');
    if(entry.disabled === true) was = entry;
    entry.disabled = false;
    console.log('\n\n\nREMOVE ENTRY FROM SELECTED : ', entry);
      entry.classList.remove('selected');
  });
  return was;
}


dropdown = function(e){
  console.log(' \n\n--------------------GALLERY DROPDOWN FUNCTION! : ', e.id);
  var targ = e.id;
  targ = targ.substring(0,1).toUpperCase() + targ.substring(1).replace('_tab','');
  targ = 'period_' + targ;
  console.log(' \n\n--------------------GALLERY DROPDOWN FUNCTION! : ', targ);
  $('#' + targ).click();
}

changeGallery = function(){
  var old = clearTabSelected();
  console.log('\n\nCHANGE GALLERY ! : ', old);
  if(old.id) old = old.id.replace('_tab','').toLowerCase();
  var deleteGal= true;
  var galName = getGalleryTag();
  alertSent(false);
  if(old != getGalleryTag().toLowerCase()){
    console.log('UPLOAD PAGE -- > request Photos');
    clearGallery();
    deleteGal = null;
    try{
      // console.log('clear gal + propertyPhotos : ', currentWOindex, wo_list, wo_list[currentWOindex].work_order);
      console.log('workOrder page filter images by work order : ')
        workOrder = currentWorkOrder.work_order;
        var cont = currentWorkOrder.contractor;
        var folder = getFolderTag();
        console.log('workOrder Page filter image by :', workOrder);

    }catch(e){
      console.log(e);
      work_order = false;
    }
  }
}

clearGallery = function(){
  alertSent(false);
  var dropGallery = document.getElementById('dropdown_gallery');
  currentCount = 0;
  setImageCount(0);
  destinationFolderID = false;
  activeThumbnails = {};

  try{
    console.log('LOADING ANIMATION : ', typeof(startLoadAnimation));
    if(typeof(startLoadAnimation)==='function'){
      console.log('LOAD ANIMATION METHOD EXISTS');
    }
    if(getUserType() != "Contractor" && params.count != 0) document.getElementById('galleryCount').style.opacity = '0';
  }catch(et){
    console.log('\nNo loading animation method available: ERROR Image COunt', et.message);
    // setImageCountLabel({count: 0, gallery: currentGallery.replace('_tab', '').toLowerCase()});
    // setImageCountLabel({count:getImageCount(),  gallery: currentGallery.replace('_tab', '').toLowerCase()})
  }
  dropGallery.innerHTML =
  "<div id='dropgallery_wrapper'>"+
  "</div>";
  var fileD = document.getElementsByClassName('uppy-FileInput-container')[0];
  if(fileD) try{
    document.getElementById('page_wrapper').removeChild(fileD);}catch(e){console.log('No Uppy File Dialog Found!');}
  uppyInit();
}

initUploadListeners = function(e){
  imagePreview = document.getElementById('buttonPanel');
  var images = imagePreview.querySelectorAll('img');
  console.log('INIT LISTENERS : ', images);

  var image1 = document.getElementById('uploadPhoto');
  image1.addEventListener('click', triggerChangeDialog);

  image1.addEventListener('touchstart', function(e){
    e.preventDefault();
    triggerChangeDialog(e);
  });
  image1.addEventListener('mouseover', changeCursor);
  image1.addEventListener('mouseout', defaultCursor);
	galleryDrag = document.getElementById('galleryDrag');
    galleryDrag.addEventListener('mousedown', startGalleryDrag);
    galleryDrag.addEventListener('touchstart', startGalleryDrag);
	console.log(galleryDrag);

	var dragIco = galleryDrag.getElementsByTagName('img')[0];
	console.log('innerElements : ', dragIco);
	window.addEventListener('resize', imageButtonResize);
    window.addEventListener('resize', displayResize);
    imageButtonResize();

    // Set the thumbnail Length
    var htmlStyles = window.getComputedStyle(document.querySelector("html"));
    thumbnailSize = Number(htmlStyles.getPropertyValue("--thumbnail_length").replace('px',''));
    console.log('\n\nThumbnailDEFAULT SIZE! \n',thumbnailSize);
}

triggerChangeDialog = function(e){
  console.log('triggerChangeDialog()', e);
  currentTarget = e.target;
  $('#'+fileUploadID).click();
}


/*
  Parse a google ID out of a URL string
*/
parseForGoogleID = function(url){
  var og = url;
  if(!url) return null;
  try{
    url = parseForGoogleURL(url);
    if(url.indexOf('&time=') > -1) url = url.substring(0, url.indexOf('&time='));
  }catch(e){
    console.log('\nparseForGoogleID ERROR = ', e);
    return og;
  }
  return url;
}
/*
  Parse a google ID out of a URL string
*/
parseForGoogleURL = function(url){
  if(!url) return null;
  var delim = null;
  if(url.indexOf('&id=')>-1) delim = '&id=';
  else if(url.indexOf('/media/')>-1) delim = '/media/';
  var startIndex = url.indexOf(delim) + delim.length;
  var initString = url.substring(startIndex);
  var finalString = initString;
  // if(initString.indexOf('&time=') > -1) finalString = initString.substring(0, initString.indexOf('&time='));
  return finalString;
}
galleryLoading = function(yesno){
		// console.log('Images have been placed into gallery, disabled features while gallery loads');
    try{
      if(yesno)document.querySelectorAll('.selectAll').forEach((el)=>{
        el.classList.add('unavail');
      });
      else document.querySelectorAll('.selectAll').forEach((el)=>{
        el.classList.remove('unavail');
      });
    }catch(errr){
      console.log('No "selectAll" toggle was found!\n',errr);
    }

    //FOR EACH TAB
    document.querySelectorAll('.button_tab:not(.selected)').forEach((tab)=>{
      // tab.style.pointerActions = 'none';
      // tab.className.replace(/ unclickable/g, '');
      if(yesno === true){
        console.log('disable this tab while uploading...', tab);
        tab.className = tab.className + ' unclickable';
      }else{
        console.log('Re-Enable this tab', tab);
        tab.className = tab.className.replace(/ unclickable/g, '');
      }
    });
    // end Tabs

    try{
      console.log('fileUploadID: ', fileUploadID);
      var upBut = document.getElementById('uploadPhoto');
      // var upl = document.getElementById(fileUploadID);

      if(yesno === true){
        loadingGal = true;
        console.log('disable the uploadImages buttons:\n', upBut);
        // UPDATE :: require user confirmation when navigating away from page
        requireNavConfirmation(true);

        upBut.classList.add('unclickable');
        document.getElementById('contractorRef').classList.add('unclickable');
        document.getElementById('workOrder').classList.add('unclickable');
      }else{
        loadingGal = false;
        // UPDATE :: require user confirmation when navigating away from page
        requireNavConfirmation(false);

        console.log('ENABLE the uploadImages buttons');
        upBut.classList.remove('unclickable');
        document.getElementById('contractorRef').classList.remove('unclickable');
        document.getElementById('workOrder').classList.remove('unclickable');
      }
    }catch(e){
      console.log('ERROR -- Trouble Dis/Abling Elements:\n', e);
    }

    try{
      var uppyUp = document.getElementById('uppy_upload');
      if(yesno){
        uppyUp.classList.add('unclickable');
      }else{
        uppyUp.classList.remove('unclickable');
      }
    }catch(e){
      console.log('\nERROR\nNO UPPY ELEMENT! :', e);
    }

    var wotable = document.getElementById('wo_table');
    if(wotable) {
      if(yesno) wotable.classList.add('unavail');
      else wotable.classList.remove('unavail');
    };
    var leftgrid = document.getElementsByClassName('leftside_grid')[0];
    if(leftgrid) {
      if(yesno) leftgrid.classList.add('unavail');
      else leftgrid.classList.remove('unavail');
    };
}

// setImageCountLabel({count: serverReturnData.images.length, gallery: serverReturnData.images[0].description});
setImageCountLabel = function(params){
  console.log('setImageCountLabel ', params);
  var countStatement = '';
  if(params.outOf){
    countStatement = countStatement + '(' + params.count + ' '+ '/ ' + params.outOf + ') ';
    document.getElementById('galleryCount').style.opacity = '1';
  }
  else {
    console.log('SetImageCount (not uploading): ', params.gallery, params.count);
    if(getUserType() != "Contractor" && params.count != 0) document.getElementById('galleryCount').style.opacity = '0';
    countStatement = countStatement + params.count + ' ' + params.gallery.toUpperCase().substring(0,1) + params.gallery.substring(1);
  }
  if(countStatement.length>0) countStatement = countStatement + ' images';
  return document.getElementById('galleryCount').textContent = countStatement;
}

setGalCount = function(galC){
  setImageCount(galC);
  this.galleryImCount= galC;
}
getGalCount = function(){
  console.log('getImageCount: ', getImageCount());
  return {imageCount: getImageCount(), galleryImCount: this.galleryImCount};
}
setImageCount = function(galC){
  this.imageCount = galC;
}
getImageCount = function(){
  console.log('getImageCount: ', imageCount);
  return this.imageCount;
}

setFilteredCountLabel = function(params){
  console.log(' \nsetFilteredCountLabel : ', params);
  var selectedSub = params.gal;
  if(!params.gal) {selectedSub = getSubPeriod();}
  if(!selectedSub.id) selectedSub = document.getElementById(selectedSub +'_count');
  console.log('\nsetFilteredCountLabel ID : ', selectedSub);

  if(!selectedSub) return false;
  setFilteredCount({sub_folder: selectedSub.id, count: params.count});
  selectedSub.style.opacity = '1';
  return selectedSub.textContent = "[" + params.count + "]";
}

calculateWindowHeight = function(){
  console.log('calculateWindowHeight()');
  var wHeight = window.innerHeight;
  document.body.style.setProperty('--window_height', wHeight+"px");
  return wHeight;
}

/*
  ("selecting" an image from the gallery would normally update the preview with that image)

  ** photoPreview Image should only show the default upload icon if Upload Image has been clicked **
      - upload Image will toggle an "uploadMode"
      - default photoPreview onload should be the upload icon if Property has no photos.
      - If property has no photos, "uploadMode" = true onload
*/

displayResize = function(e){
  console.log('-------------\ndisplayResize()');
  calculateWindowHeight();

  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var rightside_percentage = htmlStyles.getPropertyValue("--rightside_percentage");
  var bodylength = document.body.offsetWidth;
  var photolength = document.getElementById('photo_section').offsetWidth;
  var outermargin = htmlStyles.getPropertyValue("--outermargin");
  var tlength = htmlStyles.getPropertyValue("--thumbnail_length");
  if(Number(tlength.replace('px','')) === getNumThumbsRow()) return incrementNumThumbsRow(-1);

  // console.log('BODYLENGTH  : ', bodylength);
  // console.log('photolength  : ', photolength);
  outermargin = Number(outermargin.substring(0, outermargin.indexOf('px')))*10;
  photolength = photolength + outermargin;
  var newPercentage = 100*(1-(photolength/bodylength));

    dropdown_gallery.style.paddingRight = '00px';
    dropdown_gallery.style.paddingLeft = '00px';

  var newHeight = document.getElementById('photo_section').offsetHeight - 20;
  document.body.style.setProperty('--topside_height', newHeight + 'px');
  /*
    if the photo is double the length of the height of the Property Section, gallery should jump into the left side
  */
  var newthumlength, numnum, tlengthNum;
  tlengthNum = Number(tlength.replace('px',''));
  tlengthNum = tlengthNum + (2*2 * 10*2);
  var dropdownwidth = dropdown_gallery.offsetWidth;
  var outsidePadding = (2 * 30);

  if(tlengthNum === getNumThumbsRow()) return incrementNumThumbsRow(-1);
  if(getNumThumbsRow() === 1){
    var insidePadding = (2 * 40);
    var pad = outsidePadding + insidePadding;
    newthumlength = dropdown_gallery.offsetWidth - (Number(tlength.replace('px',''))) + pad;
  }
  else{
    dropdownwidth = dropdown_gallery.offsetWidth - (5*getNumThumbsRow());

    var numFact = (2*10*3)-10; // - Number(tlength.replace('px',''));
    newthumlength = (dropdownwidth/getNumThumbsRow())-(numFact);
    if(getNumThumbsRow() <=3){
      numFact = (2*10) + 27;
      // console.log('adjustThumbnails : numFactor = (2*10) + 55', numFact,'\ndropdownWidth : ', dropdownwidth, '\ngetNumThumbsRow() : ', getNumThumbsRow());
      newthumlength= (dropdownwidth/getNumThumbsRow());
      // console.log('adjustThumbnails : longwidth/numthumbsrow = ', newthumlength, ' - ', numFact);
      newthumlength = (dropdownwidth/getNumThumbsRow())-(numFact);
    }
    else if(getNumThumbsRow() >= 4){

      dropdownwidth = dropdown_gallery.offsetWidth; // +getNumThumbsRow();
      numFact = (tlengthNum * getNumThumbsRow());
      numnum = (dropdownwidth)/getNumThumbsRow();
      numnum = numnum - (12*2*2);
      if(getNumThumbsRow() < 12) numnum = numnum + getNumThumbsRow()/2.5;
      else numnum = numnum + getNumThumbsRow()/3;
      if(numnum) newthumlength = numnum;
      console.log('new thumb length : ', newthumlength);
    }
  }

  if(newthumlength < 80){
    console.log('thumb length < 80 : thumb length : ', getNumThumbsRow());
    incrementNumThumbsRow(-1);
  }
  document.body.style.setProperty('--thumbnail_length', newthumlength+"px");
  document.body.style.setProperty('--thumbnailPadding', '10px');


  //always adjust leftside width
  document.body.style.setProperty('--leftside_percentage', newPercentage + '%');
  //Resize thumbnails if they *WERE* larger than the new galleryWidth
  var tl =  (widestThumb / widestScale);
  var gall = document.getElementById('dropdown_gallery');
  /*
    if(gall.offsetHeight > document.getElementById('dropgallery_wrapper').offsetHeight || document.getElementById('dropgallery_wrapper').offsetHeight < 900){
      // console.log('Shrink the Gallery Container!\t', document.getElementById('dropgallery_wrapper').offsetHeight);
      gall.style.height = document.getElementById('dropgallery_wrapper').offsetHeight +10 +'px';
    }
  */
  mobilizeTime(bodylength);
}

var lastG = false;
var lastwidth = 0;
mobilizeTime = function(bodylength){
  console.log('mobilizeTime()');
  if(!bodylength) bodylength = document.body.offsetWidth;
  if(getUserType === "Contractor") return false;
  // console.log('\nbODYWIDTH : ! ', bodylength);
  lastwidth = bodylength;
  if(bodylength < 900){
    console.log('\n900px BodyWIDTH');
    var tFolder = getGalleryTag();
    // console.log('\nBodywidth gl tag : ', tFolder);
    if(tFolder != lastG){
      document.querySelectorAll('.sub_folder').forEach((fold)=>{
        fold.classList.add('hidedisable');
      });
    }
    if(lastwidth > bodylength) lastG = false;
    if(tFolder === 'during' && tFolder!= lastG)showAfters(document.getElementById('period_During'), document.getElementById('period_After'));
    else if(tFolder === 'after' && tFolder!= lastG) showAfters(document.getElementById('period_After'), document.getElementById('period_During'));

    lastG = getGalleryTag();
  }else{
    resizePeriods(true);
  }
}

showAfters = function(docFolder, nextFolder){
  console.log('\n\nbodywidth DURING : ', docFolder);
  var notDone = true;
  var safecount = 0;
  while (notDone === true && safecount < 20) {
    console.log('\n\nbodywidth During :: not after');
    safecount ++;
    if(docFolder) docFolder = docFolder.nextSibling;
    try {
      if(docFolder){
        if(docFolder.id.indexOf('period_')>-1) docFolder.classList.remove('hidedisable');
         if(docFolder.nextSibling.id === nextFolder.id) notDone = false;
      }
    } catch (e) {
      console.log('\n\nBodywidth TimePeriod Error: ',e);
    }
  }
  console.log('\n\nbodywidth AFTER :: AFTER WAS FINISHED');
}

imageButtonResize = function(e){
  var buttons = document.getElementsByClassName('photoButtons');
  imageButtonNum = buttons.length;
  console.log('Resize Triggered');
  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var paddingPix = htmlStyles.getPropertyValue("--standard_Padding");
  paddingPix = paddingPix.substring(0, paddingPix.indexOf('px')) * imageButtonNum;
  var newWidth = (100 - paddingPix*2)/(imageButtonNum);
  var top = document.getElementById('photoButtons').style;
  document.body.style.setProperty('--imageButtonLength', newWidth + '%');
  var width = document.getElementsByClassName('photoButtons')[0].offsetWidth;
  // console.log('NEW WIDTH : (px) ', width.offsetWidth);
  document.body.style.setProperty('--imageButtonPx', width/2 + 'px');

  //attach the gallery tabs to the edge of the container
  var gallery_meny = document.getElementById('gallery_menu');
}

adjustButtonWidth = function(button){
  button.width = 100/imageButtonNum + '%';
}

addThumbnail = function(image, container, newFile){
  var thumbnail = document.createElement('div');
  var thumbnailWrap = document.createElement('div');
  // console.log('addThumbnail() : ' , image);
  if(image.indexOf('&id=')>-1) {
    // image = '../media/' + image.substring(image.indexOf('&id=') + 4)
    image = getUserProxy() + image.substring(image.indexOf('&id=')+4)
  }else if(image.indexOf('/media/')>-1){
    image = getUserProxy() + image.substring(image.indexOf('/media/')+7)
  }
  // if(image.indexOf('/media/')>-1 || image.indexOf('&id=')>-1){
  //   image = getUserProxy() + parseForGoogleID(image);
  // }
  // console.log('\n\nGOOGLE URL = ', image);
  // throw Error;

  thumbnail.className += 'thumbnail standard_border';
  thumbnail.id = container.name || 'thumbnail'+'-'+imageNum;
  if(image.indexOf('data:image') === -1) thumbnail.id = image;
  thumbnail.name = container.id;
  if(thumbnail.id.indexOf('&time=') >-1) thumbnail.id = thumbnail.id.substring(0, thumbnail.id.indexOf('&time='));
  var thumbTitle = thumbnail.id;
  if(thumbTitle.indexOf('../media/') > -1) thumbTitle = 'https://' + window.location.host+thumbnail.id.replace('../', '/');
  var imageID = thumbnail.id + 'image';
  if(image){
    var tstamp = container.timestamp;
     // || '01/01/1993';
    var innerTXT = '<div class="thumbWrap"><div class="thumbWrap_actions">'+
                                      '<button class="delete" style="float:right" id="' + container.id +
                                      '_delete">X</button></div><div class="clear" >'+
                                    '</div>'+
                                      '<img class="vert lazy" '+
                                      // + 'src="' + image + '" '+
                                      // 'crossorigin="anonymous" ' +
                                      'data-src="' + image + '" id="' + imageID + '"/>'+
                                      '<div class="imageMetaContainer">' +
                                        '<label class="dateLabel">' +
                                          tstamp+
                                        '</label>' +
                                        '<div></div>' +
                                        '<input type="text" readonly';

                                        if(container.fileName) innerTXT += ' placeholder=\"'+container.fileName+'\">';
                                        else innerTXT += ' placeholder="File Name">';
                                        innerTXT += '</input>' +
                                          '</div>' +
                                        '</div>';
    thumbnail.innerHTML = innerTXT;
  }

  if(newFile) thumbnail.classList.add('inc');
  if(container.hideThumb) thumbnail.classList.add('hideThumbnail');

  imageNum ++;
  document.getElementById('dropgallery_wrapper').appendChild(thumbnail);
  thumbnail.addEventListener('mouseup', addViewLinkListener);
  // console.log('CALL addViewLinkListener()');
  thumbnail.addEventListener('mousedown', detectLongClick);
  thumbnail.addEventListener('touchstart', detectLongClick);
  thumbnail.title = thumbTitle;
  if(widestThumb < thumbnail.offsetWidth){
    console.log('set widest thumb : ', thumbnail.offsetWidth);
    widestThumb = thumbnail.offsetWidth;
    widestScale = (thumbnail.offsetWidth/ thumbnail.offsetHeight)
  }
  if(container.refresh){
	  adjustGallery();
    displayResize();
	  console.log('GALLERY ADJUSTED!');
  }
  // throw Error;
  return thumbnail;
}

addViewLinkListener = function(e){
  console.log('addViewLinkListener()');
  // console.log('viewer STANDARD CLICK FUNCTION : \nClick Time: ', clickTime, '\nMultiSelect: ', multiSelect,'\n', e);

  if(e.srcElement.localName === 'button' && e.srcElement.className.indexOf('delete')>-1){
    deleteImage({target: e.currentTarget, id:e.srcElement.id});
    return false;
  }
  if(multiSelect === true) return;
  clickTime = false;
  if(e.srcElement.className.indexOf('imageMetaContainer') >-1) return false;

  var newsource = e.currentTarget.querySelector('img:not(.thumbstatus)').src;
  if(newsource === undefined) newsource = e.currentTarget.querySelector('.thumbWrap img:not(.thumbstatus)').src;
  var gID = newsource;
	  console.log('GID string: ', newsource);

  // window.location.href = e.currentTarget.querySelector('img').src;
  if(newsource.length > 500){				// the image was just upload and the datastring is not the gDriveID
	  console.log('DATASTRING invalid: ', e.currentTarget);
	  newsource = e.currentTarget.querySelector('.delete');
	  gID = newsource.id.replace(/"/g, '');
  }else{
	  try{
      // if(gID.indexOf('view&id=')>1 || gID.indexOf('/media/')>-1) gID = gID.substring(gID.indexOf('view&id=')+ 'view&id='.length);
      if(gID.indexOf('view&id=')>1 || gID.indexOf('/media/')>-1) gID = parseForGoogleURL(gID)
	  }catch(e){
		  console.log('Error gID Value: ', gID, '\n', e);
	  }
  }



  console.log('clickType = ', e.type);
  if(e.type === 'dblclick'){
	  return window.open(
		newsource,
		'_blank'
	  );
  }else{
	  console.log('viewerJS gID : ', gID);
    if(!gID) gID = e.currentTarget.querySelector('img').id;
	  return viewerjsDIV(gID);
  }
}



// ----------- ROTATION INDEX, VIEWERJS
var rotationIndex;
getRotationIndex = function(){
  return this.rotationIndex;
}
setRotationIndex = function(itext){
  this.rotationIndex = itext;
}
clearRotationIndex = function(){
  setRotationIndex(-1);
  setRotation(0);
}


// SCALING Image
  // REFERENCE : https://stackoverflow.com/questions/28498014/canvas-drawimage-poor-quality
scaleImage = function(canvas, srcimg, fct){
  if(!canvas) canvas = document.getElementById("canvas-eleID");
  var ctx = canvas.getContext("2d");
  var cimg = new Image();
  var wide = srcimg.width * fct;
  var tall = srcimg.height * fct;
  canvas.width = wide;
  canvas.height = tall;
  ctx.drawImage(srcimg, 0, 0, wide, tall);
  return canvas;
}

setRotation = function(rotationSet){
  this.img_rotation = rotationSet;
}
getRotation = function(){
  return this.img_rotation;
}

var aniInterval = null;

viewerjsDIV = function(gID){
  $(function() {
    $("img.lazy").Lazy({
        event : "manualTrigger"
    });
  });
  $("img.lazy").trigger("manualTrigger");

  // return;
	var newsource = getUserProxy() + gID;
	var popIMGdiv = document.createElement('div');
	popIMGdiv.innerHTML = '<div>'+
							'<img id="image" src="'+
							newsource +
							'" alt="Picture">'+
							'</div>';
							// '<div>'+
							  // '<ul id="images">'+
								// '<li><img src="picture.jpg" alt="Picture"></li>'+
								// '<li><img src="picture-2.jpg" alt="Picture 2"></li>'+
								// '<li><img src="picture-3.jpg" alt="Picture 3"></li>'+
								// '</ul>'+
							// '</div>';
	// popIMGdiv.classList.add('imageView');
	popIMGdiv.className = 'hidedisable';

	document.body.appendChild(popIMGdiv);
	  // var Viewer = window.Viewer;

	  // var console = window.console || {+ log: function () {} };
    console.log('\n\nviewerjs id = ', gID, '\n');
    // throw Error;
		console.log('VIEWER: ', Viewer);
	  var options = {
  		// inline: true,
  		url: 'data-original',
  		ready: function (e) {
  		  console.log(e.type);
        // TRACK ROTATION EVENTS!
        clearRotationIndex();
        if(aniInterval) rotateRequestReturned(aniInterval, true);
          // document.getElementById('rotate-btn').classList.remove('rotating');

        console.log('READY VIEWERJS : set rotateListener!');
        var leftRotate = document.querySelector('.viewer-rotate-left');
        var rightRotate = document.querySelector('.viewer-rotate-right');

        var rotateListener = function(e){
          rotationIndex++;
          console.log('\n\nRotation INDEX : ', rotationIndex);
          var leftright = e.srcElement.className;
          if(leftright.indexOf('-right')> -1) leftright = 'right';
          else leftright = 'left';
          var imageRotation = viewer.imageData.rotate;
          var copyData = Object.assign({}, viewer.imageData);
          if(leftright === 'left'){
            imageRotation = imageRotation - 90;
          }else imageRotation = imageRotation + 90;
          if(rotationIndex === 0 || imageRotation%360 != 0) document.getElementById('rotate-btn').classList.remove('hidedisable');
          else document.getElementById('rotate-btn').classList.add('hidedisable');
          setRotation(imageRotation);
        };

        console.log('\n\nVIEWERJS : Rotate Listener to 2 buttons : ', leftRotate);
        leftRotate.addEventListener('click', rotateListener);
        rightRotate.addEventListener('click', rotateListener);
  		},
  		show: function (e) {
  		  console.log(e.type);
  		},
  		shown: function (e) {
  		  console.log(e.type);
        console.log('\n\nMODAL SHOWN : ', e);
  		},
  		hide: function (e) {
  		  console.log(e.type);
  		},
  		hidden: function (e) {
  		  console.log(e.type);
        console.log('\n\n\nMODAL HAS HIDDEN!');
        document.getElementById('rotate-btn').parentNode.removeChild(document.getElementById('rotate-btn'));
        setViewerJS();
        clearRotationIndex();

        viewer.destroy();
  		},
      reset: function(e){
        console.log('\n\n\nRESET IMAGE : ', e.detail);
      },
  		view: function (e) {
  		  console.log(e.type);
  		},
  		viewed: function (e) {
  		  console.log(e.type);
        var viewerImg = e.detail.image;

        clearRotationIndex();

        var tmpID = Math.floor(Math.random() * Math.floor(999999));
        var canvas = document.getElementById("canvas-eleID");
        var cimg = new Image();
        // Assemble the "Save Rotation" button
        // var googleID = viewerImg.src.substring(viewerImg.src.indexOf('&id=')+4);
        // var googleID = parseForGoogleID(viewerImg.src);
        var googleID = parseForGoogleURL(viewerImg.src)
        // if(googleID.indexOf('&time=')>-1) googleID = googleID.substring(0, googleID.indexOf('&time='));
        console.log('\n\nAssemble Rotation : ' , googleID);
        setViewerJS(viewer);
        assembleRotate(e.detail, googleID, viewer);
  		}
	  };
	  var viewer;

	// Assemble surrounding array of images to pass into the viewer constructor
	var inHT = '<div><ul id="images">';
	var picEles = document.body.querySelectorAll('.thumbnail:not(.hideThumbnail) div:not(.thumbaction) img:not(.thumbstatus)');
	index = 0;
	picEles.forEach((picEle, i)=>{
    var a = parseForGoogleID(picEle.src);
    var b = parseForGoogleID(newsource)
    console.log('\nthumbnails i = ', index,'\tnewsource = ', b,'\n\tpicSrc === ', a);
		// if(picEle.src === newsource || getUserProxy()+picEle.parentNode.querySelector('.delete').id === newsource) index = i;
    if(a === b) index = i;
		var picSrc = picEle.src;
    // console.log('viewerjs . src = ', picSrc);
		if(picSrc.indexOf('data:image/gif')===0){
      console.log('\nImage Data in BYTES');
			picSrc = picEle.parentNode.querySelector('.delete').id;
      if(picSrc.lastIndexOf('image') === picSrc.length - 5) picSrc = picSrc.substring(0, picSrc.length - 5);
      if(!picSrc){
        picSrc = picEle.id;
      }
      if(picSrc === gID) index = i;
      if(picSrc.indexOf('https://drive.google.com') === -1)picSrc = getUserProxy()+picSrc;
      if(picSrc.indexOf('/media/') === -1)picSrc = getUserProxy()+picSrc;
		}
		inHT = inHT + '<li><img src="' + picSrc + '" alt="Picture ' + (i+1) + '"';
		inHT += '></li>';
	});

	inHT = inHT + '</ul></div>';
	popIMGdiv.innerHTML += inHT;
	// console.log(document.getElementById('images'));
	var viewerDiv = document.getElementById('images');
		viewer = new Viewer(viewerDiv, options);
		// viewer = new Viewer(pictures, options);
	viewerDiv.querySelectorAll('li img')[index].click();
  console.log('\n\nCLICK THUMBNAIL VIEWER : ', index);
	// viewerDiv.click();
	// console.log('viewerDiv : ', viewerDiv);
	viewerDiv.parentNode.removeChild(viewerDiv);
	console.log(inHT);

	return viewer;
}

rotateRequestSent = function(){
  var rotateBTN = document.getElementById('rotate-btn');
  var side = 1;
  return dotdot(rotateBTN);
  return circleButton(rotateBTN);
}

// ANIMATION OPTIONS
dotdot = function(rotateBTN){
  var side = 1;
  rotateBTN.style.borderColor = 'Transparent';
  rotateBTN.style.textAlign = 'left';

  return setInterval(function(){
    if(side > 4) side = 1;
    switch (side) {
      case 1:
        rotateBTN.textContent = "Saving";
        break;
        case 2:
          rotateBTN.textContent = "Saving.";
          break;
          case 3:
            rotateBTN.textContent = "Saving..";
            break;
            case 4:
              rotateBTN.textContent = "Saving...";
              break;
      default: return false;
    }
    side++;
  }, 300);
}

/*
  creates and returns and INTERVAL function that animages the buttons borders
*/
circleButton = function(rotateBTN){
  var side = 1;
  if(rotateBTN.id==="rotate-btn") rotateBTN.classList.add('rotating');

  return setInterval(function(){
    if(side > 4) side = 1;
    rotateBTN.style.borderColor = 'Transparent';
    switch (side) {
      case 1:
        rotateBTN.style.borderLeftColor = "var(--bluetheme)";
        break;
        case 2:
          rotateBTN.style.borderTopColor = "var(--bluetheme)";
          rotateBTN.style.borderLeftColor = "rgba(var(--themeR), var(--themeG), var(--themeB), 0.9)";
          break;
          case 3:
            rotateBTN.style.borderRightColor = "var(--bluetheme)";
            break;
            case 4:
              rotateBTN.style.borderBottomColor = "var(--bluetheme)";
              rotateBTN.style.borderRightColor = "rgba(var(--themeR), var(--themeG), var(--themeB), 0.9)";
              break;
      default: return false;
    }
    side++;
  }, 140);
}

///// END ANIMATIONS

rotateRequestReturned = function(interv, keepShow){
  clearInterval(interv);
  var rot = document.getElementById('rotate-btn');
  if(!rot) return;
  rot.textContent = "SAVE";
  rot.classList.remove('rotating');
  if(!keepShow) rot.classList.add('hidedisable');
  rot.style.borderColor = 'lightgrey';
}

getViewerJS = function(){
  return this.viewerJS;
}
setViewerJS = function(vSet){
  this.viewerJS = vSet;
}
assembleRotate = function(detail, googleID, viewer){
  console.log('\n\nAssemble Rotation!');
  var rotBTN = document.getElementById('rotate-btn');

  clearRotationIndex();
  if(aniInterval) rotateRequestReturned(aniInterval, true);

  if(rotBTN){
    rotBTN.parentNode.removeChild(rotBTN);
    rotBTN = document.createElement('div');
    rotBTN.id ='rotate-btn';
    rotBTN.textContent = "SAVE";
    document.body.appendChild(rotBTN);
    rotBTN.classList.add('hidedisable');
  }
  if(!rotBTN){
    rotBTN = document.createElement('div');
    rotBTN.id ='rotate-btn';
    rotBTN.textContent = "SAVE";
    document.body.appendChild(rotBTN);
    rotBTN.classList.add('hidedisable');
  }else{
    rotBTN.classList.add('hidedisable');
    // return;
  }



    // ACTION for the save button
    rotBTN.addEventListener('click', function(e){
      // ACTION for the save button
      var viewer = getViewerJS();
      var iIndex = viewer.index;

      if(viewer.image.src.indexOf('data:image/')>-1){
        // googleID = viewer.image.src.substring(viewer.image.src.indexOf('&id=')+4);
        googleID = parseForGoogleID(viewer.image.src)
        if(googleID.indexOf('&time=')>-1) googleID = googleID.substring(0, googleID.indexOf('&time='));
        console.log('\n\n\nSubmit SAVE ROTATION : \n', getRotation(), '\nIMG : ', googleID);
      }else{
        // googleID = viewer.image.src.substring(viewer.image.src.indexOf('&id=')+4);
        googleID = parseForGoogleID(viewer.image.src)
        if(googleID.indexOf('&time=')>-1) googleID = googleID.substring(0, googleID.indexOf('&time='));
      }

      aniInterval = rotateRequestSent();
      var getRoty = getRotation();

      var currentViewer = document.getElementsByClassName('viewer-canvas')[0].querySelector('img');

      // capture the margin dimensions to apply to the new image on refresh!
      var marginTop = viewer.imageData.top;
      var marginLeft = viewer.imageData.left;
      var nWidth = viewer.imageData.naturalWidth;
      var nHeight = viewer.imageData.naturalHeight;

      console.log('\n\nImage Margins : ', marginTop, ' x ', marginLeft, '(left)');
      var currentIndex = iIndex;

      $.ajax({
        type:'POST',
        url: '/editing/'+ googleID,
        dataType: 'json',
        data:{
          googleID: [googleID],
          rotation: getRoty
        },
        success: function(successresult){
          console.log('\nGET REQUEST SUCCESS RESULT !');
          var newURL = refreshThumbnail(googleID, 'success');

          if(viewer.index === currentIndex){
            console.log('\n\nSAME IMAGE! ', currentIndex);
            viewer.image.src = newURL;
            viewer.image.currentSrc = newURL;
            detail.originalImage.src = newURL;
            detail.originalImage.currentSrc = newURL;
            currentViewer.src = "";
            currentViewer.src = newURL;
            viewer.rotateTo(0);
            console.log('\nRotate Button should be cleared!');
            clearRotationIndex();
            rotateRequestReturned(aniInterval);
          }else{
            // rotateRequestReturned(aniInterval);
            // var imageRotation = viewer.imageData.rotate;
            // setRotation(imageRotation);
          }
          viewer.images[iIndex] = viewer.image;
          viewer.items[iIndex].children[0].src = newURL;
          viewer.items[iIndex].children[0].currentSrc = newURL;
          viewer.items[iIndex].children[0].setAttribute('data-original-url', newURL);

          // console.log('\n\n\nIMAGE DATA VIEWERJS : index: ', iIndex, '\nviewer: ', viewer, '\noriginalImage : ', viewer.originalImage);

          // log the tranform: rotate(deg) style tag in the viewerjs src.
          // console.log('\n\n\nCURRENT IMAGE VIEWING : ', currentViewer.style, '\nTRANSFORM METHOD : ', currentViewer.style.transform);

          var diff = getRoty%180;
          console.log('\n\n\nDIFFERENCE IN ROTATION : ', diff);
          if(getRoty % 180 != 0 && viewer.index === currentIndex){
            console.log('\n\n\n : 180 degreees');
            var tHeight = currentViewer.style.height;
            var tWidth = currentViewer.style.height;
            currentViewer.style.height = currentViewer.style.width;
            currentViewer.style.width = tHeight;
            // console.log(';Image Data BEFORE: ', Object.assign({}, viewer.imageData));
            tWidth = viewer.imageData.width;
            tHeight = viewer.imageData.height;

            viewer.imageData.width = tHeight;
            viewer.imageData.height = tWidth;
            viewer.imageData.naturalWidth = nHeight;
            viewer.imageData.naturalHeight = nWidth;
            viewer.initialImageData.width = tHeight;
            viewer.initialImageData.height = tWidth;
            viewer.initialImageData.naturalWidth = nHeight;
            viewer.initialImageData.naturalHeight = nWidth;
            // console.log( '\nImage data After: ', viewer.imageData);
            // console.log('\n\nImage Margins : ', marginTop, ' x ', marginLeft, '(left)');
            // console.log('\n\nImage Natural Dimensions (W x H) : ', nWidth, ' x ', nHeight, '(height)');
            // console.log('\n\ne Rotation POST-success: ', detail, '\nviewer :', viewer);
          }

          if(viewer.index === currentIndex){
            viewer.reset();
            setTimeout(function(){
              window.dispatchEvent(new Event('resize')); //resize event triggers the center() method in viewerJS
            }, 700);
          }

          var images = document.getElementById('images');
          // console.log('\n\nIMAGE VIEWER LIST ELEMENT:', images);
          // clear Submit BTN
        },
        error: function(errResult){
          var newURL = refreshThumbnail(googleID, 'failed');
          console.log('GET REQUEST FAILED\n\tError : \n', errResult);
          var diff = getRoty%180;
          console.log('\n\n\nDIFFERENCE IN ROTATION : ', diff);
            // clearRotationIndex();

          alert('Rotation could not be saved to the server!');
          rotateRequestReturned(aniInterval);
          if(viewer.index === currentIndex){
            console.log('\n\nSAME IMAGE! ', currentIndex);
            viewer.rotateTo(0);
            console.log('\nRotate Button should be cleared!');
            clearRotationIndex();
          }
        }
      });
    });
}

clearImageView = function(){
	var elements = document.body.querySelectorAll('.imageView');
	console.log('Clearing Image View Layover: ', elements);
	elements.forEach((ele)=>{
		ele.parentNode.removeChild(ele);
	});

	// document.body.removeEventListener('keypress')
}

scaleToFit = function(thumbnail, imageID){
  var image = document.getElementById(imageID);
  console.log('Scale the Image to fit the standard Thumbnail : ', imageID, image, '\n\nThumbnail: ', thumbnail);
  try{
    console.log('Scale from this Img div : ', image);
	console.log(image.style.offsetWidth , ' x ', image.style.offsetHeight);
  }catch(e){
    console.log('\n\nIMAGE NULL ', image);
  }
  // console.log(height);
}

toggleClass = function(className, e){
  console.log('Toggle Class : ', e, '\nclasses:', e.className);
  if(e.className.indexOf(className)>-1){
    var list = e.className.split(' ');
    e.className = '';
    list.forEach((cname)=>{
      if(cname != className) e.className += cname;
    });
    e.style.height = 'calc(var(--thumbnail_length) + var(--gallery_margin_factor)*4)';
    console.log('Height: ', e.style.offsetHeight);
    // ' + var(--gallery_margin_factor)*2)';
  }else{
    e.className += ' ' + className;
    if(className === 'fixed') e.style.height = 'var(--sq_length)';
  }
}


zoomGallery = function(e){
  console.log('zoom Gallery = ', e);
  var deviation = 1;
  var zoomBtn = null;
  if(e === 'in') {
    deviation = -1;
  }

    var htmlStyles = window.getComputedStyle(document.querySelector("html"));
    var tlength = htmlStyles.getPropertyValue("--thumbnail_length");

  if(getImageCount() === getNumThumbsRow() + deviation && deviation < 0 && Number(tlength.replace('px','')) <= 80){
    console.log('SINGLE ROW! DISABLE MINUMUM ZOOM');
    var zoomBtn = document.getElementById('zoomOut');
    zoomBtn.className.replace('unclickable', '');
    zoomBtn.classList.add('unclickable');
    return false;
  }else if(getImageCount() === getNumThumbsRow() && deviation > 0){
    console.log('FALSE : ', imageCount, ' = ', getNumThumbsRow());
    var listthumbs = document.body.querySelectorAll('.thumbnail:not(.hideThumbnail)');
    setNumThumbsRow(0);
    listthumbs.forEach((listthumb)=>{
      if(listthumb.offsetTop === listthumbs[0].offsetTop) incrementNumThumbsRow(1);
    });
    // return false;
  }else if(Number(tlength.replace('px','')) <= 3){
    console.log('Disable Zoom Out');
    var zoomBtn = document.getElementById('zoomIn');
    zoomBtn.className.replace('unclickable', '');
    zoomBtn.classList.add('unclickable');
    return false;
  }
  console.log('\n\nGALLERY ZOOM : ', Number(tlength.replace('px','')) );
  if(getNumThumbsRow() + deviation > 0) {
    setThumbLength(thumbnailSize);
    setNumThumbsRow(getNumThumbsRow() + deviation);

    displayResize();
  }
}


adjustGallery = function(e){
  console.log('adjustGallery()');
  var galleryHeight = document.getElementById('dropdown_gallery');
    var newHeight = calculateWindowHeight();
    // console.log('adjustGallery : windowHeight : ', newHeight);
    // console.log('adjustGallery : galTop : ', galleryHeight.getBoundingClientRect());
    newHeight = newHeight - galleryHeight.getBoundingClientRect().top;
    // console.log('adjustGallery : newGalHeight : ', newHeight);

    if(newHeight < 100) return false;
    document.getElementById('dropdown_gallery').style.height = newHeight-100 + 'px';
}

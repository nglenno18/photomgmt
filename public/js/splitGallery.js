var socket = io();
var lastY = 0;
var lastSetHeight = 0;
var dragging = false;
var minGalleryHeight = 'calc(var(--thumbnail_length) + var(--gallery_margin_factor)';
var imageButtonNum = 0;
var imagePreview = '';
const fileUploadID = 'photoupload1';
var imageNum = 0;
var thumbnailSize = 80;
var currentGallery = 'before_tab';
var currentWorkOrder = '';
var fileLength = 0;
var clickTime = false;
var multiSelect = false;
var loadingGal = false;
var widestThumb = 0;
var widestScale = 0;
var thumbLength = 0;

var thisUser = false;
var addToGDrive = function(e){console.log(e);};
var addToDB = function(e){console.log(e);};
var dropdown = function(e){console.log(e);};
var deleteImage = function(e){console.log(e);};
var batchToDB = function(e){console.log(e);};
var batchDelete = function(e){console.log(e);};

var dbImageArray = [];


socket.on('connect', function(){
    console.log('Socket connected : ', socket.connected, '\nSocket : ', socket.ids, '\n', socket.id);

    $('#photoupload1').on('click', fileChangeDialog);
    // $('#uploadGDrive').on('click', addToGoogleDrive);
    initUploadListeners();


    socket.on('whoAmI', function(params){
      thisUser = params.socketUser;
      console.log('Load Properties Triggered from the Serverside: ', params);
      console.log('Properties of this User: ', params.socketUser.properties);
      console.log('');
      console.log('Files written in this users storage: ', params.socketUser);
      console.log('Likst of existing gallery items: ', params.socketUser.gallery);
      var fileTemp = './temp-storage/'+params.socketUser.user_name+'/';
    });

	/*
		Pass an e.currentTarget into this method on batch deletion
	*/
    deleteImage = function(target){
      // e.preventDefault();
      console.log('Image to Delete: ', target, '\nMultiSelect enabled?', multiSelect);
  	  var promptTxt = "Are you sure you want to Delete this Image?";
  	  if(multiSelect===true) promptTxt = 'Are you sure you would like to delete these images?';

  	  if(confirm(promptTxt)){
  		  	  if(multiSelect === true) return batchDelete(target);

  		  console.log('Ready to DELETE!');
  		  	   // document.getElementById(target.id).innerHTML = "";

  			socket.emit('deleteDBImage', target.id, function(deleteResult){
  				console.log('Image removed from DB : ', deleteResult);
  				console.log('targetID: ', target.id);
  				console.log('target: ', document.getElementById(target.target.id+'image'));
  				var googleID = document.getElementById(target.target.id+'image').parentNode.querySelector('.delete').id;
  				console.log(googleID);
          if(googleID.indexOf('https://drive.google.com')>-1) googleID = googleID.substring(googleID.indexOf('&id=')+'&id='.length);
          console.log('gID: ', googleID);

  				socket.emit('deleteGDriveImage', googleID, function(gdDelete){
  				  console.log('Image deleted from google drive: ', gdDelete);
  				  target.target.parentNode.removeChild(target.target);
  				  adjustGallery();
  				});
  			  });
  			  target.target.classList.add('inc');
  	  }else{
  		  return console.log('CANCEL Delete!');
  	  }
    }

	batchDelete = function(target){
		console.log('Batch Delete Requested : ', target);
		var thumbnails = document.body.querySelectorAll('img.multiselected');
		var ids = [];
		multiSelect = false;
		thumbnails.forEach((thum)=>{
			var id = thum.id;
			if(id.length > 10) id = thum.parentNode.querySelectorAll('.delete')[0].id;
      if(id.indexOf('https://drive.google.com')>-1) id = id.substring(id.indexOf('&id=')+'&id='.length);
			ids.push(id);
		});
		if(ids.length === 0) return multiSelect = false;

    console.log('Batch Delete Images : ', ids);
		socket.emit('batchDeleteImages', ids, function(deleteResult){
			console.log('Batch delete Result returned from server:', deleteResult);
      var numFinished = 0;
			thumbnails.forEach((thum)=>{
        numFinished++;
				try{thum.parentNode.parentNode.parentNode.removeChild(thum.parentNode.parentNode);}catch(e){console.log(e);}
        if(numFinished === thumbnails.length-1){
          console.log('Batch images completed: ');
          showMultiOptions(false);
        };
			});
		});
		multiSelect = true;
	}

	// ADD BATCH DELETE LISTENER TO the deleteButton
		$('#movePhotos').on('click', deleteImage);



    addToDB = function(entryInfo, callback){
      console.log('Adding Image to DATABASE', entryInfo, '\n\n\n');
      // return;
	  entryInfo.workOrder = currentWorkOrder;
      entryInfo.currentGallery = currentGallery.substring(0, currentGallery.indexOf('_tab')).toLowerCase();
      socket.emit('addToDB', entryInfo, function(results){
        console.log('Image saved to DATABASE from the server (this is callback to client)');
        console.log('Image opacity should be 100%', results);
        // document.getElementById(entryInfo.)
        document.getElementById(entryInfo.imageName).classList.remove('inc');
        // document.getElementById(entryInfo.imageName+'image').parentNode.querySelector('.delete').id = entryInfo.gDriveData.id;
        if (callback) return callback({results, entryInfo});
        return callback;
      });
    };


	// var batchSafeGuardTimer = false;
	var lastIndex = 0;
	var delayed = false;
	var setTi = function(){};
	var failedArray = [];
	var destinationFolderID = false;
	var currentFiles = {};

	batchToDB = function(entryInfo, callback){
		console.log('IMAGE BATCH prep for DB ', entryInfo, callback);
		entryInfo.workOrder = currentWorkOrder;
		entryInfo.currentGallery = currentGallery.substring(0, currentGallery.indexOf('_tab')).toLowerCase();
		// get current image count
		clearTimeout(setTi);
		setTi = setTimeout(function(){
				console.log('DELAYED TIMER : ', lastIndex, ' VS ', fileLength);
				if(lastIndex === fileLength) {
					console.log('DELAYED or Errored Images : ', lastIndex);
					delayed = true;
								// socket.emit('batchToDB', dbImageArray, function(results){
									// console.log('Results returned from batch Insert Statement to DB : ', results);

									// dbImageArray.forEach((ent, ind)=>{
										// console.log('Results returned from batch : ', ind, ': ', ent);

									// });

									// lastIndex to retrieve failed files

									console.log('Errored (still "Current") Files) : ', currentFiles);

									Object.keys(currentFiles).forEach((failed, i)=>{
										// {propertyID, gallery, workOrder, fileName, folderID}
										console.log(failed, i);
										if(!currentFiles[failed]) return;
										socket.emit('storageUpload', failed, currentFiles[failed].gDriveImg, function(returnedRetry){
											console.log('Retry Successful! : ', returnedRetry);
										});
									});

									delayed = false;
									lastIndex = 0;
									dbImageArray = [];
									currentFiles = {};
								// });

					return;
				}
			}, 10000);

		dbImageArray.push(entryInfo);
		document.getElementById(entryInfo.imageName).classList.remove('inc');
		fileLength --;
						lastIndex = fileLength;
		console.log('File Length : ', fileLength, '\nIndex: ', lastIndex, '\nDelayed : ', delayed);
		if(fileLength === 0 || delayed){
			socket.emit('batchToDB', dbImageArray, function(results){
				console.log('Results returned from batch Insert Statement to DB : ', results);

				dbImageArray.forEach((ent, ind)=>{
					console.log('Results returned from batch : ', ind, ': ', ent);
				});
				delayed = false;
				lastIndex = 0;
				dbImageArray = [];
			});
		}
	};

    /*
      Add a Single File to the Google Drive
        (This method will be toggled(ON) if the user wants to auto-add any uploads to gDrive in real time)
          Otherwise, the batch function will add any gallery images to GDrive
    */
    var addToGDriveCalls = 0;
    var tempFilePaths = [];
    addToGDrive = function(image, imageName, propertyID, callback){
  		// imageName = containerImg.title
        console.log('Adding Image to Google Drive', imageName, ' for Property : ', propertyID);
        currentWorkOrder = document.getElementById('workOrder');
        if(currentWorkOrder){
          try{
           currentWorkOrder = workOrder.querySelector('.workOrderVal').textContent;
          }catch(e){
           console.log('Work Order not Found!', e);
           currentWorkOrder = '';
          }
          console.log('work ORDER : ', currentWorkOrder);
        }else currentWorkOrder = false;

        console.log('ADDING IMAGE TO GDRIVE and Gallery : ', propID);
        var galText = propID;
        if(currentGallery){
          try{
            galText = currentGallery.substring(0, currentGallery.indexOf('_tab'));
          }catch(e){
            console.log('No Selected Gallery : ', galText, '\n', e);
          }
        }

        var gDriveImg = {propertyID: propID, workOrder:currentWorkOrder, folderID: propertyID.folderID, gallery: galText}

        // currentFiles.push({image, imageName, gDriveImg});

        // socket.emit('addToGDrive', image, imageName, gDriveImg, function(results){
        //      console.log('Image saved to google drive from the server (this is callback to client)', results);
        //      document.getElementById(imageName+'image').parentNode.querySelector('.delete').id = results.gDriveData.id;
        //      currentFiles[results.returned] = null;
        //       callback(results);
        //    });

        console.log('File Length : ', fileLength);
        socket.emit('addToStorage', image, imageName, gDriveImg, function(tempFile){
          addToGDriveCalls++;
               console.log('Image saved to serverStorage called from the server (this is callback to client)', imageName, ', \n', tempFile);
               // currentFiles[tempFile.returned] = null;
               // console.log('StrFile Returned: tempFile: ', tempFile);

               if(addToGDriveCalls === fileLength) {
                 console.log('MATCH!');
                 // This is where we would implement the batch calls if on CLIENT side

                 // Assemble the currentFiles to be sent to Server and uploaded to GDrive
                 console.log('Submit uploads to GDrive: ', currentFiles)
                 socket.emit('batchGDrive', currentFiles, function(successFiles){
                   console.log('Batch GDrive returned : ', successFiles);
                   console.log('Current Files: ', currentFiles);
                   // currentFiles = [];
                   // socket.emit('batchToDB', dbImageArray, function(ret){
                     console.log('Image Array submitted to DB : ', dbImageArray);
                     alert(fileLength + ' were successfully uploaded to this Property');
                     galleryLoading(false);
                     dbImageArray = [];
                   // });
                 });
                 addToGDriveCalls = 0;
               }
               console.log('LastIndex: ', addToGDriveCalls , '\tFiles: ', fileLength);
               // callback(tempFile);

        });
    };


	socket.on('addTempFile', function(tempStoreFile){
		 // currentFiles.push({tempStoreFile, imageName, gDriveImg});
		 currentFiles[tempStoreFile.filePath] = tempStoreFile;
		 return;
	});

  socket.on('successGD', function(gFile){
    console.log('gDriveUploaded: imageID', gFile);
    // currentFiles[gFile.filePath] = null;
    gFile.returned = gFile.filePath;
    // gFile.workOrder = currentFiles[gFile.filePath].
    document.getElementById(gFile.gDriveData.name+'image').parentNode.querySelector('.delete').id = gFile.gDriveData.id;
    delete currentFiles[gFile.filePath];
    dbImageArray.push(gFile);
    document.getElementById(gFile.gDriveData.name).classList.remove('inc');
  });

  socket.on('successBatchDL', function(gResults){
    console.log('Batch Delete gDriveImages Results: \n', gResults);
    // currentFiles[gFile.filePath] = null;
  });


    //DEFINE the "galleryDropdown"
    dropdown = function(e){
      var targ = e.id;
      currentGallery = targ;
      var classList = document.querySelectorAll('.selected');
      console.log('Class list : ', classList);
      var was = false;
      classList.forEach((entry)=>{
        if(entry.className.indexOf('gallery_tab')=== -1) return false;
        console.log('list entry : ', entry, '\nTarg : ', targ);
        if(entry.disabled === true) was = entry;
        entry.disabled = false;
		entry.classList.remove('selected');
      });
      e.disabled = true;
	  		e.classList.add('selected');

      var galName = currentGallery.substring(0, currentGallery.indexOf('_tab')).toLowerCase();
	  // var currentWOindex = document.getElementById()
	  var workOrder = false;
      if(e.id === was.id){

      }else{
        clearGallery();
		var uploadPage = window.location.href.indexOf('/upload/')>-1;
    if(!uploadPage) uploadPage = window.location.href.indexOf('/splitview/')>-1;
		if(uploadPage){
			try{
				// console.log('clear gal + propertyPhotos : ', currentWOindex, wo_list, wo_list[currentWOindex].work_order);
				console.log('workOrder page filter images by work order : ', uploadPage)
					workOrder = wo_list[currentWOindex].work_order;
					var cont = wo_list[currentWOindex].contractor;
					console.log('workOrder Page filter image by :', workOrder);
								socket.emit('propertyPhotos', {id: propID, gallery: galName, work_order: workOrder, contractor:cont}, loadPhotos);
			}catch(e){
				console.log(e);
				work_order = false;
			}
		}else{
			// socket.emit('propertyPhotos', {id: propID, gallery: galName, work_order: workOrder} , loadPhotos);
		}

      }
      // if(visible) $('dropdown_gallery').addClass('.invisible');
      // else $('dropdown_gallery').removeClass('.invisible');
    }
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

clearGallery = function(){
  var dropGallery = document.getElementById('dropdown_gallery');
  dropGallery.innerHTML =
  "<div id='dropgallery_wrapper'><label id='dragdrop_label' title='Drag & Drop Image Section'><i>Drag Image(s) into the Gallery to Upload</i></label></div>";
  loadMultiOptions();
  dropGallery.querySelector('#dragdrop_label').addEventListener('click', function(e){
	  document.getElementById('uploadPhoto').click();
  });
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
    // addButtonMovements();

		  // document.getElementById('before_tab').click();
		  console.log('BEFORE TAB CLICKED :: WO', wo_list);
	setTimeout(function(e){
		console.log('erewaalhglkahf');
		var dropbox = document.getElementById('dropdown_gallery');
		console.log('Call to Initialize Dropbox : ', dropbox);
		initDropBox(dropbox);
		  // <!-- initializeDropdown(); -->
	});
}

triggerChangeDialog = function(e){
  console.log('triggerChangeDialog()', e);
  currentTarget = e.target;
  $('#'+fileUploadID).click();
}

fileChangeDialog = function(e){
  var targ = e.target;
  console.log('fileChangeDialog TARGET : ', targ);
  $('#'+fileUploadID).unbind('change');
  $('#'+fileUploadID).on('change', function(evt){
    console.log('Changed : ', evt);
    console.log('Files: ', this.files, window.location.href);

  galleryLoading(true);

	fileLength = this.files.length;
  var promptTxt = 'Upload ' + fileLength + ' files?';
  if(!confirm(promptTxt)) return galleryLoading(false);

  var batch = false;
    if(window.location.href.indexOf('/batch.html')>-1) return scaleAndDisplay(evt, previewID);
    else if(fileLength > 1) batch = true;

	var cb = addToDB;
	if(fileLength > 1) cb = batchToDB;

	console.log('Checking the destination : ', batch);

	checkDestination((folderID)=>{
		destinationFolderID = folderID;
		console.log('check the destination: =', destinationFolderID,'\n\n', this.files);
		return previewImages(this.files, previewID, batch, cb);
	});
	// , function(returned){
		// console.log('Prep for batch insert : ', returned);
		// if(fileLength > 1) batchToDB(returned);
			// else{
				// addToDB(returned);
			// }
	// });
  });
};

galleryLoading = function(yesno){
		// console.log('Images have been placed into gallery, disabled features while gallery loads');
    document.querySelectorAll('.gallery_tab:not(.selected)').forEach((tab)=>{
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
    try{
      console.log('fileUploadID: ', fileUploadID);
      var upBut = document.getElementById('uploadPhoto');
      var upLab = document.getElementById('dragdrop_label');
      var upl = document.getElementById(fileUploadID);


      if(yesno === true){
        loadingGal = true;
        console.log('disable the uploadImages buttons:\n', upBut, upLab);
        upBut.classList.add('unclickable');
        upLab.classList.add('unclickable');
      }else{
        loadingGal = false;
        console.log('ENABLE the uploadImages buttons');
        upBut.classList.remove('unclickable');
        upLab.classList.remove('unclickable');
      }
    }catch(e){
      console.log('ERROR -- Trouble Dis/Abling Elements:\n', e);
    }
}


/*
  ("selecting" an image from the gallery would normally update the preview with that image)

  ** photoPreview Image should only show the default upload icon if Upload Image has been clicked **
      - upload Image will toggle an "uploadMode"
      - default photoPreview onload should be the upload icon if Property has no photos.
      - If property has no photos, "uploadMode" = true onload
*/

displayResize = function(e){
  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var rightside_percentage = htmlStyles.getPropertyValue("--rightside_percentage");
  var bodylength = document.body.offsetWidth;
  var photolength = document.getElementById('photo_section').offsetWidth;
  var outermargin = htmlStyles.getPropertyValue("--outermargin");
  console.log('BODYLENGTH  : ', bodylength);
  console.log('photolength  : ', photolength);
  console.log('outermargin  : ',  outermargin.substring(0, outermargin.indexOf('px')));
  outermargin = Number(outermargin.substring(0, outermargin.indexOf('px')))*10;
  photolength = photolength + outermargin;
  console.log('calc  : ', photolength, ' / ', bodylength);
  var newPercentage = 100*(1-(photolength/bodylength));
  console.log('newPercentage  : ', newPercentage);

  console.log('\n\nSET HEIGHT OF PROPERTY ELEMENT : ',  document.getElementById('photo_section').offsetHeight - 200);
  var newHeight = document.getElementById('photo_section').offsetHeight - 20;
  document.body.style.setProperty('--topside_height', newHeight + 'px');
  newHeight = document.getElementById('photoPreviewDiv').offsetHeight - 20;
  document.body.style.setProperty('--topside_detail_height', newHeight + 'px');
  /*
    if the photo is double the length of the height of the Property Section, gallery should jump into the left side
  */
  //always adjust leftside width
  document.body.style.setProperty('--leftside_percentage', newPercentage + '%');
  //Resize thumbnails if they *WERE* larger than the new galleryWidth
  var tl =  (widestThumb / widestScale);
  var gall = document.getElementById('dropdown_gallery');
  console.log('Thumbnails --> ', tl, '\nGallery Width --> ', gall.offsetWidth);
  if(tl > gall.offsetWidth){
    document.body.style.setProperty('--thumbnail_length', ((gall.offsetWidth*widestScale)*.75) + 'px');
  }
}

imageButtonResize = function(e){
  var buttons = document.getElementsByClassName('photoButtons');
  imageButtonNum = buttons.length;
  console.log('Resize Triggered');
  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var paddingPix = htmlStyles.getPropertyValue("--standard_Padding");
  paddingPix = paddingPix.substring(0, paddingPix.indexOf('px')) * imageButtonNum;
  // var marginPix = htmlStyles.getPropertyValue("--standard_Padding");
  // paddingPix = paddingPix.substring(0, paddingPix.indexOf('px')) * 4;
  var newWidth = (100 - paddingPix*2)/(imageButtonNum);
  console.log('Padding Pix : ', paddingPix);
  console.log('NewWidth : ', newWidth);
  var top = document.getElementById('photoButtons').style;
  console.log('\n\nButton Panel Y Index: ', top);
  document.body.style.setProperty('--imageButtonLength', newWidth + '%');
  var width = document.getElementsByClassName('photoButtons')[0].offsetWidth;
  console.log('NEW WIDTH : (px) ', width.offsetWidth);
  document.body.style.setProperty('--imageButtonPx', width/2 + 'px');
  console.log();

  //attach the gallery tabs to the edge of the container
  var gallery_meny = document.getElementById('gallery_menu');
  // gallery_menu.styl.top =

}

adjustButtonWidth = function(button){
  button.width = 100/imageButtonNum + '%';
}

addThumbnail = function(image, container, newFile){
  var thumbnail = document.createElement('div');
  var thumbnailWrap = document.createElement('div');
  console.log('Adding thumbnail to gallery : ', ' \nfrom container : ', container);
  thumbnail.className += 'thumbnail standard_border';
  // thumbnail.style.display = 'inline';
  thumbnail.id = container.name || 'thumbnail'+'-'+imageNum;
  thumbnail.name = container.id;
  var imageID = thumbnail.id + 'image';
  if(image) thumbnail.innerHTML = '<div class="thumbWrap"><div class="thumbWrap_actions"><button class="delete" style="float:right" id="' + container.id +
    '">X</button></div><div class="clear" ></div><img class="vert lazy" '+
    // + 'src="' + image + '" '+
    'data-src="' + image + '" id="' + imageID + '"/></div>';
  if(newFile) thumbnail.classList.add('inc');
  imageNum ++;
  // if(container) thumbnail.id = container.title;
  // if(image.src) thumbnail.appendChild(image);
  document.getElementById('dropgallery_wrapper').appendChild(thumbnail);
    scaleToFit(thumbnail, thumbnail.id + 'image');
  thumbnail.addEventListener('mouseup', addViewLinkListener);
  // thumbnail.addEventListener('dblclick', addViewLinkListener);
  thumbnail.addEventListener('mousedown', detectLongClick);
  // thumbnail.querySelector().addEventListener('click', addViewLinkListener);
  thumbnail.title = imageID;
  if(widestThumb < thumbnail.offsetWidth){
    widestThumb = thumbnail.offsetWidth;
    widestScale = (thumbnail.offsetWidth/ thumbnail.offsetHeight)
  }
  if(container.refresh){
	  adjustGallery();
	  console.log('GALLERY ADJUSTED!');
  }
}

toggleMultiSelect = function(){
	console.log('Toggle Multi Select Function');
	if(multiSelect) multiSelect = false;
	else multiSelect = true;
	console.log('Changed multiSelect to: ', multiSelect);

	document.body.addEventListener('mousedown', toggleOffListen);
}

toggleOffListen = function(e){
	console.log('Toggle Off Listen ', e, e.srcElement.localName, e.path.toString());
	var toggleOff = false;
	if(e.path[0].id != 'dropgallery_wrapper' && e.path[0].id != 'dropdown_gallery' && e.path[0].id != 'galleryDrag'){
		console.log('toggle multiSelect OFF : ', e.path[0]);
		toggleOff = true;
		e.path.forEach((ele)=>{
			if(ele.id === 'dropdown_gallery') toggleOff = false;
			console.log('ele : ', ele.id);
		});
	}
	if(e.srcElement.localName != 'img' && e.srcElement.className.indexOf('thumbWrap')===-1 && toggleOff === true){
		console.log('safe');
		multiSelect = false;
					showMultiOptions(false);
		document.getElementById('dropdown_gallery').querySelectorAll('.multiselected').forEach((pic)=>{
			pic.classList.remove('multiselected');
		});
		document.body.removeEventListener('mousedown', toggleOffListen);
	}else if(e.srcElement.localName === 'img' || e.srcElement.className.indexOf('thumbWrap')>-1){
													// the img should be selected with multi select
		 console.log('CLICKED ON wrap: ', e.srcElement.className);
		if(e.srcElement.className.indexOf('multiselected') === -1  && e.srcElement.parentNode.className.indexOf('thumb')>-1) addToSelect(e.srcElement);
		else {
			if(e.srcElement.localName === 'img') removeFromSelect(e.srcElement);
			else removeFromSelect(e.srcElement.querySelector('img'));
		}
	}
}

addToSelect = function(e){
		console.log('Add image to multiselected array : ', e, '\n belons to \n', e.parentNode);
		e.classList.add('multiselected');
		var thumbnails = document.getElementById(e.id);
		var pare = e.parentNode;

		try{
			console.log('multiselected retreive parent: ', thumbnails.parentNode.parentNode);
			if(thumbnails.parentNode.parentNode.className.indexOf('thumbnail')>-1)thumbnails.parentNode.parentNode.classList.add('multiselected');
		}catch(err){
			console.log('error caught:', err);
			if(pare.className.indexOf('thumbnail')>-1) {
				pare.classList.add('multiselected');
				pare.querySelector('img').classList.add('multiselected');
			}
		}
}
removeFromSelect = function(sou){
	clickTime = false;
	console.log('Remove image from multiselected array : ', sou);
	sou.classList.remove('multiselected');
	var thumbnail = document.getElementById(sou.id);
	try{
		thumbnail.parentNode.classList.remove('multiselected');
		thumbnail.parentNode.parentNode.classList.remove('multiselected');
	}catch(e){
		console.log('thumbnail selected : REMOVED : ', thumbnail);
	}
}

detectLongClick = function(e){
	clickTime = true;
	setTimeout(function(){
		if(clickTime === true && e.srcElement.parentNode.className.indexOf('thumb')>-1 && e.srcElement.className.indexOf('delete')===-1){
			console.log('LONG PRESS DETECTED', clickTime);
			// toggleMultiSelect();

			multiSelect = true;
			showMultiOptions(true);
			addToSelect(e.srcElement);
				document.body.addEventListener('mousedown', toggleOffListen);

		}
		clickTime = false;
		console.log('Turn off timer: ', clickTime);
	}, 1000);
	console.log('Toggle MultiSELECT! ', e);
	console.log('ClickTime: ', clickTime);
}

loadMultiOptions = function(){
	var wrapperDiv = document.getElementById('dropgallery_wrapper');
	var multiselectButtons = document.createElement('div');
	multiselectButtons.id = 'multiSelect_options';
	multiselectButtons.innerHTML = '<button class="leftMost" id="zO" title="Gallery Zoom Level">'+
					 ' <img src=".././images/zoomOut.png"></img>'+
					'</button>';
	multiselectButtons.innerHTML += '<button class="rightMost" id="zI" title="Gallery Zoom Level">'+
					 ' <img src=".././images/zoomOut.png"></img>'+
					'</button>';
	multiselectButtons.classList.add('hidedisable');
	wrapperDiv.appendChild(multiselectButtons);
}

showMultiOptions = function(show){
	if(show === true){
		document.getElementById('movePhotos').classList.remove('hidedisable');
    document.getElementById('uploadPhoto').classList.add('unclickable');
		document.getElementById('dragdrop_label').className = 'filler';
		document.body.querySelector('#photo_section h2').textContent = 'Multi-Select Images'
	}else{
				document.getElementById('dragdrop_label').className = '';
		document.body.querySelector('#photo_section h2').textContent = 'Photo Section';
		document.getElementById('movePhotos').classList.add('hidedisable');
				document.getElementById('uploadPhoto').classList.remove('unclickable');
	}
}

addViewLinkListener = function(e){
  // console.log('\nImage Clicked : \n\n', e.currentTarget);
  // console.log('\n\n', e);
  // console.log('button? : ', e.srcElement.localName);
  // console.log('delete button? : ', e.srcElement);
  console.log('STANDARD CLICK FUNCTION : \nClick Time: ', clickTime, '\nMultiSelect: ', multiSelect);

  if(e.srcElement.localName === 'button' && e.srcElement.className.indexOf('delete')>-1){
    deleteImage({target: e.currentTarget, id:e.srcElement.id});
    return false;
  }
  if(multiSelect === true) return;
  clickTime = false;

  var newsource = e.currentTarget.querySelector('img').src;
  if(newsource === undefined) newsource = e.currentTarget.querySelector('.thumbWrap img').src;
  var gID = newsource;
	  console.log('GID string: ', newsource);

  // window.location.href = e.currentTarget.querySelector('img').src;
  if(newsource.length > 500){				// the image was just upload and the datastring is not the gDriveID
	  console.log('DATASTRING invlalid: ', e.currentTarget);
	  newsource = e.currentTarget.querySelector('.delete');
	  gID = newsource.id.replace(/"/g, '');
  }else{
	  try{
		  if(gID.indexOf('view&id=')>1) gID = gID.substring(gID.indexOf('view&id=')+ 'view&id='.length);
	  }catch(e){
		  console.log('Error gID Value: ', gID, '\n', e);
	  }
  }
  	try{
		  newsource = '.././viewImage.html?id=' + gID + '';
	  }catch(e){
		  console.log('VIEWPORT: ', newsource);
		  newsource = "https://drive.google.com/uc?export=view&id=" + gID;
	  }


  console.log('clickType = ', e.type);
  if(e.type === 'dblclick'){
	  return window.open(
		newsource,
		'_blank'
	  );
  }else{
	  // return viewImageDiv(gID);
	  console.log('gID : ', gID);
	  return viewerjsDIV(gID);
  }
}

viewerjsDIV = function(gID){
	var newsource = "https://drive.google.com/uc?export=view&id=" + gID;
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
	  var console = window.console || { log: function () {} };
		console.log('VIEWER: ', Viewer);
	  var options = {
		// inline: true,
		url: 'data-original',
		ready: function (e) {
		  console.log(e.type);
		},
		show: function (e) {
		  console.log(e.type);
		},
		shown: function (e) {
		  console.log(e.type);
		},
		hide: function (e) {
		  console.log(e.type);
		},
		hidden: function (e) {
		  console.log(e.type);
		},
		view: function (e) {
		  console.log(e.type);
		},
		viewed: function (e) {
		  console.log(e.type);
		}
	  };
	  var viewer;

	// Assemble surrounding array of images to pass into the viewer constructor
	var inHT = '<div><ul id="images">';
	var picEles = document.body.querySelectorAll('.thumbWrap img');
	index = 0;
	picEles.forEach((picEle, i)=>{
		if(picEle.src === newsource || "https://drive.google.com/uc?export=view&id="+picEle.parentNode.querySelector('.delete').id === newsource) index = i;
		var picSrc = picEle.src;
		if(picSrc.length>200){
			console.log('Image Source HUGE! Pick the Gid from the delete button');
			picSrc = picEle.parentNode.querySelector('.delete').id;
			picSrc = "https://drive.google.com/uc?export=view&id="+picSrc;
		}

		inHT = inHT + '<li><img src="' +picSrc + '" alt="Picture ' + (i+1) + '"';
		inHT += '></li>';
	});
	inHT = inHT + '</ul></div>';
	popIMGdiv.innerHTML += inHT;
	console.log(document.getElementById('images'));
	var viewerDiv = document.getElementById('images');
		viewer = new Viewer(viewerDiv, options);
		// viewer = new Viewer(pictures, options);
	viewerDiv.querySelectorAll('li img')[index].click();
	viewerDiv.click();
	console.log('viewerDiv : ', viewerDiv);
	viewerDiv.parentNode.removeChild(viewerDiv);
	console.log(viewer);
	// document.body.appendChild(viewer);

	return viewer;
}

viewImageDiv = function(gID){
	var newsource = '.././viewImage.html?id=' + gID + '';
		var popIMGdiv = document.createElement('div');
	popIMGdiv.innerHTML = '<iframe src=' + newsource.replace('../.', '') + '></iframe>';
	popIMGdiv.classList.add('imageView');
	var iframeLayover = document.createElement('div');

	iframeLayover.innerHTML = '<div class="frameShadow"><div>';
	iframeLayover.classList.add('imageView');
	document.body.appendChild(iframeLayover);

	var buttonDiv = document.createElement('div');
	buttonDiv.id = 'imageViewButtons';
	buttonDiv.classList.add('imageView');
		document.body.appendChild(buttonDiv);

	var iFrameExit = document.createElement('button');
	iFrameExit.innerHTML = 'X';
		iFrameExit.id = 'iFrameExit';
	iFrameExit.classList.add('imageView');
	iFrameExit.title = 'Close Viewing';
	buttonDiv.appendChild(iFrameExit);

	var openImage = document.createElement('button');
	openImage.innerHTML = 'O';
		openImage.id = 'openImage';
	openImage.classList.add('imageView');
	openImage.title = 'View Image in New Tab';
	buttonDiv.appendChild(openImage);

	iFrameExit.addEventListener('click', clearImageView);
	openImage.addEventListener('click', function(){
		return window.open(
			"https://drive.google.com/uc?export=view&id=" + gID,
			'_blank'
		);
	});
	return document.body.appendChild(popIMGdiv);
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
  console.log('Xoom Gallery : ', e.toUpperCase());
  var deviation = 20;
  if(e === 'out') deviation = -20;
  // var thumbLength = htmlStyles.getPropertyValue("--thumbnail_length");
  thumbLength = thumbnailSize;
  var galWidth;
  try{
    galWidth = document.getElementById('dropdown_gallery').offsetWidth;
  }catch(e){console.log('Error: no "dropdown_gallery" Element');}
  if(galWidth < 30) galWidth = 400;
  if(galWidth > widestThumb){
    galWidth = (galWidth*widestScale)*.85;
  }

  console.log('Gallery Width: ', galWidth, '\nWidestThumb: ', widestThumb, '\nWidest Scale Factor: ', widestScale);

  if(e === 'out' && thumbLength >= 20) document.getElementById('zoomIn').classList.remove('unclickable');

  console.log('old Nail Value : ', thumbLength);

  thumbLength = thumbLength + deviation;

  console.log('New Nail Value : ', thumbLength);
  console.log('Disable Zooms? \n',thumbLength + deviation ,' VS. ', (galWidth*widestScale)*.85);

  if((thumbLength + deviation)<=20){
	  var zoomBut = document.getElementById('zoomOut');
	  zoomBut.className.replace('unclickable', '');
	  zoomBut.classList.add('unclickable');
  }else if((thumbLength + deviation)>=(galWidth-30)){
    console.log('Disable Zoom IN!');
	  var zoomBut = document.getElementById('zoomIn');
	  zoomBut.className.replace('unclickable', '');
	  zoomBut.classList.add('unclickable');
  }

  isWithin = galWidth;
  if(thumbLength > galWidth && e === 'out') isWithin = 10000;
   if(thumbLength>=19 && thumbLength <=(isWithin)){
	  thumbnailSize = thumbLength;
	  thumbLength = ''+ thumbLength + 'px';
	  var htmlStyles = window.getComputedStyle(document.querySelector("html"));

	  document.body.style.setProperty('--thumbnail_length', thumbLength);
    console.log('\nthumbnailSize x widestScale\n',thumbLength, ' x ', widestScale,
      ' = ', (thumbnailSize * widestScale));
    widestThumb = thumbnailSize / widestScale;
  }
  console.log('GalWidth: ', galWidth, '\nThumnail Size: ', thumbnailSize, '\n', document.getElementById('zoomOut'));
  if(thumbnailSize > 20 && document.getElementById('zoomOut').className.indexOf('unclickable')>-1){
	  console.log('enable button');
	  document.getElementById('zoomOut').classList.remove('unclickable');
  }
  if(thumbnailSize <=(galWidth-30) && document.getElementById('zoomIn').className.indexOf('unclickable')>-1){
	  console.log('enable Zoom IN!');
	  document.getElementById('zoomIn').classList.remove('unclickable');
  }
  console.log(thumbLength);
}

adjustGallery = function(e){
  return;
  var galleryHeight = document.getElementById('dropdown_gallery');
  console.log('\n\n\nADJUSTING THE LENGTH OF THE GALLERY', galleryHeight);
  console.log(galleryHeight);
	if(galleryHeight.offsetHeight > 900) return;
  //Find the offset Y position of the top of the gallery.
  var topGallery = galleryHeight.getElementsByClassName('thumbnail');
  console.log(topGallery);

  //Find the offset Y position of the longest image in the last row
  //find the difference b/w the 2
  var images = document.body.querySelectorAll('.thumbWrap');
    var lastImage = images[images.length-1];
  var firstImage = images[0];
  if(!firstImage) {
  	firstImage = document.getElementById('dropdown_gallery');
  	lastImage = document.getElementById('galleryDrag');
  }
  firstImage= firstImage.offsetTop;
  lastImage = lastImage.offsetHeight + lastImage.offsetTop;
  console.log('Image Height difference : ', lastImage, firstImage, ' = ', lastImage - firstImage);
  console.log('images : ', images, '\nGallery: ', galleryHeight);
  if(images.length === 0) return galleryHeight.style.height = '0px';
  var containerHeight = -1*(document.getElementById('dropdown_gallery').offsetTop - (images[images.length-1].offsetTop + images[images.length-1].offsetHeight));

	// document.getElementById('dropdown_gallery').style.height = document.getElementById('dropgallery_wrapper').offsetHeight+ images[images.length-1].offsetHeight + 20 + 'px';
	console.log('Container Init Height: ', document.getElementById('dropdown_gallery').style.height, '\nContainer Height : ', containerHeight);
	console.log(document.getElementById('dropdown_gallery').offsetTop,' - (', images[images.length-1].offsetTop, ' + ',  images[images.length-1].offsetHeight);

	if(containerHeight > 900) return document.getElementById('dropdown_gallery').style.height = '901px';
	// if(containerHeight > document.getElementById('dropdown_gallery').offsetHeight){
		document.getElementById('dropdown_gallery').style.height = containerHeight + 'px';
		console.log('Image Height from cTop of Container is chosen: ', document.getElementById('dropdown_gallery').style.height);
	// }
		console.log('Image Height for Container Gallery is chosen: ', document.getElementById('dropdown_gallery').style.height);

}

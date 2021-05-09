var dragContainer;
var container;
var uppyContainer, uppyInner;
var uppyOn = false;
var uppyFilesQue = {};
var uppyFilesAdded = {};
var addIndex = 0;

var dropGalContainer = document.getElementById('dropdown_gallery');
var uppy;
var uppyIndex = 0;
var uppyLength = 0;
var folderParams = {};
var imageInserts = {};
var failedUploads =[];
var failedCount =0;
var tabQuery = tabQuery;
var tagSelection = null;
var filterCount = false;

  getUppyInput = function(){
    console.log('getUppyInput()...');
    console.log(document.getElementsByClassName('uppy-Dashboard-input')[0]);
    console.log(document.getElementsByClassName('uppy-Dashboard-inner')[0]);
    return document.getElementsByClassName('uppy-Dashboard-input')[0];
  }

  setFileQue = function(fileInput, fileAssorts, uppyInstance){
    console.log('------------------\tsetFileQue()');
    addIndex = 0;
    uppyFilesQue = {};
    folderParams = {};
    var gal=false;
    var folder = false;
    var woItem = currentWorkOrder.work_order;
    var coItem = currentWorkOrder.contractor;
    var folderItem = getFolderTag().toLowerCase();
    if(getGalleryTag()) gal = getGalleryTag().replace('_tab','');

    var subExists = false;
    subExists = getSubPeriod();
    if(subExists != false && getUserType != "Contractor") filterCount = true;
    tagSelection = getActiveTags();
    if(!propID) propID = fetchPropURL();
    console.log(propID,'\nwo:',currentWorkOrder, '\ncGal:',getGalleryTag(), '\nfolderItem() : ', folderItem);
    folderParams = {propertyID: propID, workOrder: woItem, contractor: coItem, gallery:gal.replace('_tab', ''), folderItem, userEmail: getUserEmail(), activetags:tagSelection};

    var uppyMeta = {
      folderParams: destinationFolderID,
      uppyID: uppy.getID(),
      contractor: folderParams.contractor,
      gal: gal,
      folder: folderItem,
      wo: woItem,
      batchLength: uppyLength,
      userEmail: getUserEmail(),
      activetags: tagSelection
    };
    uppy.setMeta(uppyMeta);

      Object.keys((fileAssorts)).forEach((key, ind)=>{
        // console.log('\nFILE KEY : ', key
          // ,'\nFile Field : ', fileAssorts[key]
        // );
        var entry = {
          source: fileInput,
          name: fileAssorts[key].name,
          folderParams: destinationFolderID,
          pathname: fileAssorts[key].path,
          type: fileAssorts[key].type,
          data: fileAssorts[key]
        }


        uppyFilesQue[fileAssorts[key].name] = entry;

        try {
          var fr = new FileReader();
          fr.onload = function(){
            var hours = new Date().getHours();
            var mins = new Date().getMinutes();
            var secs = new Date().getSeconds();
            var dt = 'AM';
            var tzone = new Date().toString();
            var tzoneTXT = ' ';

            var fil = tzone.substring(tzone.indexOf('('), tzone.lastIndexOf(')')+1);//.trim();
            var filarray = fil.split('');//.join(',');
            filarray.forEach((letter)=>{
              if(letter === letter.toUpperCase() && letter != ' ') tzoneTXT = tzoneTXT + letter;
            });
            var inds = fil.substring(0, 2);
            var inds2 = fil.substring(fil.indexOf(" "), 2);
            var inds3 = fil.substring(fil.indexOf(')')-1);

            if(hours > 12){
              hours = hours-12;
              dt = 'PM'
            }
            if(hours < 10)hours = '0' + hours;
            if(mins < 10) mins = '0' + mins;
            if(secs < 10) secs = '0' + secs;

            var tmpentry = Object.assign({}, entry);
            tmpentry.tags = tagSelection;
            tmpentry.description = gal;
            tmpentry.wo = woItem;
            activeThumbnails[entry.name] = tmpentry;

            var thNail = addThumbnail(fr.result, {name: entry.name, id:null, fileName:entry.name, timestamp: hours +
              ':' + mins + ':' + secs + ' ' + dt + ' ' + tzoneTXT + ''}, false);
              console.log('Missing Thumbnail for file: #', key, ' ', entry.name, '\ncreate Thumbnail!');

              if(ind === Object.keys(fileAssorts).length-1) initLazyLoading();
              if(uppyInstance){
                uppy.addFile(entry).catch(
                  function(er){console.log(fileInput + '.setFileQUE ERROR\n', er);}
                );
              }
          }
          fr.readAsDataURL(fileAssorts[key]);
        } catch (e) {
          console.log('Could not add UPPY UPLOAD Thumbnail', e);
        } finally {}
      });
  }

  buildUppy = function(){
    console.log('buildUppy()');
    var uppy_drag = document.getElementById('uppy_drag');
    var og = document.getElementById("dragDropContainer");
    var clone;
    if(og && uppy_drag){
      // console.log('UPPY INIT UPLOAD BUILD UPPY!');
      clone = og.cloneNode(true);
      og.parentNode.replaceChild(clone, og);
    }else{
      var uppyEles = document.createElement('div');
      uppyEles.innerHTML = ''+
          '<div class="uppy uppy-DD-container is-dragdrop-supported" id="dragDropContainer" style="width: 100%; height: 100%;" id="dragDropContainer">'+
          '<div class="uppy-DD-inner">'+
              '<svg aria-hidden="true" class="UppyIcon uppy-DD-arrow" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">'+
              '<path d="M11 10V0H5v10H2l6 6 6-6h-3zm0 0" fill-rule="evenodd"></path></svg>'+
              '<input class="uppy-DD-input" type="file" name="files[]" multiple="">'+
              '<label class="uppy-DragDrop-label">Drop files here or <span class="uppy-DD-dragText">browse</span></label'+
              '<span class="uppy-DragDrop-note"></span></div></div>';
      uppy_drag.appendChild(uppyEles);
    }
  }


  uppyInit = function(){
    console.log('\n   init UPPY CORE\n-----------------\nuppyInit()\n');
    buildUppy();
    uppy = Uppy.Core({
      id: Math.floor(Math.random() * 10000000000000001),
      autoProceed: false,
      debug:false,
      restrictions:{},
      meta:{},
      onBeforeFileAdded: (currentFile, files) => {
        console.log('uppy.BeforeFileAdded() -- START');
        try {
          var uppyInput = document.getElementsByClassName('uppy-FileInput-input')[0];
          if(uppyInput.files.length > 0) setFileQue('FileInput', uppyInput.files);
        } catch (e) {
          console.log('\nERROR Uppy Input files not detected from HTML input element\n', e);
        } finally {
          console.log('uppy.BeforeFileAdded() -- END');
        }
      },
      onBeforeUpload: (files) => {
        // console.log('uppy.onBeforeUpload()');
      }
    });

    uppy.use(Uppy.FileInput, {
      inline: true,
      target: '#page_wrapper',
    });
    uppy.use(Uppy.StatusBar, {
      target: '#uppy_drag',
      hideUploadButton: true
     })

    uppy.use(Uppy.XHRUpload, {
      endpoint: '/uploadimage/'+ fetchPropURL() + '',
      resumableUploads: true,
      limit: 10,
      formData: true
    });

    // console.log('enpoint POST : /uploadimage/'+ fetchPropURL() + '/' + fetchWorkOrder() + '/' + getGalleryTag().replace('_tab',''));
    uppy.on('file-added', function(f){
      console.log('uppy.file-added : ', uppyIndex);
      // console.log('Uppy File Added : ', f);
      uppyFilesAdded[f.id] = f;
      uppyIndex = uppyIndex+1;

      delete uppyFilesQue[f.name];
      if(Object.keys(uppyFilesQue).length === 0){
        console.log('ALL UPPY (FILES) FINISHED RENDERING! \n', Object.keys(uppy.getState().files).length, '\n\t',
                      // uppy.getState().files,
                      '\n\n-------------------\nBEGIN UPPY UPLOAD'
                    );
        adjustGallery();
        displayResize();

        uppy.upload().then((uploadResult)=>{
          if(uploadResult.failed.length > 0){
            console.log('Errored Failed UPPY Uploads');
          }
        });
      }
    });

    uppy.on('upload', function(f){
      console.log('\n----------------------UPPY.UPLOAD()');
      // console.log('Uppy Uploading File : ', f, '\nFileName : ', f.id);

      // This is where the progress would be updated, and the thumbnail would be shown
      delete uppyFilesAdded[f.fileIDs[0].id];
    });

    uppy.on('upload-success', function(f, resp, uploadURL){
      console.log('------------\nuppy.upload-success # ', currentCount);
      currentCount = currentCount +1;
      imageCount = imageCount +1;
      imageInserts[resp.googleID] = resp.insertStatement;
      setImageCountLabel({count: currentCount, outOf: fileLength, gallery: getGalleryTag().replace('_tab','').toLowerCase()});

      if(filterCount === true){
        var subcount = getSubPeriod() + '_count';
        var fiC = getFilteredCount().count;
        if(!fiC || fiC === NaN) fiC = 0;
        // console.log('\n\nSub Period Attached to Successful upload : ', filterCount,
        //   '\n\n COUNT = fiC: ', fiC);
        setFilteredCount({sub_folder: subcount, count: getFilteredCount().count + 1});
      }

      var uppyIm = Object.assign({}, activeThumbnails[f.name]);
      // var googleURL = "https://drive.google.com/uc?export=view&id=" + resp.googleID;
      var googleURL = getUserProxy() + resp.googleID;
      uppyIm.urlString = googleURL;
      activeThumbnails[parseForGoogleID(googleURL)] = uppyIm;
      delete activeThumbnails[f.name];

      try {
        if(currentCount + failedCount === fileLength && currentCount!=0){
          galleryLoading(false);

          if(getUserType() != "Contractor") {
            setImageCountLabel({count: imageCount, outOf: null, gallery: getGalleryTag().replace('_tab','').toLowerCase()});
            var subGal = getGalleryTag().replace('_tab', '');
            subGal = subGal.substring(0,1).toUpperCase() + subGal.substring(1).toLowerCase();
            console.log('setFiltered from upload : ', subGal, ' for ', imageCount);
            setFilteredCountLabel({gal: subGal, count: imageCount});
          }else {
             setImageCountLabel({count: document.querySelectorAll('.thumbnail:not(.hideThumbnail)').length, outOf: null, gallery: getGalleryTag().replace('_tab','').toLowerCase()});
          }
          if(filterCount === true) {
            // console.log('FILTER COUNT : Image Uppy : ', getFilteredCount());
            setFilteredCountLabel({count: document.querySelectorAll('.thumbnail:not(.hideThumbnail)').length, sub_folder:subcount});
          }
          fileLength = 0;
          currentCount = 0;
        }

        // var newID = "https://drive.google.com/uc?export=view&id="+ resp.googleID;
        var newID = getUserProxy() + resp.googleID;
        var t = document.getElementById(f.name + 'image');
        t.parentNode.querySelector('.delete').id = resp.googleID + '_delete';
        // t.id = newID + 'image'
      } catch (e) {
        console.log('\n\nERROR SETTING the thumbnailOPACITY from upload-success!\nMissing Thumbnail \n', e, '\ndocument.getElementById(' + f.name+'image) : ', document.getElementById(f.name+'image'));
      } finally {
      }

      // update the thumbnails id with the googleDriveID
      try {
        var selectedThumb = document.getElementById(f.name + 'image');
        if(selectedThumb === null){
          selectedThumb = document.getElementById(f.name);
          console.log('Missing Thumbnail : ', f.name, '\nsearchingg ', f.name + 'image\nRESULT : ', selectedThumb);
          console.log('Missing Thumbnail Uppy Upload success uppyImg : ', uppyIm, '\nget document by FileName : ', document.querySelectorAll('#' + f.name + 'image'));
        }
        // selectedThumb.id = resp.googleID;
        selectedThumb.id = googleURL;
        selectedThumb.src = googleURL;
        selectedThumb.setAttribute("data-src", googleURL);
        selectedThumb.parentNode.parentNode.id = googleURL + '_thumbnail';


        // console.log('Thumbnail Success upload ()', googleURL);
        console.log('Thumbnail Success upload ()');
        var selectedWrap = selectedThumb.parentNode;
        var selectedNail = selectedWrap.parentNode;
        // console.log('\n\nThumbnail Wrap : ', selectedWrap,'\nThumbnail : ', selectedNail);
        selectedNail.classList.remove('inc');
      } catch (e) {
        console.log('googleID was not attached to the thumbnail on successful upload!! ', selectedThumb, '\ne :: ', e);
      } finally {}
      // This is where the progress would be updated, and the thumbnail would be shown
    });


    uppy.on('upload-error', function(f, errorMessage){
      console.log('UPPY.upload-error FAILED # ', failedUploads.length, '\n', errorMessage);
      // console.log('UPPY UPLOAD FAILED err :\n', errorMessage);
      failedCount = failedCount +1;
      console.log('UPPY Upload Failed add object to objArray = ', f.id);
      failedUploads[f.id] = f;
      if(errorMessage === 'Error: Upload stalled for 30 seconds, aborting.'){
        console.log('\n\nUppy Upload Failed STALLED Error: ', uppy.getState());
      }
      try {
        document.getElementById(f.name).style.border = '2px solid red';
      } catch (e) {
        console.log('\n\nERROR SETTING the imageCount from upload-success!\n', e);
      } finally {

      }
    });

    uppy.on('complete', function(f){
        console.log('uppy.complete : ALL UPPY FILES FINISHED UPLOADING! ');
        // console.log('Uppy Image InsertStatements : ', imageInserts);
        $.ajax({
        	type:'POST',
        	dataType: "json",
        	contentType: "application/json",
          retryCount: 0,
          retryLimit: 0,
        	url: '/uploadimages/',
        	data:JSON.stringify({
        			insertArray:imageInserts
        	}),
        	success: function(successresult){
            console.log('\nimage-upload POST REQUEST SUCCESS! ');
            // console.log('\n\nPOST REQUEST SUCCESS imageInserts: ', this.data);
            imageInserts = {};
            if(getUserType() === 'Contractor' && getSentStatus() === false) {
              uploadAlert({
                numFiles: uppyLength,
                propID,
                address: getProperty().Property,
                rs: getProperty()['Repair Specialist'],
                folder: getFolderTag(),
                jobID: fetchWorkOrder(),
                gallery: getGalleryTag().replace('_tab', ''),
                subGallery: getSubPeriod(),
                user_email : getUserEmail()
              });
            }
            displayResize();
            uppy.reset();
        	},
        	error: function(errResult){
        		console.log('POST REQUEST FAILED\n\tError : \n', errResult,
                        '\n\nPOST imageInsertsRemaining: ', imageInserts);
                        imageInserts = {};
                        uppy.reset();
        	}
        });

        imageInserts = {};

        if(failedCount > 0){
          console.log('\nFAILED UPPY UPLOADS ( ' + failedCount + ')\n\n', failedUploads);
          uppy.setState({files: failedUploads});
          failedUploads = {};
          failedCount = 0;
          console.log('UPPY UPLOAD RETRY INITIATED!\nUPPY getState().files to retry: ', uppy.getState().files);
        }else{
          uppy.setState({files: {}});
          uppy.reset();
          failedUploads = {};
          failedCount = 0;
        }
        initLazyLoading();
        adjustGallery();
    });

    initUppyDrop();
    duplicateUppyInputs();

    uppy.run();
  }


duplicateUppyInputs = function(){
  console.log('duplicateUppyInputs()');
      /*
      Need to replace the Uppy Drop and File Listeners to insert the detinationFolderID check
      */
      var cont = document.getElementsByClassName('uppy-DD-container')[0];
      var textButton = document.getElementsByClassName('uppy-DD-dragText')[0];
      textButton.addEventListener('mouseover', function(e){
        cont.classList.add('dragging');
        cont.classList.add('hover_shadow');
        var sels =  document.body.querySelectorAll(tabQuery)[0];
        if(sels){
          console.log('Mouseover : ', sels);
          sels.style.boxShadow = '0px 10px 5px white';
          sels.style.backgroundColor = 'white';
        }
      });
      textButton.addEventListener('mouseout', function(e){
        cont.classList.remove('dragging');
        cont.classList.remove('hover_shadow');
        var sels =  document.body.querySelectorAll(tabQuery)[0];
        if(sels){
          sels.style.boxShadow = '0px 10px 5px var(--gallery_grey)';
          sels.style.backgroundColor = 'var(--gallery_grey)';
        }
      });

      cont.addEventListener('click', function(e){
        e.stopPropagation();
        if(loadingGal) return alert('Please wait for current upload to complete, or refresh the page');

          if(e.currentTarget.textContent != "browse") $('#uppy_upload').click();
      });

      cont.addEventListener('mouseover', function(e){
        cont.classList.add('dragging');
        cont.classList.add('hover_shadow');
        var sels =  document.body.querySelectorAll(tabQuery)[0];
        if(sels){
          sels.style.boxShadow = '0px 10px 5px white';
          sels.style.backgroundColor = 'white';
        }
      });

      cont.addEventListener('mouseout', function(e){
        cont.classList.remove('dragging');
        cont.classList.remove('hover_shadow');
        var sels =  document.body.querySelectorAll(tabQuery)[0];
        if(sels){
          sels.style.boxShadow = '0px 10px 5px var(--gallery_grey)';
          sels.style.backgroundColor = 'var(--gallery_grey)';
        }
      });

      var uppyUp = document.getElementById('uppy_upload');
      while(!uppyUp){};
      uppyUp.addEventListener('click', function(e){
        if(loadingGal) return alert('Please wait for current upload to complete, or refresh the page');
        else{
          $('#'+uppyUp.id).unbind('change');
          $('#'+uppyUp.id).on('change',function(e){
            cont.classList.remove('dragging');
            verifyDestination('FileInput', e.target.files, uppy);
          });
        }
      });

      var uppyUp2 = textButton;
      uppyUp2.addEventListener('click', function(e){
        e.preventDefault();
      });
}

verifyDestination = function(inputType, files, upp){
  console.log('verifyDestination() .......');
  if(loadingGal){
    return alert('Please wait for current upload to complete, or refresh the page');
  }
  if(getMultiSelect() === true) {
    setMultiSelect(false); //multiSelect = false;
    showMultiOptions(false);
    setStart(-1);
  }

  uppyIndex = 0;
  uppyLength = files.length;
  fileLength = uppyLength;

  if(fileLength >0) galleryLoading(true);
  else return;

  var promptTxt = 'Upload ' + fileLength + ' files?';
  // console.log('\nthisUserType : ', getUserType(), '\nthisCurrentGallery : ', getGalleryTag());
  if(getUserType() === 'Contractor' && getGalleryTag() === 'broker_tab'){
    console.log('\nBroker Folder is not available for upload at this time');
    alert('Broker Folder is not available for upload at this time');
    return galleryLoading(false);
  }
  if(!confirm(promptTxt) || fileLength === 0) return galleryLoading(false);

  blinkDropBox(dragDropContainer, 'white', 2);

  if(destinationFolderID === false || destinationFolderID === undefined){
    checkDestination((folderID)=>{
      destinationFolderID = folderID;
      setFileQue(inputType, files, upp);
    });
  }else setFileQue(inputType, files, upp);
}





initUppyDrop = function(){
  console.log('initUppyDrop()');

  var dragDropContainer = document.getElementsByClassName('uppy-DD-container')[0];
  var og = document.getElementsByClassName('uppy-DD-container')[0];
  var clone = og.cloneNode(true);
  clone.id = 'dragDropContainer';
  og.parentNode.replaceChild(clone, og);
  dragDropContainer = clone;

  dragDropContainer.addEventListener('dragenter', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log('DRAGING ENTER UPPY Element : Drop Files');
    dragDropContainer.classList.add('dragging');
    var sels =   document.body.querySelectorAll(tabQuery)[0];
    console.log('Mouseover : ', sels);
    if(sels){
      sels.style.boxShadow = '0px 10px 5px white';
      sels.style.backgroundColor = 'white';
    }
    document.getElementById('dropdown_gallery').classList.add('dragovered');
  });
  dragDropContainer.addEventListener('dragover', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log('DRAGING over UPPY Element : Drop Files');
    dragDropContainer.classList.add('dragging');
    document.getElementById('dropdown_gallery').classList.add('dragovered');
  });

  dragDropContainer.addEventListener('dragleave', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log('DRAG LEAVE UPPY Element!');
    var sels =   document.body.querySelectorAll(tabQuery)[0];
    console.log('Mouseover : ', sels);
    if(sels){
      sels.style.boxShadow = '0px 10px 5px var(--gallery_grey)';
      sels.style.backgroundColor = 'var(--gallery_grey)';
    }

    dragDropContainer.classList.remove('dragging');
    document.getElementById('dropdown_gallery').classList.remove('dragovered');
  });
  dragDropContainer.addEventListener('drop', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log('DRAG DROPPED FILES UPPY Element!');
    // dragDropContainer.classList.remove('dragging');
    console.log('e.datatransfer : ', e.dataTransfer);
    document.getElementById('dropdown_gallery').classList.remove('dragovered');

    verifyDestination('DragDrop', e.dataTransfer.files, uppy);
    // return;
  });

  var dropdown_gallery = document.getElementById('dropdown_gallery');
  dropdown_gallery.removeEventListener('dragenter', dropdown_enter);
  dropdown_gallery.addEventListener('dragenter', dropdown_enter);
  dropdown_gallery.removeEventListener('dragover', dropdown_over);
  dropdown_gallery.addEventListener('dragover', dropdown_over);
  dropdown_gallery.removeEventListener('dragleave', dropdown_leave);
  dropdown_gallery.addEventListener('dragleave', dropdown_leave);
  dropdown_gallery.removeEventListener('drop', dropdown_dropper);
  dropdown_gallery.addEventListener('drop', dropdown_dropper);
};

dropdown_enter = function(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('DRAGING ENTER UPPY Element : Drop Files');
  dragDropContainer.classList.add('dragging');
  var sels =  document.body.querySelectorAll(tabQuery)[0];
  if(sels){
    console.log('Mouseover : ', sels);
    sels.style.boxShadow = '0px 10px 5px white';
    sels.style.backgroundColor = 'white';
  }
  document.getElementById('dropdown_gallery').classList.add('dragovered');
}

dropdown_dropper = function(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('DRAG Drop Files into gallery!');
  console.log('e.datatransfer : ', e.dataTransfer);
  document.getElementById('dropdown_gallery').classList.remove('dragovered');

  verifyDestination('DragDrop', e.dataTransfer.files, uppy);
}
dropdown_over =function(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('DRAGING over UPPY Element : Drop Files');
  dragDropContainer.classList.add('dragging');
  document.getElementById('dropdown_gallery').classList.add('dragovered');
}
dropdown_leave =function(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('DRAG LEAVE UPPY Element!');
  var sels =  document.body.querySelectorAll(tabQuery)[0];
  if(sels){
    console.log('Mouseover : ', sels);
    sels.style.boxShadow = '0px 10px 5px var(--gallery_grey)';
    sels.style.backgroundColor = 'var(--gallery_grey)';
  }
  dragDropContainer.classList.remove('dragging');
  document.getElementById('dropdown_gallery').classList.remove('dragovered');
}

blinkDropBox = function(container, colour, numTimes){
  var opac = 1;
  var goingRate = 0.05;
  if(!numTimes) numTimes = 4;
  var times = 0;
  var fin = false;
  container.style.backgroundColor = colour+'!important';
  var blinkInterval = setInterval(function(){
    container.style.opacity = opac;
    if(fin === true){
      if(opac+goingRate < 0.4){
        container.style.opacity = 1;
        container.classList.remove('dragging');
        return clearInterval(blinkInterval);
      }
    }
    if(opac+goingRate > 1 || opac+goingRate < 0.2) {
      console.log('Change Opacity : ', opac);
      goingRate = (goingRate*-1)
      times ++;
      if(numTimes*2 === times-1){
        console.log('escapeInterval');
        fin = true;
      }
    }
    opac = opac+goingRate;
  }, 30);
}

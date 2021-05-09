var selectedImages = [];
var download_button_element = null;
var rotate_button_element = null;
var move_button_element = null;
var current_degree = 0;

// GETTERS/SETTERS
getCurrentDegree = function(){
  return this.current_degree;
}
setCurrentDegree = function(num){
  this.current_degree = num;
  document.getElementById('test-rotate').style.transform = "rotate(" + num + "deg)";
  document.getElementById('degree-label').textContent = num + "°";
};

/*
  Retreives/returns list of all selected thumbnail.IMGs in the gallery
*/
getSelectedThumbnails = function(){
  // returns list of IMG elements
  return document.getElementById('dropdown_gallery').querySelectorAll('.thumbWrap .multiselected') || [];
}

/*
  triggers the manual event to refresh all lazy loading components
*/
var triggerLazy = function(){
  $(function() {
    $("img.lazy").Lazy({
        event : "load"
    });
  });
  $("img.lazy").trigger("load");
}



/*
  EVENT LISTENER (btn-click)
  BATCH ROTATE FUNCTION
*/
initRotateListener = function(){
  var rotate_btn= document.getElementById('editPhotos');
  if(!rotate_btn) return false;
  rotate_button_element = rotate_btn;
  rotate_btn.addEventListener('click', promptRotate);
}

promptRotate = function(e){
  e.preventDefault();
  console.log('\n\n\n\n\n\n\n\n\n\nPrompt User ROTATE Specs + Dialogue');

  var nail_list = getSelectedThumbnails();
  var length = nail_list.length;
  var gal = getGalleryTag();
  console.log('ROTATE BATCH from gallery tag : ', gal);
  if(gal === 'during' || gal === 'after') gal = getActiveTags();

  var promptStatement = '';
  promptStatement = 'Rotate ' + length + ' Files to the Browser?';

  // UPDATE --> prevent request for list of 0 items
  if(length === 0) return alert('0 Images selected\nPlease Select an Image or Gallery to Rotate');

  var buildResult = buildRotatePrompt(length);
  console.log('\n\n--------build Rotate Prompt RETURNED\n\tbuildResult = ', buildResult);

  buildResult.submit.addEventListener('click', function(e){
    console.log('\n\n*********batchrotation submission !');
    // VALIDATE form data (if necessary)
    promptStatement = 'Rotate ' + length + ' ' +
                      gal.toUpperCase().substring(0,1) +
                      gal.toLowerCase().substring(1) +
                      ' images ' +
                      getCurrentDegree() + ' degrees?';
    console.log(promptStatement);

    if(getCurrentDegree()%90 > 0 || getCurrentDegree() < 0) {
      alert('Image Rotation is limited to 90 degree adjustments.\nCannot rotate image by ' + getCurrentDegree() + ' degrees!');
      return setCurrentDegree(0);
    }

    if(confirm(promptStatement)){
      console.log('\n\n\nUser confirms Rotate Request!\n ---------------------');
      escapePopout();
      nail_list.forEach(function(nail, indio){
        createStatus(nail, 'pending', 'batchrotate');
      });
      var rotationTimer = setRotationTimer();
      rotateThumbnails(nail_list, getCurrentDegree(), rotationTimer);

      return false;
    }
  });
}

/*
  buildRotatePrompt()
  builds the modal + popout form for BATCH ROTATION
*/
buildRotatePrompt = function(length){
  // var modal = document.createElement('div');
  // modal.className = 'modal';
  // var prompt = document.createElement('div');
  // prompt.innerHTML += '<div class="prompt-header"><label>' + length + ' Images Selected</label>'
  //                     + '</div>';

  var modalprompt = buildPrompt(length, 'rotate');
  var modal = modalprompt.modal;
  var prompt = modalprompt.prompt;
  prompt.className = 'popout rotate-popout';
  var imgWrapper = document.createElement('div');
  imgWrapper.className = 'image-container-wrapper';

  var sample_image = document.createElement('div');
  sample_image.className = 'image-container';
  sample_image.innerHTML = '<img id="test-rotate" class="centered_img" src="'+ '.././branding/brand.png' + '"></img>';

  var controls = document.createElement('div');
  controls.className = 'image-controls';
  controls.innerHTML = '<div id="left-rotate" class="ctrl"><img src = "' + '.././images/arrow-left-circle.jpg'+ '"/></div>'
  controls.innerHTML += '<div id="degrees"><label id="degree-label"></label></div>';
  controls.innerHTML += '<div id="right-rotate" class="ctrl"><img src = "' + '.././images/arrow-right-circle.jpg'+ '"/></div>'

  var submit = document.createElement('div');
  submit.className = 'rotate-submit-container';
  submit.innerHTML = '<input class="rotate-submit" type="submit" value="ROTATE"></input>';

  imgWrapper.appendChild(sample_image)
  prompt.appendChild(imgWrapper);
  prompt.appendChild(controls);
  prompt.appendChild(submit);
  // prompt.appendChild(sample_image);
  modal.appendChild(prompt);

  document.body.appendChild(modal);

  attachRotaters();
  setCurrentDegree(0);

  initializeEscape();    // When Submitted or clicked away, destroy the popout modal

  return {
    popout: prompt,
    submit: submit.children[0]
  };
}

/*
  Attach the listening handlers to the rotating ctrls
*/
attachRotaters = function(){
  var left = document.getElementById('left-rotate');
  var right = document.getElementById('right-rotate');

  left.addEventListener('click', function(e){
    rotateSample(left)
  });
  right.addEventListener('click', function(e){
    rotateSample(right)
  });
}


rotateSample = function(target){
  console.log('\n\nTEST PROMPT CLICKED! ', target);
  var upd = 1;
  if(target.id === 'left-rotate') upd = -1;
  var num = getCurrentDegree();
  /* ORIGINAL
    if(num === 0 && upd<0) num = (360 + (upd * 90));
    else if(num === 0 && upd>0) num = (0 + (upd * 90));
    else if(num >= 90) num = (num + (upd * 90));
  */

  //UPDATED
  var base = num;
  if(num === 0 && upd<0) base = 360;
  else if(num === 0 && upd>0) base = 0;

  num = (base + (upd * 90));
  if(num === 360) num = 0;
  setCurrentDegree(num);      // SETS THE ACTUAL HTML LABEL TEXT
}


/*
  POPOUT FUNCTION
  clicking away from the popout or submitting the form will destroy the existing popout
*/
initializeEscape = function(){
  console.log('\n\n-----------initializeEscape (POPOUT)\n');
  var escbtn = document.getElementsByClassName('esc-btn')[0];
  if(escbtn) escbtn.addEventListener('click', function(){
    escapePopout();
  });

    document.getElementsByClassName('modal')[0].addEventListener('click', function(e){
      console.log('MODAL CLICK ACTION : ', e.target);
      if(e.target.className.indexOf('modal')>-1) {
        // e.target.parentNode.removeChild(e.target);
        escapePopout();
      }
    })
}

/*
  escapePopout()
  actual method to destroy modal and popout elements
*/
escapePopout = function(modal){
  $('#property_drop').select2("destroy");
  if(!modal) modal = document.getElementsByClassName('modal')[0];
  if(modal) modal.parentNode.removeChild(modal);
  document.body.classList.remove('noscroll');
}


/*
  batchRotate()
  send request to server with payload of image urls
*/
rotateThumbnails = function(imageEles, degree, rotationTimer){
  console.log('\n\nrotateThumbnails()\ninit IMAGE DOWNLOAD!', imageEles.length);
  var length = imageEles.length;
  // collectURLS();
  var listURLs = collectURLS(imageEles);
  console.log('\n\nSEND ROTATE POST REQUEST');

  var batch_identification = 'batchid-rotate-' + Math.random().toString().substring(2,10);

  requireNavConfirmation(true);
  // animateDownload(true);
  var rotateNotification = {
    type: 'rotate',
    gal: getGalleryTag(),
    items: length,
    rotation: degree
    ,
    batch_identification
  }

  // only initialize a notification element if the batch requires a ZIP process
  addNotif(rotateNotification, function(notifObject){
    var socket_identification = 'socketid-' + notifObject.socketid;
    notifObject.socket_identification = socket_identification;

    console.log('\n\nBatch ID (SOCKET.ID) : ', batch_identification);
    var retryNum = 0;
    // clear selected thumbnails
    selectAll(false);

    var xhr = $.ajax({
      type: 'POST',
      url: '/rotate/batch/',
      dataType: 'json',
      // timeout : 15000,
      timeout: 0,
      retryLimit : 1,
      // connection: 'keep-alive=true',
      cache: false,
      data: {
        rotation_degree: degree,
        socket_identification,
        batch_identification,
        image_list: listURLs
      }, success: function(returnedResult){
        console.log('\n\nPOST REQUEST BATCH ROTATION \nSuccess Result : ', returnedResult);
        requireNavConfirmation(false);
        clearInterval(rotationTimer);
        removeNotif(notifObject);

        xhr.abort();
        return false;
      },
      error: function(err, textStatus, errThrown){
        console.log('\n\nPOST FAILED ROTATION ERROR : ', err,
          '\nTextStatus = ', textStatus, '\nError Throuwn : ', errThrown, '\nstatusCode = ', '', '\nprogress = ', '', '\nerror number : ',retryNum);
          // test a GET request to the potential ZIP file location from the batchdownload-
          // on error --> stop timer
          var currentCall = this;

          // clearTimer(notifObject);
          // requireNavConfirmation(false);
          // xhr.abort();

          if(retryNum < 50 && textStatus === 'timeout'){
            console.log('POST REQUEST TIMEOUT : retry call');
            $.ajax(currentCall);
            retryNum ++;
          }else if(retryNum < 50 && errThrown === "Service Unavailable"){
            setTimeout(function(){
              console.log('service cut, wait 5 seconds');
              $.ajax(currentCall);
            }, 4000);
          }else{
            console.log('ERROR out of retries');
            clearTimer(notifObject);
            clearInterval(rotationTimer);
            requireNavConfirmation(false);
            xhr.abort();
          }
        return true;
      }
    });
    console.log('\nROTATION!\nPOST REQUEST Request Sent!');
  });
}


/*
  adds listener to the downloadPhoto button
  should be called AFTER user is verified, not on page load
*/
initDownloadListener = function(){
  var dl_btn = document.getElementById('downloadPhotos');
  if(!dl_btn) return false;

  download_button_element = dl_btn;
  dl_btn.addEventListener('click', promptDownload);
}


/*
  toggle the animation @ availability of the download_btn
*/
animateDownload = function(yesno){
  console.log('spin download button : ', yesno);
  download_button_element.borderWidth = '2px';
  // download_button_element.children[0].style.width = 'calc(100% - 4px)';
  download_button_element.classList.add('pending');
  download_button_element.Title = "download in progress...";

  if(yesno === true) dl_animation = pendingDownload(download_button_element);
  else {
    download_button_element.Title = "Download Photos";
    download_button_element.classList.remove('pending');
    clearInterval(dl_animation);
  }
}

pendingDownload = function(button){
  var side = 1;
  var size = 0;
  var operator = -1;
  return setInterval(function(){
    if(side > 8 || side < 2) operator = (-1 * operator);
    button.style.borderColor = 'Transparent';
    size = operator + side;
    console.log('\nnewsize = ', size);
    var newWidth = 'calc(100% - ' + size + 'px)';
    button.children[0].style.width = newWidth;
    // button.children[0].style.height = newWidth;
    side = side + operator;
  }, 75);
}

/*
  determine if the current gallery contains sub-galleries
  MAIN PURPOSE = trigger selectAll on desired thumbnails
*/
// promptDownloadType = function(){
//   if(getGalleryTag() === 'during' || getGalleryTag()=== 'after'){
//     var promptxt = 'Download Current Folder(' + getActiveTags().replace(/:::,/, '') + ')?\n' +
//                     'Download ' + getGalleryTag().toUpperCase() + ' Gallery?';
//     var promptresult = prompt(promptxt, )
//     selectAll('gallery');
//   }else{
//     selectAll(true);
//   }
//   selectAll('gallery');
//   nail_list = getSelectedThumbnails();
//   length = nail_list.length;
//   promptStatement = 'Download ' + gal.toUpperCase() + ' Gallery?\n(' + length + ') images';
// }
/*
  #downloadPhotos BTN event 'click'
  Confirmation with user
*/
promptDownload = function(e){
  e.preventDefault();
  console.log('\n\n\n\n\n\n\n\n\n\nPrompt User Download Specs + Dialogue');
  if(getUserType()==="Contractor") return alert('Contractors cannot download images, please contact a Repair Specialist');

  var nail_list = getSelectedThumbnails();
  var length = nail_list.length;
  var gal = getGalleryTag();
  console.log('download from gallery tag : ', gal);
  var promptStatement = '';
  if(length === 0){
    // promptDownloadType();   // selectAll('gallery');
    selectAll(true);
    nail_list = getSelectedThumbnails();
    length = nail_list.length;
    if(gal === 'during' || gal === 'after') gal = getActiveTags();
    console.log('\n\nDownload Prompt for Gallery! : ', gal);
    promptStatement = 'Download ' + gal.toUpperCase() + ' Gallery?\n(' + length + ') images';
  }
  else promptStatement = 'Download ' + length + ' Files to the Browser?';

  // UPDATE --> prevent request for list of 0 items
  if(length === 0) return alert('0 Images selected\nPlease Select an Image or Gallery to Download');

  if(confirm(promptStatement)){
    console.log('\n\n\nUser confirms Download Request!\n ---------------------');
    downloadThumbnails(nail_list);
    return false;
  }else{
    selectAll(false);
  }
}


/*
  strip URL from image Elements
  might be img.src, might be img.data-src
*/
collectURLS = function(imageEles){
  var listURLs = '';
  var length = imageEles.length;

  imageEles.forEach((img, index)=>{
    var iSRC = img.src;
    if(iSRC){
      if(iSRC.substring(0, 'data:image'.length) === 'data:image') iSRC = img.getAttribute("data-src");
      console.log('IMAGE URL:\n', iSRC);
      listURLs = listURLs + iSRC;
      if(index != length-1) listURLs = listURLs + ':::,';
    }
  });
  return listURLs;
}


/*
  SINGLE IMAGE DOWNLOAD
*/
requestDownload = function(imageURL){
  console.log('\nSingle Image Download : ', imageURL);
  // request(imageURL);
  requireNavConfirmation(false);
  window.location.href = imageURL.replace('?export=view', '?export=download');
}

createBatchID = function(){
  return 'batchid-' + Math.random().toString().substring(2,10);
}

/*
  Accepts list of IMG elements
  Sends list of urls to server for batch download (requests to google drive)
*/
downloadThumbnails = function(imageEles){
  console.log('\n\n\ninit IMAGE DOWNLOAD!', imageEles.length);
  var length = imageEles.length;
  // collectURLS();
  var listURLs = collectURLS(imageEles);
  console.log('\n\nSEND DOWNLOAD POST REQUEST');

  var batch_identification = createBatchID();

  requireNavConfirmation(true);
  // animateDownload(true);
  var downloadNotification = {
    type: 'download',
    gal: getGalleryTag(),
    items: length
    ,
    batch_identification
  }

  // UPDATE --> if single image, single image download
  if(length === 1 && getUserProxy().indexOf('google.com')>-1) return requestDownload(listURLs.split(':::,')[0]);
  // only initialize a notification element if the batch requires a ZIP process
  addNotif(downloadNotification, function(notifObject){
    var socket_identification = 'socketid-' + notifObject.socketid;
    notifObject.socket_identification = socket_identification;

    console.log('\n\nBatch ID (SOCKET.ID) : ', batch_identification);
    var retryNum = 0;
    // clear selected thumbnails
    selectAll(false);

    var xhr = $.ajax({
      type: 'POST',
      url: '/download/batch',
      dataType: 'json',
      // timeout : 15000,
      timeout: 0,
      retryLimit : 1,
      // connection: 'keep-alive=true',
      cache: false,
      data: {
        socket_identification,
        batch_identification,
        image_list: listURLs
      }, success: function(returnedResult){
        var downloadLink = returnedResult.folderDirectory.substring(returnedResult.folderDirectory.indexOf('public\\downloads\\batchdownload') + 'public\\'.length)
        console.log('\n\nPOST REQUEST BATCH DOWNLOAD \nSuccess Result : ', downloadLink);
        var dlFolder = downloadLink.substring(downloadLink.indexOf('downloads') + 'downloads'.length);
        console.log('\n\n---------------TEST for downloads folder : ', dlFolder);
        requireNavConfirmation(false);
        removeNotif(notifObject);

        window.location.href = '../listdownloads' + dlFolder;

        xhr.abort();
        return false;
      },
      error: function(err, textStatus, errThrown){
        console.log('\n\nPOST FAILED DOWNLOAD ERROR : ', err,
          '\nTextStatus = ', textStatus, '\nError Throuwn : ', errThrown, '\nstatusCode = ', '', '\nprogress = ', '', '\nerror number : ',retryNum);
          // test a GET request to the potential ZIP file location from the batchdownload-
          // on error --> stop timer
          var currentCall = this;
          if(retryNum < 50 && textStatus === 'timeout'){
            $.ajax(currentCall);
            retryNum ++;
          }else if(retryNum < 50 && errThrown === "Service Unavailable"){
            setTimeout(function(){
              console.log('service cut, wait 5 seconds');
              $.ajax(currentCall);
            }, 5000);
          }else{
            clearTimer(notifObject);
            requireNavConfirmation(false);
            xhr.abort();
          }
        return true;
      }
    });
    console.log('\n\nPOST REQUEST Request Sent!');
  });
  return false;
}

/*
  determines whether to add or remove the confirmDeparture event listener from the window
    - the listener should be added during downloads and uploads
*/
requireNavConfirmation = function(yesno){
  console.log('\nRequire confirmation to leave the page? ', yesno);
  if(yesno) return window.addEventListener("beforeunload", confirmDeparture);
  return window.removeEventListener("beforeunload", confirmDeparture);
}

/*
  window event handler(e)
    -- actually calls the confirm box to prompt the user
    -- navigates away from the page if prompt = yes
*/
confirmDeparture = function(e){
  console.log('Prompting the user to confirm departure from the page! : ', window.event, '', e);
  var message = "Exiting the page will cancel the download in progress";

  (e || window.event).returnValue = message;
  return true;
}

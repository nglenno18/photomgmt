var notificationPane = null;
var noteNumber = 1;
var notes = {};

/*
  add a notification to the fixed notification box
    - attaches a notification html element to the original object
    - pushes updated object to the array
*/
addNotif = function(notObj, callback){
  console.log('\nAdding notification...', notObj);
  console.log('\nNOTIFICATION PANE');

  var notation = checkNotifs().children[0];
  var newNote = document.createElement('div');
  var le = notes.length;

  // newNote.id = 'notif_' + notObj.type + '_' + noteNumber;
  newNote.className = 'notif_alert';

  newNote.id = notObj.batch_identification;
  notObj.html = newNote;
  notObj.count = noteNumber;
  notation.appendChild(newNote);

  console.log('\npush notifElement : ', notObj);

  notObj.timer = timerFunction(notObj.html.id);

  // socketio connection to server
  addNotificationSocket(notObj.type, function(socketid){
    notObj.socketid = socketid;
    pushNote(notObj);
    populateNote(notObj);
    return callback(notObj);
  });
  // console.log('attached a notification socket to the element : ', notObj.socketid);
  //
  // throw Error;
  // console.log('\npopulating notifElement : ', notObj);
  // return notObj;
}

/*
  updateProgress()
  @param {notationObject} : standard htmlobject element for this notification file
  @param {progressObj} : object containing progress data to update element with
*/
updateProgress = function(noteObj, progressObj){
  console.log('update progress bar...', noteObj.html);
  var note = noteObj.html;
  var percentage = (((Number(progressObj.downloaded)) / (Number(progressObj.outOf))) * 100).toFixed(2);
  // upper-right-hand corner should detail the downloaded / outOf
  note.querySelector('.dl_count').textContent = progressObj.downloaded;
  note.querySelector('.dl_sep').textContent = ' / ';
  note.querySelector('.dl_total').textContent = progressObj.outOf;
  // lower-left should detail the percentage complete
  note.querySelector('.progress_text').textContent = percentage + '%';
  //progressbar should be colored accordingly
  note.querySelector('.progress_color').style.width = percentage + '%';

  if(Number(percentage) === 100) indicateZipping(note);
}

indicateZipping = function(element){
  console.log('\n\nFinished Downloading : ', element, ' indicate zipping files');
  element.querySelector('.status').textContent = "Compressing ";
  element.querySelector('.dl_count').textContent = '';
  element.querySelector('.dl_sep').textContent = '';
  element.querySelector('.dl_total').textContent += ' files';
  element.querySelector('.progress_text').textContent = "100% of images saved ";
  element.querySelector('.item_count').innerHTML = element.querySelector('.item_count').innerHTML.replace('(', '').replace(')','');
  element.classList.add('zipping');
}

getCurrentNotes = function(){
  return this.notes;
}

/*
  Add  socket.io instance Connection
  Add  socket listeners, handlers to accept download-progress updateProgress
  Add  disconnect and close listeners to auto destroy the instance when the notification element is destroyed
*/
addNotificationSocket = function(type, callback){
  var socket = io();
  // var notes = this.notes;
  if(!type) type = 'download';
  var socketlistener = type + '-progress';
  socket.on('connect', function(){
    console.log('n\n\nsocket connected');

    socket.on(socketlistener, function(progressObj){
      var notes = getCurrentNotes();
      console.log('\n\n'+type+' Update : ', progressObj, '\nnoteslength: ', Object.keys(notes).length);
      if(notes.length === 0) return;
      else if(notes[progressObj.batch_identification]){
        updateProgress(notes[progressObj.batch_identification], progressObj);
      }
      var stat = progressObj.status;
      if(!stat) stat = 'success';
      if(type === 'rotate') refreshThumbnail(progressObj.upImg.id, stat, type, progressObj.err);
      if(type === 'move') refreshThumbnail(progressObj.upImg, stat, type, progressObj.err);
      // notes.forEach((note)=>{
      //   console.log('note check for ', progressObj.batch_identification, ' VS : ', note.batch_identification);
      //   if(note.batch_identification === progressObj.batch_identification){
      //     // console.log('note match : ', note.html);
      //     updateProgress(note, progressObj);
      //   }
      // });
    });

    return callback(socket.id);
  });
  // socket.on('disconnect', function(){
  //   console.log('\n\nSocket disconnected for notification : ', notObj);
  //   socket.close();
  // });
  console.log('\nadded socket. Established : ', socket.connected);
  return socket;
}


refreshThumbnail = function(googleID, status, action, error){
  console.log('ROTATION PROGRESS : ', googleID);
  console.log('\n\n\nImage to Re-Request\nGoogleID : ', googleID);
  // var currentSRC = "https://drive.google.com/uc?export=view&id=" + googleID;
  var currentSRC = getUserProxy() + googleID;
  var newURL =  currentSRC + "&time=" + Math.random();

  var thumbImage = document.getElementById(currentSRC + 'image');
  console.log('\n RECENT UPLOAD DETECTED : ', thumbImage);

  if(!thumbImage){
    // thumbImage = document.getElementById("https://drive.google.com/uc?export=view&id=" + googleID);
    thumbImage = document.getElementById(getUserProxy() + googleID);
    console.log('\n RECENT UPLOAD DETECTED_1 : ', thumbImage);
    if(!thumbImage) thumbImage = document.getElementById(googleID);
    if(thumbImage){
      if(thumbImage.className.indexOf('thumbnail')>-1) thumbImage = thumbImage.querySelector('img')
      else if(thumbImage.className.indexOf('delete')>-1) {
        console.log('delete button detected : ', thumbImage);
        thumbImage = thumbImage.parentNode.parentNode.parentNode.querySelector('img:not(.thumbstatus');
      }
    }

    console.log('\n RECENT UPLOAD DETECTED : ', thumbImage);
    thumbImage.src = newURL;
  }else{
    console.log('\n Recent Upload Detected : ', thumbImage);
    thumbImage.src = '';
    thumbImage.src = newURL;
  }

  if(!status){
    status = 'pending';
  }
  var ac = action;
  if(action != 'move') ac = 'batchrotate';
  setThumbnailStatus(thumbImage, status, ac, error);
  if(error) console.log('\nrefreshThumbnail() -- ERROR : ', error);
  thumbImage.setAttribute("data-src", newURL);
  return newURL;
}

/* pushNotification to local array, increment noteNumber */
pushNote = function(notObj){
  console.log('\n pushing... ', notObj);
  // this.notes.push(notObj);
  this.notes[notObj.batch_identification] = notObj;
  this.noteNumber ++;
  console.log('\nfinished updating notificationPane');
}

/* removeNotification from local array, decrement noteNumber accoringly */
removeNotif = function(notObj){
  console.log('\n removing... ', notObj);
  var notes = getCurrentNotes();
  if(Object.keys(notes).length < 1) return false;
  else if(notes[notObj.batch_identification]){
    console.log('delete note : ', notObj.batch_identification);
    delete notes[notObj.batch_identification];
    clearTimer(notObj);                                            // clear timer
    if(notObj.html.parentNode) notObj.html.parentNode.removeChild(notObj.html);
  }
  console.log('\nfinished removing notification');
}

clearTimer = function(notObj){
  if(notObj.timer) clearInterval(notObj.timer);           // clear Timer interval
}


/* actually build the innerHTML of a notification */
populateNote = function(notObj){
  console.log('\ncreating... ', notObj.id);
  var div  = notObj.html;
  var gal = getFolderTag();
  var verb = 'rotating';
  if(notObj.type === 'download') verb = 'downloading'
  if(notObj.type === 'move') verb = 'moving'
  // var workorder = fetchWorkOrder();

  div.innerHTML =   "<div class=\"notif_summary\">" +
                    "<label class='not_gal'>" +
                      gal +
                    "</label>" +
                    "<label class='item_count'><span class=\"status\">" + verb + " </span>(" +
                    "<span class=\"dl_count\">" + "" + "</span>" +
                    "<span class=\"dl_sep\">" + "" + "</span>" +
                    "<span class=\"dl_total\">" + notObj.items + "</span>" +
                    ") " +
                    // "images "+
                    "</label>" +
                    "<label id=\"" + div.id + "_number\" class=\"notif_number\">" +
                                    notObj.count +
                                    "</label>" +
                    // ADD Completion/ZIPPING indicators
                    // "<label id=\"" + div.id + "_zipping\" class=\"notif_zipper\">" +
                    //                 "<i>Zipping Files</i>" +
                    //                 "</label>" +
                  "</div>" +
                  "";

  console.log('addTimeDetails() --> ', div);
  addTimeDetails(div);
  console.log('\nfinished building notification');
}

checkNotifs = function(){
  var notation = getNotificationPane();
  if(!notation){
    console.log('\ncreate Notification Pane');
    notation = document.createElement('div');
    document.body.appendChild(notation);
    notation.id = 'notification_pane';
    var roller = document.createElement('div');
    notation.appendChild(roller);
    roller.className = 'notif_alert_roll';
    setNotificationPane(notation);
  }
  return notation;
}

/*
  create a new notification box instance on the page
*/
initNotifs = function(){
  console.log('\nInitializing notifications...', notObj);
  return true;
}

/*
  update time from timerFunction result in interval
*/
updateNotifTime = function(note){
  // console.log('update time! : ', note);
  note.ele.querySelector('.minute_text').textContent = note.minute;
  note.ele.querySelector('.second_text').textContent = note.second;
}

/*
  UI -- Construct timer within the nofitication element
*/
addTimeDetails = function(timeObj){
  console.log('\nadding time details to time');
  timeObj.classList.add('time_hover_on');
  var timeDetail = addTimeLabel(timeObj);
  timeObj.appendChild(timeDetail);

  var timeDetail = addTimeProgress(timeObj);
  timeObj.appendChild(timeDetail);
}

addTimeLabel = function(timeObj){
  timeObj.classList.add('time_hover_on');
  var timeDetail = document.createElement('div');
  timeDetail.id = timeObj.id + '_timer';
  timeDetail.className = 'notif_timer';
  timeDetail.innerHTML = "<label class=\"timer_text\" id=\"" + timeObj.id + "_timer_label\">" +
                          "<span class=\"minute_text\">" + "00" + "</span>" +
                          "<span>:</span>" +
                          "<span class=\"second_text\">" + "00" + "</span>" +
                         "</label>" +
                         "<label class=\"progress_text\" id=\"" + timeObj.id + "_progress_label\">" +"</label>" +
                         "";

  return timeDetail;
}

/*
  UI -- Construct the Percentage Complete Label
*/
addTimeProgress = function(timeObj){
  timeObj.classList.add('time_hover_on');
  var timeDetail = document.createElement('div');
  timeDetail.id = timeObj.id + '_progress';
  timeDetail.className = 'notif_progress';
  timeDetail.innerHTML = "" +
                          // "<label class=\"progress_text\" id=\"" + timeObj.id + "_progress_label\">" +"</label>" +
                          "<div class=\"progress_color\">" +"</div>" +
                          "";

  console.log('\ntimeDetail Progress : ', timeDetail);
  return timeDetail;
  timeObj.appendChild(timeDetail);
}

// GETTERS & SETTERS for notification Pane
getNotificationPane = function(){
  return this.notificationPane;
}
setNotificationPane = function(notifDiv){
  this.notificationPane = notifDiv;
}

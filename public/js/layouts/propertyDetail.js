
var socket = io();
var propID = '';
var propertyObj = {};
var thisUser = {};
var propertyList = [];
// Load the properties from the router, not the compenent

loadFile = function(){}; //reserve this space to declare the function name
                         // function will be defined when the socket connects because it uses the socket.emit()
socket.on('connect', function(){
    console.log('Socket connected : ', socket.id);
    document.getElementById('tableHeader')
      .addEventListener('click', function(e){window.location.href = window.location.href.substring(0, window.location.href.lastIndexOf('/'))});

    socket.emit('whoAmI', function(params){
      console.log('Properties to Select From: ', params.properties);
      console.log('Window.location = ', window.location.href);
	  thisUser = params.socketUser;
      socket.emit('loadProperty', window.location.href.substring(window.location.href.lastIndexOf('/')+1), function(propertyInfo){
        console.log('Property Info Returned :: ', propertyInfo);
		try{
            document.getElementById('undefined__item').parentElement.removeChild(document.getElementById('undefined__item'));
		}catch(e){}
                addProperty(propertyInfo);
                propertyObj = propertyInfo;
                propID = propertyInfo.UniqueID;
                loadDetails(propertyInfo);
                // loadDetails(propertyInfo);
            // socket.emit('propertyPhotos', propertyInfo.UniqueID, loadPhotos);
      });
    });

    loadFile = function(files, intoDiv){
      console.log('Files loaded: ', files);
      console.log('\n\nLoad File into ', intoDiv);
      var fileField = intoDiv.substring(0, intoDiv.indexOf('__fu'));
      console.log('Property Field to Update : ', fileField);
      var ffDiv = document.getElementById(fileField);
      console.log('Field Div: ', ffDiv);
      ffDiv.querySelector('.valueLabel').innerHTML = files[0].name;
      console.log('Field Div: ', ffDiv.querySelector('.valueLabel'));
      //NEED TO UPLOAD THE FILE INTO GDRIVE BEFORE THE DB ENTRY, Fetch the new url for the gdrive upload, and then call the DB query.
      /**/
      socket.emit('addToGDrive', files[0], files[0].name, propID, function(results){
        console.log('\n\nData uploaded to GDrive, now insert into DB', results);
        socket.emit('loadFile', {table:'property', field:fileField, UniqueID:propID, fileName:results.gDriveData.name, fileID: results.gDriveData.id}, function(cb){
          console.log('Server NOTIFICATION: \nFile Uploaded: ', cb);
        });
        // socket.emit('addToDB', results, function(dbreturn){
        //   console.log('\n\nRETURNED FROM addToDB(): ', dbreturn);
        //   // socket.emit('loadFile')
        // });
      });
      /**/
    }
});



loadMapsLink = function(){
	var maplink = document.getElementById('maplink');
	maplink.title = 'Google Maps Directions';
	maplink.addEventListener('click', function(){
		return window.location.href = "https://www.google.com/maps/place/" + maplink.outerText;
	});
};

loadReferenceListeners = function(){
	var details = document.querySelectorAll('.detailDiv');
	// console.log('Details : ', details);

	details.forEach((detail)=>{
		console.log('Details : ', detail);
		if(detail.id.indexOf('client')){
			// detail.querySelector('.EditButton').addEventListener('click', viewClient);
		}
		switch(detail.id){
			case 'repair_specialist':
				linkRepairSpecialist(detail);

			break;
			default: false;
		}
	});

	  // throw Error;
}

linkRepairSpecialist = function(detailDiv){
	console.log('Repair Specialist Link: ', detailDiv);
	console.log('User to Compare: ', thisUser);
	var valDiv = detailDiv.querySelector('.valueLabel');
	if(valDiv.outerText === thisUser.user_name){
		console.log('User Match Repair Specialist: ', thisUser.user_name, valDiv);
		valDiv.classList.add('onHover');
		valDiv.title = 'View Your User';
		valDiv.addEventListener('click', currentUser);
	}
}

currentUser = function(e){
	window.location.href = '/api/current_user';
}

loadDetails = function(propObj){
  //set the Address Header
  var newDetail = document.querySelectorAll('.property_details label')[0];
  console.log('Set Address: ', propObj.Address || propObj.Property);
  newDetail.innerHTML = propObj.Address || propObj.Property;
  Object.keys(propObj).forEach((key, ind)=>{
    // console.log('Key: ', key);
    // console.log('Value : ', propObj[key]);
    addDetail(key,propObj[key]);
	if(ind === Object.keys(propObj).length-1)   loadReferenceListeners();
 });
}

addDetail = function(key, val){
  console.log('addDetail() triggered ...', key, val);
  var newDetail = document.createElement('div');
  newDetail.id = key;
  newDetail.classList.add('detailDiv');
  newDetail.innerHTML = '<label class="keyLabel">' + key + ': </label>';
  console.log(newDetail);
  newDetail.innerHTML = newDetail.innerHTML +'<label class="valueLabel">' + val + '</label>';
  newDetail.innerHTML += '<p></p>';
  // var prefix = '<div id="' + key + '" class="detailDiv">';
  // newDetail.innerHTML = prefix + newDetail.innerHTML + '</div>';
  document.getElementById('property_details').appendChild(newDetail);
  if(isFile(key)){
    console.log('\n\nFILE KEY : ', key);
    newDetail.classList.add('fileField');
    initUploadFile(key);
  }
}


isFile = function(key){
  if(key.toLowerCase().indexOf('irf') > -1 ||
     key.toLowerCase().indexOf('file') > -1){
    return true;
  }
  return false;
}

initUploadFile = function(key){
  console.log('\nINIT UPLOAD FILE CONFIG');
  filefield = document.getElementById(key);
  var uploadDiv = document.createElement('input');
  uploadDiv.id = key+'__fu';
  console.log('\nFile Div: \n', filefield);
  console.log('\nUpload Div: \n', uploadDiv);
  uploadDiv.classList.add('hideFile');
  document.getElementById('hiddenFileUploaders').appendChild(uploadDiv);
  // uploadDiv.innerHTML = '<input type="file"><input>';
  // CHANGE THE TYPE OF THE INPUT TO FILE
  uploadDiv.type = 'file';
  console.log('Adding Event Listener to fileField: ', filefield);
  filefield.querySelector('.valueLabel').addEventListener('click', function(e){
	  //provide the source element as the parent di
	  triggerChangeDialog(e.srcElement.parentElement);
  });

  /*
	If the div has the click, then the view button adopts the listener as well,
	filter out those button elements on the listener
  */


  //INIT DROP BOX
  var valueL = filefield.querySelector('.valueLabel');
  console.log('Initialize the dropbox for the file upload : ', valueL);
  initDropBox(filefield, valueL);

  uploadDiv.addEventListener('click', fileChangeDialog);
  initViewDoc(filefield);
}

/*
	Initialize a button to view the document, if applicable
*/
initViewDoc = function(fileField){
	console.log('View Doc Button adding to : ', fileField);
	var newButton = document.createElement('button');
	newButton.className = 'viewdoc-button';
	newButton.innerHTML = 'VW';
	newButton.title = 'View Document';
	fileField.removeChild(fileField.querySelector('p'));
	fileField.appendChild(newButton);
	fileField.appendChild(document.createElement('p'));
	newButton.addEventListener('click', function(e){
		e.preventDefault();
		viewFile(fileField);
	});
}

viewFile = function(fileField){
	console.log('View Doc Button CLICKED : ', fileField);
	return window.location.href = 'https://drive.google.com/file/d/' + fileField.querySelector('.valueLabel').outerText + '/view';
};

triggerChangeDialog = function(e){
  console.log('triggerChangeDialog()', e);
  var targ = e;
  // if(targ.)
  var fileUploadID = e.id + '__fu';
  // currentTarget = e.target.id;
  console.log('Change Diaglog found : ', fileUploadID);
  $('#'+fileUploadID).click();
}

fileChangeDialog = function(e){
  console.log('File Change Dialog Triggered');
  var targ = e.target;
  var fileUploadID = e.target.id;
  console.log('fileChangeDialog TARGET : ', fileUploadID, '\nFROM: ', targ);
  $('#'+fileUploadID).unbind('change');
  $('#'+fileUploadID).on('change', function(evt){
    console.log('Changed : ', evt);
    console.log('Files: ', this.files, window.location.href);
    if(window.location.href.indexOf('/batch.html')>-1) scaleAndDisplay(evt, previewID);
    else loadFile(this.files, fileUploadID);
  });
};


// DRAG AND DROP
initDropBox = function(container, fileField){
  console.log('INITIALIZE DROP BOX', container, fileField);
  container.addEventListener('dragenter', dragenter, false);
  container.addEventListener('dragover', dragover, false);
  container.addEventListener('dragleave', dragleave, false);
  container.addEventListener('drop', function(e){
	  dropdrag(container.id+'__fu', e);
  }, false);
}

function dragenter(e){
  e.stopPropagation();
  e.preventDefault();
}
function dragover(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('current drag enter target : ', e.currentTarget);
  if(e.currentTarget.className.indexOf('dragOver')=== -1) e.currentTarget.className += ' dragOver';
}
function dragleave(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('LEaving : ', e.currentTarget);
  if(e.currentTarget.className.indexOf('dragOver')>-1) e.currentTarget.classList.remove('dragOver');
}

function dropdrag(fileFieldID, e){
  e.stopPropagation();
  e.preventDefault();
	console.log('fileFieldID : ', fileFieldID , '\n\n\n', e)
  var transfer = e.dataTransfer;
  var files = transfer.files;
  loadFile(files, fileFieldID);
}

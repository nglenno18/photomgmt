var socket = io();
socket.forceNew = true;

// Load the properties from the router, not the compenent
var propIDArray = [];
var headRow = '';
var allEntries = [];
var tableFormat = 'deck';

var propertyOption = {};
var currentProperty = {};
var currentWOindex = 0;
var propID;
	var optionsIndex = 0;
var loaded = false;
var searchType = "";

currentArray = {};
var wo_list = [];
var searchProperty = function(){};
var fetchProperty = function(){};
var getWorkOrders = function(){return this.activeOrders};
var loadingDetails = function(){};
var uplTag = false;
var thisUserType;
var thisUserEmail;
var GOOGLE_URL = null;
var activeThumbnails = {};


window.onbeforeunload = function(e) {
  socket.disconnect();
};




var pathid = window.location.pathname.substring(1);
pathid = pathid.substring(pathid.indexOf('/')+1);
pathid = '/api/property/' + pathid;
console.log('window.location.pathname : ', decodeURIComponent(window.location.pathname), '\nPATH ID = ', pathid);

var container = document.getElementById('property_dropdown');

addPropertyOption = function(propertyAddress, container){
	console.log('Adding Property Option: ');
	var opt = document.createElement('option');
	opt.text = propertyAddress;
	if(!container){
		if(document.getElementById('property_dropdown'))document.getElementById('property_dropdown').add(opt);
	}else container.add(opt);
}


startLoadAnimation = function(headerLabel, baseText){
	console.log('\nstarting load animation');
	headerLabel.style.opacity = '0.5';
	var dots = 0;

	var dotInterv = dotsInterval(dots, headerLabel, baseText);
	var fadeInterv = fading(dots, headerLabel);
	return {element: headerLabel, dot: dotInterv, fade: fadeInterv};
};

dotsInterval = function(dots, propHeader, baseText){
	return setInterval(function(){
		if(!baseText) baseText = 'Loading Property Address';
		propHeader.textContent = baseText;
		if(dots < 3){
			for(var x = 0; x <=dots; x++){
				propHeader.textContent += '.';
			};
			dots = dots+1;
		}
		else dots = 0;
	},500);
}

fading = function(dots, propHeader){
	var opac = 1;
	var back = -1;
	return setInterval(function(){
		var newO = opac + (back * 0.02);
		if(newO<0 || newO > 1){
			back = back * (-1);
		}
		opac = opac + (back * 0.02);
		propHeader.style.opacity = newO;
	}, 30);
}

waiting = function(yesno, labelLoading){
	labelLoading.textContent = "Finding Images..."
	if(yesno){
		fading(null, labelLoading);
	}else{
		clearInterval(fading(null, labelLoading));
	}
}

initializeSearchBar = function(e, property){
	collectProperties(searchURL);
	console.log('initialize SearchBar: ', property);
	var searchbar = document.getElementById('searchbar');

	if(currentProperty) searchbar.innerHTML = currentProperty.property;
	var searchClick = document.querySelector('#searchBarContainer img:not(#homeImage)');
	// searchbar.addEventListener('change', function(e){
	try {
		var searchHome = document.getElementById('homeImage');
		searchHome.addEventListener('mouseover', function(e){
			// searchHome.src = '.././images/homeImage_pressed.png';
			searchHome.classList.add('hovered');
		});
		searchHome.addEventListener('mouseout', function(e){
			// searchHome.src = '.././images/homeImage_simple.png';
			searchHome.classList.remove('hovered');
		});
		searchHome.addEventListener('click', function(e){
			return window.location.href = '.././propertySearch';
		});
	} catch (ee) {
		console.log('Search HOME button not available on this page');
	}
	console.log('Searchbar initializing Click Action: ', searchClick);
	searchClick.addEventListener('click', function(e){
		var searchTerm = searchbar.value;
				document.getElementById('property_dropdownContainer').innerHTML = '';
				currentArray = {};

		console.log('searchbar active ::', searchTerm);
		searchProperty(searchTerm, function(properties){
			console.log('Test property Search: ', 'belvedere\n', properties);
		});
	});

	searchbar.addEventListener('keypress', function(e){
		if(searchbar.value.length === 0){
			searchClick.style.opacity = '0.5';
			document.getElementById('property_dropdownContainer').innerHTML = '';
			currentArray = {};
		}else searchClick.style.opacity = '1.0';

		console.log('key: ', e.keyCode);
		switch(e.keyCode){
			case 13: return searchClick.click();
			break;
			case 40: 			// down arrow
				return downSearch();
			break;
			case 39:
				return upSearch();
			break;
		}
	});

	//initialize the key-arrow presses
	searchbar.addEventListener('keydown', function(e){
		console.log('key: ', e.keyCode);
		switch(e.keyCode){
			case 40: 			// down arrow
				return optionsIndex = downSearch(optionsIndex);
			break;
			case 39:
				return upSearch();
			break;
		}
	});

	searchbar.focus();
}

function setProperty (propUpdate){
	this.propertyObject = propUpdate;
}
function getProperty(){
	return this.propertyObject;
}

function loadProperty (result){
	console.log('ANIS : \n\tfade: ', anis.fade, '\n\tdots: ', anis.dot);
	clearInterval(anis.fade);
	clearInterval(anis.dot);
	setProperty(result);
	var propHeader = document.getElementById('propertyLabel');
	propHeader.style.opacity = '1';

	console.log('PropertyMATCH : : ', result.Property);
	document.getElementById('searchbar').placeholder = 'Search for Properties...';
	document.getElementById('searchbar').title = "Search by Property Address";
	currentProperty = {property: result.Property, propID: result.Property_key};
	propID = currentProperty.propID;
	console.log('\n\n\n\nPROPERTY ID assigned!' , propID);

	loadDetails(result);
	initializeListeners();
	setPropertyGrid(result);
	setCurrentCSS();

	var dropbox = document.getElementById('dropdown_gallery');

	var beforeTab = document.getElementById('before_tab');
	clearGallery();
	var numThumbsRow = 4;
	var dropdown_gallery = document.getElementById('dropdown_gallery');
	document.body.style.setProperty('--thumbnail_length', (dropdown_gallery.offsetWidth/numThumbsRow)-(10 * numThumbsRow) + 'px');
	document.body.style.setProperty('--thumbnailPadding', '10px');
	if(document.body.querySelectorAll('.selected').length === 0 ) uppyInit();


	if(beforeTab){
		console.log('------------------------\nBEFORE FOUND... tab clicked!\n');
	}else{
		console.log('------------------------\nBEFORE TAB NOT FOUND!\n');
	}
	return;
}

populateWorkOrders = function(workOrders){
	var wolist = document.getElementById('workOrderContainer');

	workOrders.forEach((wo)=>{

	});
	console.log('Populating Work Orders : ', workOrders, '\n', document.body.querySelector('#workOrder label'));
	if(workOrders[0]) {
		return document.body.querySelector('#workOrder label').innerHTML = "Work Order <span class='workOrderVal'>" + workOrders[0] + '</span>';
	}
}

loadTableItem = function(item){
	var ele = document.createElement('div');
	ele.className = 'phases';
	ele.innerHTML = item.property;
	ele.id = item.UniqueID;
	document.getElementById('property_dropdownContainer').appendChild(ele);
	ele.addEventListener('click', navigateProperty);
}
navigateProperty = function(e){
	var ele = e.currentTarget;
	var formattedID = ele.id;
	if(formattedID.indexOf('#')>-1){
		formattedID = formattedID.replace(/#/g, '!!!!');
	}	window.location.href = '../.' + uplTag +formattedID;
}

cloneElement = function(ele){
	console.log('REPLACE : ', ele);
	var cloned = ele.cloneNode(true);
	ele.parentNode.replaceChild(cloned, ele);
	return cloned;
}


initializeNavigation = function(e){
	console.log('\n\nSearch Type : ', window.location.href);
	document.getElementById('homePage').addEventListener('click', function(e){
		return window.location.href= '.././propertySearch';
	});

	document.getElementById('myProperties').addEventListener('click', function(e){
		e.stopPropagation();
		return window.location.href= '.././myProperties';
	});
	try {
		$('#logoutbtn').on('click', function(e){
			console.log('LOGOUT CLICKED!');
			return window.location.href= '.././api/logout';
		})
	} catch (e) {
		console.log('\n\n\nNo Logout Options Available!\n', e);
	} finally {

	}
}

propertySelected = function(item){
  console.log('Property Selected : ', item);
  var itemID = item.id.substring(0,item.id.indexOf('__item'));
  console.log('Navigate to new Property Page: ', itemID);
  console.log(window.location.href = './properties/'+itemID);
  window.location.href = './properties/'+itemID;
}


refreshPhotos = function(params){
	console.log('...refreshPhotos (call FETCH PHOTOS) from propertyPage.js...');
	clearGallery();
	var wo = params.work_order;
	var contract = params.contractor;
	console.log('\n\nRefresh Work Order param : ', wo);
	fetchPhotos({id: currentProperty.propID, gallery: currentGallery.substring(0, currentGallery.indexOf('_tab')), work_order: wo, contractor: contract}, loadPhotos);
}

loadPhotos = function(serverReturnData, filterFunction){
  console.log('load Photos Server returned with image data of the property from DB :\n', serverReturnData);
	imageCount = 0;
	currentCount = 0;
	var filcount = 0;

	currentFiles = {};
	dbImageArray = [];

	var activetags = getActiveTags();
	var nL = -1;
	try{
		nL = serverReturnData.images.length;
		filCount = serverReturnData.images.length;
		var gal = serverReturnData.images[0].description;
		if(nL < 1 || nL > 2000) nL = 0;
		setGalCount(nL);
		setFilteredCountLabel({count:getGalCount().galleryImCount, gal:gal.substring(0, 1).toUpperCase() + gal.substring(1).toLowerCase()});
		setImageCountLabel({count: getGalCount().galleryImCount, gallery: gal.substring(0, 1).toUpperCase() + gal.substring(1).toLowerCase()});
	}catch(e){
		console.log('\n\nImage Count error! :',e, '\n\ndescription (image gal): ', gal, '\ncurrentGal : ', currentGallery , '\n\nserverdata.images = ', serverReturnData.images );
		if(nL != -1) {
			setFilteredCountLabel({count:filCount || 0});
			if(getGalleryTag() === 'during' || getGalleryTag() === 'after') setFilteredCountLabel({count:0, gal: getGalleryTag().substring(0,1).toUpperCase() + getGalleryTag().substring(1)})
			console.log('getGalleryTag() = ', getGalleryTag());
		}
		setGalCount(0);
		// setImageCountLabel({count: 0, gallery: currentGallery.replace('_tab', '')});
	}

	// if(nL != 1) will set filteredCount, if necessary, when no image list is retreived
	if(!serverReturnData.images.length) setImageCountLabel({count:0,  gallery: currentGallery.substring(0,1).toUpperCase() + currentGallery.substring(1).replace('_tab', '').toLowerCase()})
  serverReturnData.images.forEach((ent, index)=>{
		console.log('image_table folder: ', ent.description, ' vs ', currentGallery, '\ntags = ', ent.tags);

		var desc = ent.description;
		if(getFolderTag() === "JOB SELECTION" || getFolderTag() === "TAG SELECTION"){
			if(desc +'_tab' != currentGallery || ent.wo != currentWorkOrder.work_order) return;
		}

		var tmpID = ent.urlString;
		// if(ent.urlString.indexOf('&time=') >-1) tmpID = ent.urlString.substring(0, ent.urlString.indexOf('&time='));
		tmpID = parseForGoogleID(tmpID);
		activeThumbnails[tmpID] = ent;

		// console.log('CATEGORY! ', desc);
    var reader = new FileReader();
    var img = document.createElement("img");
    img.classList.add('obj');
    // img.src = ent.urlString;
    // var imageC = document.getElementById(previewID);
    // var imageCImg = imageC.getElementsByTagName("img")[0];
    // reader.onload = (function(image){
    //   console.log('Image loading : ', index);
    //   return function(e){
    //     imageCImg.style.marginLeft = 'var(--standard_Padding)';
    //     imageCImg.style.marginRight = 'var(--standard_Padding)';
    //     imageCImg.src = e.target.result;
    //     imageCImg.title = files.url || files.id;
    //     imageCImg.style.objectFit = 'cover';
    //     filename.value = files.name;
    //       console.log('BOX: ', e.target);
		//
    //       addToGallery(e.target.result, imageCImg);
		//
    //       setTimeout(()=>{
    //         displayResize(e);
    //       }, 100);
    //   };
    // })(img);
		//
    // imageCImg.src = ent.urlString;
		var refresh = false;
		var hideThumb = filterOnTaglist(activetags, ent.tags);
		if(hideThumb === true) filCount --;
		// if(ent.urlString.indexOf('&time=') >-1) tmpID = thumbnail.id.substring(0, thumbnail.id.indexOf('&time='));
		tmpID = getUserProxy() + tmpID;
		var thumbLoad = addThumbnail(ent.urlString, {name:ent.urlString, id:tmpID, fileName:ent.FileName, timestamp: ent.timestamp, refresh, hideThumb, taglist: ent.tags});
		$(function(){
			$(thumbLoad.querySelector('img.lazy')).Lazy({
				scrollDirection: 'vertical',
				effect: 'fadeIn',
				visibleOnly: true,
				appendScroll: document.getElementById('dropdown_gallery'),
				beforeLoad: function(element){
					console.log('PRE-IMAGE! ',
						// element[0].id,
						'\tindex : ', index, ' / ', nL);
				},
				afterLoad: function(element){
					console.log('L-img loaded! ',
						// element[0].id,
						'\tindex : ', index, ' / ', nL);
				},
				event : "manualTrigger"
			})
		});
		if(thumbLoad.className.indexOf('hideThumbnail')=== -1){$(thumbLoad.querySelector('img.lazy')).trigger("manualTrigger");}

		if(index === serverReturnData.images.length- 1){
			if(getUserType() === "Contractor") setImageCountLabel({count:filCount,  gallery: currentGallery.replace('_tab', '').toLowerCase()})
			else {
				console.log('\n\nAuto-Set Filtered Count from Folder (After/During) Selection : ', filCount);
				setFilteredCountLabel({count:filCount || 0});
			}
			adjustGallery();

			refresh = true;

				displayResize();
				// TEST MOVE ::
				// testMove();

				if(filterFunction){
					console.log('\nb\n\n\nFILTER FUNCTION! ');
					filterFunction();
				}
		}
  });
 }


filterOnTaglist = function(taglist, imagetags){
	console.log('\nfilterOnTagList ----- ImageTags() : ');
	tagMatch = true;
	if((taglist === null || taglist === '')) return false;
	else if(imagetags === null) return true;
	try{
		if(taglist.toLowerCase().indexOf(imagetags.toLowerCase())>-1){
			console.log('\nfilterOnTagList: tag found! ONETAGMATCH');
			tagMatch = false;
		}else if(imagetags.trim().indexOf(':::')>-1){
			imagetags = imagetags.split(':::');
			tagmatch = true;
				imagetags.forEach((iTag)=>{
					if(iTag != ""){
						console.log('\nfilterOnTagList ----- iTag: ', iTag);

						if(taglist.toLowerCase().indexOf(iTag.toLowerCase())>-1){
							console.log('\n--------------------------\nmatched tag!');
							tagMatch = false;
						}
					}
				});
				console.log('Finished matching tags from imageTags');
		}else{
			tagMatch = true;
		}
	}catch(e){
		console.log('\nfilterOnTagList ----- No tags: (MATCH) : e:\n\n', e);
		tagMatch = false;
	}finally{
		return tagMatch;
	}
}


searchProperty = function(propertyText, callback){
	console.log('Send Search Request: ', propertyText);
	var url = '/api/searchproperties/';
	$.ajax({
		type:'GET',
		dataType: "json",
		contentType: "application/json",
		url: decodeURIComponent(url),
		data: {
			propID,
			propertyText,
			workOrders: true
		},
		success: function(successResult){
			console.log('SEARCH PROPERTY AJAX SUCCESS Request!');
			if(callback) callback(successResult);
		},
		error: function(errorResult){
			console.log('SEARCH PROPERTY AJAX Request!\n', errorResult);
		}
	});

	socket.emit('searchProperties', {propertyText, workOrders:true}, function(result){
		console.log('Property Search Returned from Server: ', result.length);
		if(result.properties.length === 1){
			console.log('Single Propery Return --> Navigate to PageID: ', result.properties[0].UniqueID);
			var changedVal = result.properties[0].UniqueID;
			if(changedVal.indexOf('#')>-1){
				changedVal = changedVal.replace(/#/g, '!!!!');
			}
			return window.location.href = '.././upload/'+changedVal;
		}else if(result.properties.length === 0){
			console.log('Search returned no Results');
			return setPopup('Search Returned No Results');
		}
		result.properties.forEach((res)=>{
			loadTableItem(res);
			currentArray[res.property] = res.UniqueID;
		});
	});
}

setHeaderWidth = function(){
	var tbody = document.querySelector('tbody');
	if(!tbody) return;
	if(tableFormat === 'standard') tbody.style.width = 'var(--table_width)';
	else tbody.style.width = '100%';
	console.log('table Header Width: ', tbody.offsetWidth);
	headRow.style.width = document.querySelector('tbody').offsetWidth + 'px';
}

function dragenterFile(e){
  e.stopPropagation();
  e.preventDefault();
}
function dragoverFile(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('current drag enter target : ');
  if(e.currentTarget.className.indexOf('dragOver')=== -1) e.currentTarget.className += ' dragOver';
}
function dragleaveFile(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('LEaving : ');
  if(e.currentTarget.className.indexOf('dragOver')>-1) e.currentTarget.classList.remove('dragOver');
}

function dropdragFile(fileFieldID, e){
  e.stopPropagation();
  e.preventDefault();
	console.log('fileFieldID : ', fileFieldID , '\n\n\n', e)
  var transfer = e.dataTransfer;
  var files = transfer.files;
  loadFile(files, fileFieldID);
}

function alignDetails(){
  var details = document.querySelectorAll('.keyValue');
  details.forEach((keyval)=>{
    console.log('keyValue : ', keyval);
    var keyField = keyval.querySelector('span.keyField');
    var offHeight =keyField.offsetHeight;
    var lineHeight = keyField.style.lineHeight;
    // console.log('style : ', keyField.style);
    console.log('OffHeight: ', offHeight);
    console.log('LineHeight: ', lineHeight);
    if(offHeight>30 && keyval.querySelectorAll('span.valueField').length === 1) keyval.querySelector('span.valueField').classList.add('heightfix');
  });

  var dropdowns = document.querySelectorAll('.quickdrop');
  dropdowns.forEach((ddown)=>{
    // add a listener that expands the div and allows user to edit/view more
    console.log('ddown : ', ddown);
    ddown.querySelector('img').addEventListener('click', expandDetail);
  });
}

function expandOptions(e){
  console.log('expand the detail pane: ', e.currentTarget);
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  console.log('\nContainer to expand : ', container);
  console.log('\nContainer style : ', container.style);
}

function expandDetail(e){
	return;
  console.log('expand the detail pane: ', e.currentTarget);
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  console.log('\nContainer to expand : ', container);
  console.log('\nContainer style : ', container.style);

  var addElement = buildExpansion(container.id);
  if(!container.id || container.id === undefined){
	  addElement = container.parentNode;
	  console.log('Add Element');

	var contractor = false;

	try{
		contractor = document.getElementById('contractorRef').querySelector('.contractorVal').textContent;
	}catch(e){
		console.log('No Contractor Field\n\n', e);
	}

	  console.log('Reference : ', contractor, addElement.id);
	  switch(addElement.id){
		  case 'workOrder':
				console.log('Refer workOrder Dropdown : ', addElement.id);
			  return dropWorkOrders(addElement, wo_list, contractor);
				return;
		  break;
		  case 'contractorRef':
				return dropWorkOrders(addElement, wo_list);
		  break;

	  }
  }
  if(addElement){
	container.appendChild(addElement);
	  container.appendChild(document.createElement('br'));
  }
  container.style.height = '500px';

  // Once the container is expanded, change the expandButton icon;
  e.currentTarget.src = '.././images/uparrow.png';
  e.currentTarget.title = 'Hide Details';

  // add another listener to catch the "hideDetails" click
  e.currentTarget.addEventListener('click', hideDetail);
  // remove this listener
  e.currentTarget.removeEventListener('click', expandDetail);
}

function hideDetail(e){
  console.log('HIDE the detail pane');
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  // console.log('\nContainer to expand : ', container);
  container.removeChild(container.querySelector('br'));
  container.removeChild(container.querySelector('.expansion'));
  container.style.height = 'auto';

  // Once the container is expanded, change the expandButton icon;
  e.currentTarget.src = '.././images/expandarrow.png';
  e.currentTarget.title = 'Show Details';

  // add another listener to catch the "hideDetails" click
  e.currentTarget.addEventListener('click', expandDetail);
  // remove this listener
  e.currentTarget.removeEventListener('click', hideDetail);
}

function buildExpansion(containerID){
  var createElement = document.createElement('div');
  console.log('build an Expansion: ', containerID);
  switch (containerID) {
    case 'Phase':
      createElement = buildPhaseCard();
      return createElement;
      break;
    case 'workOrder':
      createElement = workOrders();
      return createElement;
      break
	 case 'coRefernce':
	 return createElement = workOrders();
	 break;
    default: false;
  }
}

fetchPhotos = function(params, callback, filterFunction){
	console.log('\n\n\nFETCH PHOTOS ajax request\n', params);
	clearGallery();
	var wo = params.work_order;
	var contract = params.contractor;
	// console.log('\n\nFETCH PHOTOS param : ', currentWorkOrder, wo_list, wo);
	var url = '/fetchphotos/' + (currentWorkOrder || 'folderTag') + '/' + getGalleryTag();
	// console.log('\n\n\n\nSEND POST REQUEST: ', wo, '\nENDPOINT: ', url);
	console.log('Trigger Image Count Label Animation');

	var labelLoading = document.getElementById('galleryCount');
	labelLoading.textContent = 'Finding Images';
	var anis = startLoadAnimation(labelLoading, 'Finding Images');

	var searchTab = '';
	var galTab = getGalleryTag();
	searchTab = getFolderTag();
	var taglist = getActiveTags();

	console.log('\n\nSEARCH TAG FOLDER NAME : ', searchTab, '\n\ntaglist to query : ', taglist);
	if(searchTab === 'JOB SELECTION' || searchTab === "GENERAL SELECTION" || searchTab === "PHOTO_TYPE" || searchTab === "TAG SELECTION") searchTab = '';

	// API Call for INDIV Property Info!
	setTimeout(function(){
		$.ajax({
			type:'GET',
			dataType: "json",
			contentType: "application/json",
			url: decodeURIComponent(url),
			data: {
				propID,
				work_order: wo,
				gallery: galTab,
				folder: searchTab,
				taglist: null
			},
			success: function(successResult){
				console.log('FETCH PHOTOS SUCCESS Request!\n');
				clearInterval(anis.fade);
				clearInterval(anis.dot);
				if(callback) callback(successResult, filterFunction);
			},
			error: function(errorResult){
				clearInterval(anis.fade);
				clearInterval(anis.dot);
				console.log('FAILED FETCH PHOTOS Request!\n', errorResult);
			}
		});
	}, 10)
}

var setFolderTag = function(paramTitle){
	console.log('\n\nSet Folder Tag : ', paramTitle);
	if(paramTitle.id){
		switch (paramTitle.id) {
			case 'generalTag': this.folderTagName = "";
			break;
			case 'jobsTag': this.folderTagName = "";
			break;
			case 'tagSelection': this.folderTagName = "";
			break;
			case 'folderSelection': this.folderTagName = "general";
			break;
			default: return this.folderTagName = paramTitle.id;
		}
		// console.log('Checkbox Status: ', paramTitle.querySelector('.checkboxClass').checked);
		if(paramTitle.querySelector('.checkboxClass').checked){
		}else{
			paramTitle.querySelector('.checkboxClass').checked = true;
		}
		// console.log('Checkbox Status: ', paramTitle.querySelector('.checkboxClass').checked);
	}else if(paramTitle.Folder){
		this.folderTagName = paramTitle.Folder;
	}
	return this.folderTagName;
}
var getFolderTag = function(){
	return this.folderTagName;
}

var setFolderSelection = function(params){
	console.log('\n\n\n-------------SET GENERAL SELECTION PANE');
	var folderTags = document.querySelectorAll('#body_wrapper .folderTag:not(#photosBar):not(#photosBody):not(.button_tab)');

	initializeSecondaryTags();
	console.log('\n\n\nINIT FOLDER TAGS');

	folderTags.forEach((tagButton)=>{
		console.log('Tag Button : ');
		tagButton.addEventListener('mouseover', function(){
			tagButton.classList.add('hovered');
		});
		tagButton.addEventListener('mouseout', function(){
			tagButton.classList.remove('hovered');
		});
		tagButton.addEventListener('click', function(){
			var checks = document.querySelectorAll('.folderTag .checkboxClass:checked');
			checks.forEach((ch)=>{
				console.log('\n\nCHECKED PANES : ', ch);
				ch.checked = false;
			});
			setFolderTag(tagButton);
			tagButton.classList.remove('hovered');
			var selecteds = document.querySelectorAll('.folderTag.active_tag');
			selecteds.forEach((ele)=>{
				ele.classList.remove('active_tag');
			});

			if(tagButton.className.indexOf('active_tag') >-1){
				tagButton.classList.remove('active_tag');
			}else{
				tagButton.classList.add('active_tag');
			}


			// TAB-SPECIFIC Methods
			var wolist = document.getElementById('propertyRefs');
			var photoLabel = document.getElementById('photo_sectionLabel');

			//JOB SELECTED
			if(tagButton.id === "jobsTag"){
				photoLabel.textContent = "Photo Section";
				var previouslies = document.getElementById('secondarySelection').querySelectorAll('.selectedTag');
				if(previouslies.length > 0) removeClass(previouslies, 'selectedTag');

				document.getElementById('secondarySelection').classList.add('hidedisable');
				document.getElementById('folderRefs').classList.add('hidedisable');

				console.log('TAG SELECTED = JOBSTAG DISABLE GALLERY!');
				enableGallery(false);
				// console.log('\n\n\n\nREVIEAL DATA TABLE : ', $('#wo_table').scroller);
				console.log('\nData Table Recalc Responsive : ', getDataTable().responsive);
				wolist.classList.remove('hidedisable');
				wolist.querySelectorAll('h2')[0].classList.add('hidedisable');
				try{
					$('#wo_table').DataTable().columns.adjust().responsive.recalc();
					getDataTable().columns.adjust().responsive.recalc();
				}catch(ert){
					console.log('\n\n\nERROR retreiving data table! ', getDataTable().columns.adjust(), '\n\nERROR: ', ert);
				}
			}else{
				wolist.classList.add('hidedisable');
			}

			// BROKER SELECTED
			if(tagButton.id === "generalTag"){
				currentWorkOrder = {};
				photoLabel.textContent = "Property Photos";
				var secondSelectionDIV = document.getElementById('folderRefs');
				secondSelectionDIV.classList.remove('hidedisable');
				clearGallery();
				clearTabSelected();
				console.log('\n\n\ndisable GALLERY');
				enableGallery(false);
			}else{
				photoLabel.textContent = "Photo Section";
				console.log('\n\n\ndisable GALLERY');
				enableGallery(false);
			}
		});
	})
}

var initializeSecondaryTags = function(){
	console.log('Initialize Secondary Tags ()');
	var secondSelectionDIV = document.getElementById('secondarySelection');
	secondSelectionDIV = secondSelectionDIV.querySelectorAll('.folderTag');
	secondSelectionDIV.forEach((second)=>{
		// console.log('\n\nSecond: ', second.id);
		second.addEventListener('click', function(e){
				setTagSelection(e, second);
		});
	});
}

var removeClass = function(list, className){
	list.forEach((ent)=>{
		ent.classList.remove(className);
	});
}


var setTagSelection = function(e, tagEle){
	console.log('\n\n\nTAG CLICKED : ', tagEle.textContent);
	var lab = tagEle.textContent.trim();
	if(lab.indexOf('Photos')===-1) lab = lab + " Photos";
	enableGallery(true, lab);
	clearGallery();
	clearTabSelected();
	var previouslies = document.getElementById('secondarySelection').querySelectorAll('.selectedTag');
	if(previouslies.length > 0) removeClass(previouslies, 'selectedTag');
	tagEle.id = tagEle.textContent.trim();
	setFolderTag(tagEle);
	tagEle.classList.add('selectedTag');
	var currentGal = getGalleryTag();
	var galEle = document.getElementById('period_'+currentGallery.substring(0,1).toUpperCase() + currentGallery.substring(1));
}

var getUserType = function(){
	return this.thisUserType;
}
var setUserType = function(textstring){
	this.thisUserType = textstring;
}
var getUserEmail = function(){
	return this.thisUserEmail;
}
var setUserEmail = function(textstring){
	this.thisUserEmail = textstring;
}

// this.GOOGLE_URL = "https://drive.google.com/uc?export=view&id=";
var getUserProxy = function(){
	// console.log('getUserProxy() = ', this.GOOGLE_URL);
	return this.GOOGLE_URL;
}
var setUserProxy = function(proxy){
	console.log('\n\nSET GOOGLE_URL = ', proxy);
	// if(proxy != 0) this.GOOGLE_URL = window.location.host + '/media/';
	if(proxy != 0) this.GOOGLE_URL = '../media/';
	else this.GOOGLE_URL = "https://drive.google.com/uc?export=view&id=";
	console.log('GOOGLE_URL = ', this.GOOGLE_URL);
}

// // function fetchPropertyu
// var fileTemp;
// console.log('\n\nTEMP STORAGE USER DETECTED !');
// var propHeader = document.getElementById('propertyLabel');
// var anis = startLoadAnimation(propHeader, 'Loading Property Address');
// setTimeout(function(){
// 	(function initializePage(){
// 		initializeListeners = function(e){
// 			console.log('INITIALIZE Listeners!! ""', e);
// 			$('#property_select2').select2({
// 				placeholder: "Search for a Property"
// 			});
// 				alignDetails();
// 		};
// 		initializeSearchBar(null);
// 		initializeNavigation(null);
//
// 		$.ajax({
// 			type:'GET',
// 			dataType: "json",
// 			contentType: "application/json",
// 			url: decodeURIComponent(pathid),
// 			success: function(successresult){
// 				console.log('Successful GET request!\nUser Data Retreived');
// 				setUserType(successresult.userType);
// 				if(successresult.userType === "Contractor"){
// 					document.getElementById('body_wrapper').classList.add('contractor');
// 					document.getElementsByClassName('leftside_grid')[0].classList.add('hidedisable');
// 					document.getElementById('selectAllDiv').classList.add('contractor');
// 				}
// 				setUserEmail(successresult.userEmail);
// 				callTagDetail(successresult.Property_key);
//
// 				setFolderSelection(successresult.properties);
//
// 				console.log('\n\nget UserType: ', getUserType());
// 				loadProperty(successresult);
//
// 				// initialize IMAGE-ACTION functions
// 				initDownloadListener();
// 				initRotateListener();
// 				initMoveListener();
//
// 				if(successresult.workOrders){
// 					console.log('Loading work_orders');
// 					this.activeOrders = successresult.workOrders;
// 					var woLoaded = loadWorkOrders(successresult.workOrders);
// 					// console.log('Work Orders returned from fetch property process: ');
// 				}else{
// 					console.log('\n\nLoading Workorders --- NO WORK ORDERS FOUND!');
// 					this.activeOrders = [];
// 				}
// 			},
// 			error: function(errResult){
// 				console.log('FAILED GET request\n\tError : \n', errResult);
// 			}
// 		});
// 	})();
// }, 0);


getPropertySelection = function(pathname, callback){
	$.ajax({
		type:'GET',
		dataType: "json",
		contentType: "application/json",
		url: decodeURIComponent(pathname),
		success: function(successresult){
			console.log('Successful GET request!\nUser Data Retreived');
			return callback(successresult);
		},
		error: function(errResult){
			console.log('FAILED GET request\n\tError : \n', errResult);
			return callback(null, errResult);
		}
	});
}

// API Call for taglist!
var  callTagDetail= function(pID){
		var url = '/json/taglist';
		if(pID){
			url = '/json/tagdetaillist/'+encodeURI(pID.replace(/!!!!/g,'#'));
		}
		setTimeout(function(){
			$.ajax({
				type:'GET',
				dataType: "json",
				contentType: "application/json",
				url,
				data: {
					tagColumn: 'folder',
					iColumn: 'property'
				},
				success: function(successResult){
					console.log('FETCH TAGLIST SUCCESS Request!\n', successResult);
				  buildTagList(successResult.tagList);
					return buildFolderList(successResult.folderList);
				},
				error: function(errorResult){
					console.log('FAILED FETCH TAGLIST Request!\n', errorResult);
				}
			});
		}, 0)
}

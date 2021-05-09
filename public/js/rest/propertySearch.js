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

currentArray = {};
var wo_list = [];
var searchProperty = function(){};
var fetchProperty = function(){};
var workOrders = function(){};
var loadingDetails = function(){};


window.onbeforeunload = function(e) {
  socket.disconnect();
};

// GET properties
var searchType = "all";
var searchURL = ".././search/properties";
(function(){
	console.log('\n\n\nSearch type: ', searchType,'\n\n', window.location);
	if(window.location.pathname === "/myProperties"){
		searchType = "myProperties";
		searchURL = ".././search/myProperties"
	}

})();

$.ajax({
	type:'GET',
	dataType: "json",
	contentType: "application/json",
	url: searchURL,
	success: function(successresult){
		initializeListeners();
		thisUser = successresult.userData;
		if(thisUser.user_type === 'Contractor' || thisUser.user_type === 'Client'){
			document.getElementById('homePage').classList.add('hidedisable');
			document.getElementById('myProperties').classList.add('hidedisable');
		}
		console.log('Successful GET request!\n\tRESULT : \n', successresult.properties.length, '\nUser Data: ',successresult.userData);
		document.getElementById('searchSum').textContent = successresult.properties.length + " Properties";
		document.getElementById('searchDetails').innerHTML =
							"<span id='user_type'>"+ successresult.userData.user_type + " </span>"+
							"<span id='user_name'>"+ successresult.userData.user_name + " </span>";

		var successresult = successresult.properties;
		successresult.forEach((res, i)=>{
			// loadTableItem(res);
			loadSelectOption(res);
			currentArray[res.property] = res.Property_key;
			if(i === successresult.length-1) {
				console.log('INDEX : ', i);
				$('#property_select2').val('');

				// Select2 on('select2:open')
				$('#property_select2').on('select2:open', function(){
					console.log('\n\n\nSELECT2 opened!');
					console.log($('.select2-selection'));
					var tempSearchBox =document.querySelector('.select2-selection');
					tempSearchBox.style.display= "none";
					var container =document.querySelector('.select2-dropdown');
					var searchField =document.querySelector('.select2-search__field');
					var magGlass =document.querySelector('#magGlass');

					magGlass.style.zIndex = '101';
					console.log('select2-dropdown : ', container.style);
					container.style.top  = '-24px';
					searchField.style.borderRadius = '20px 0px 0px 20px';
					console.log('select2-dropdown : ', container.style);

					var resopts = $('.select2-results')[0];
					console.log('\n\nSearchbar ', document.getElementById('searchBarContainer').style, '\n\nHeight calc : ', resopts.style.height);
					var searchb = document.getElementById('searchBarContainer');
					console.log('\n\nSearchbar container = ', searchb);
					searchb.style.height = '600px';
								(Number(searchb.style.height.replace("px", '')) + resopts.offsetHeight)+'px';
					console.log('\n\nSearchbar ', document.getElementsByClassName('select2-results__options')[0]);
					console.log('\n\nSearchbar 2 ', container.offsetHeight);
				});


				$('#property_select2').on('select2:close', function(){
					console.log('\n\n\nSELECT2 closed!');
					console.log($('.select2-selection'));
					var tempSearchBox =document.querySelector('.select2-selection');
					tempSearchBox.style.display= "block";
					var container =document.querySelector('.select2-dropdown');
					var searchField =document.querySelector('.select2-search__field');
					var magGlass =document.querySelector('#magGlass');

					var searchb = document.getElementById('searchBarContainer');
					console.log('\n\nSearchbar container = ', searchb);
					searchb.style.height = '49px';

					magGlass.style.zIndex = '0';
					// searchField.style.borderRadius = '20px 0px 0px 20px';
				});
				$('#property_select2').select2('open');

				$('#property_select2').on('change', function(e){
					console.log('\n\nSelected Property : ', document.getElementById('property_select2')[document.getElementById('property_select2').selectedIndex]);
					var changedVal = document.getElementById('property_select2')[document.getElementById('property_select2').selectedIndex].id;
					if(changedVal.indexOf('#')>-1){
						changedVal = changedVal.replace(/#/g, '!!!!');
					}
					return window.location.href = '.././upload/'+ encodeURIComponent(changedVal);
				});
			}
		});

		// $('property_select2').val("");
		// $('property_select2').select2('open');
	},
	error: function(errResult){
		console.log('FAILED GET request\n\tError : \n', errResult);
	}
});

//
// displayResize = function(e){
// 	$('#property_select2').close();
// }

startLoadAnimation = function(){
	var propHeader = document.getElementById('propertyLabel');
	propHeader.style.opacity = '0.5';
	var dots = 0;

	var dotInterv = dotsInterval(dots, propHeader);
	var fadeInterv = fading(dots, propHeader);
	return {element: propHeader, dot: dotInterv, fade: fadeInterv};

};

dotsInterval = function(dots, propHeader){
	return setInterval(function(){
		propHeader.textContent = 'Loading Property Address';
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

socket.on('disconnect', function(){
		console.log('Socket DISCONNECTED! ', function(){
			try{
				socket.close();
				socket.destroy();
			}catch(e){
				console.log('Error DISCONNECTING Socket from server');
			}
		});
});

socket.on('end', function(){
	console.log('close socket');
	socket.close();
});

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
	ele.innerHTML = item.property || item.Property;
	ele.id = item.UniqueID || item.Property_key;
	document.getElementById('property_dropdownContainer').appendChild(ele);
	ele.addEventListener('click', navigateProperty);
}

loadSelectOption = function(item){
	var ele = document.createElement('option');
	ele.text = item.property || item.Property;
	ele.id = item.UniqueID || item.Property_key;
	document.getElementById('property_select2').add(ele);
	ele.addEventListener('click', navigateProperty);
}

navigateProperty = function(e){
	var ele = e.currentTarget;

	// window.location.href = '.././upload/'+ele.id; 		// SOCKET.IO emit to load
	window.location.href = '.././api/properties/'+ele.id;     // AJAX REQUEST to load
}

cloneElement = function(ele){
	console.log('REPLACE : ', ele);
	var cloned = ele.cloneNode(true);
	ele.parentNode.replaceChild(cloned, ele);
	return cloned;
}

initializeSearchBar = function(e, property){
	console.log('initialize SearchBar: ', property);
	var searchbar = document.getElementById('searchbar');


	if(currentProperty) searchbar.innerHTML = currentProperty.property;
	var searchClick = document.querySelector('#searchBarContainer img:not(#homeImage)');
	// searchbar.addEventListener('change', function(e){
	try {
		var searchHome = document.getElementById('homeImage');
		searchHome.addEventListener('mouseover', function(e){
			// searchHome.src = '.././images/ARC_LOGO.png';
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
	// });
	if(!e){
		searchbar = cloneElement(searchbar);
		searchClick = cloneElement(searchClick);
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


downSearch = function(optionsIndex){
		optionsIndex = optionsIndex +1;
	console.log('downsearch index : ', optionsIndex);

	results = document.getElementById('property_dropdownContainer').getElementsByClassName('highlight')[0];
	if(results) results.classList.remove('highlight');

	var options = document.body.querySelectorAll('#property_dropdownContainer .phases');
	console.log('Index 1 down on : ',options[optionsIndex], '\n\n', options);
	options[optionsIndex].className = 'phases highlight';
}

initializePropertyLists = function(e){
	console.log('\n\nSearch Type : ', window.location.href);
	var displayDetails = false;
	var i = 0;
	// if(window.session.user.user_type === 'Contractor' || window.session.user.user_type === 'Client'){
	// 	document.getElementById('homePage').classList.add('hidedisable');
	// 	document.getElementById('myProperties').classList.add('hidedisable');
	// 	return;
	// }
	var displayListen = function(e){
		console.log('window listener...', displayDetails, e.srcElement);
		if(displayDetails === true && e.srcElement.id != 'searchSum'){
			document.getElementById('searchDetails').classList.add('hidedisable');
			e.currentTarget.classList.remove('clicked');
			displayDetails = false;
			i = 0;
			document.body.removeEventListener('click',this);
		}else{
			console.log('ELSE ...', displayDetails, '\n', i);
			i++;
		}
	}
	// document.body.addEventListener('click', displayListen);

	document.getElementById('searchSum').addEventListener('click', function(e){
			console.log('Summary Clicked...\nSHOW DeTAILS!', displayDetails);
			if(displayDetails === false){
				document.getElementById('searchDetails').classList.remove('hidedisable');
				e.currentTarget.classList.add('clicked');
				displayDetails = true;
				document.body.addEventListener('click', displayListen);
			}
			else{
				document.getElementById('searchDetails').classList.add('hidedisable');
				e.currentTarget.classList.remove('clicked');
				displayDetails = false;
				// document.body.removeEventListener('click',displayListen);
			}
	});



	document.getElementById('homePage').classList.remove('hidedisable');
	document.getElementById('myProperties').classList.remove('hidedisable');
	if(searchType === "all"){
		searchHeader = "All Active Properties";
		// propertyUserSummary(searchHeader);
		document.getElementById('homePage').classList.add('currentSearch');
		document.getElementById('myProperties').classList.remove('currentSearch');
		document.getElementById('myProperties').addEventListener('click', function(e){
			return window.location.href= '.././myProperties';
		});
	}else{
		searchHeader = "My Properties";
		// propertyUserSummary(searchHeader);
		document.getElementById('myProperties').classList.add('currentSearch');
		document.getElementById('homePage').classList.remove('currentSearch');
		document.getElementById('homePage').addEventListener('click', function(e){
			return window.location.href= '.././propertySearch';
		});
	}

	document.getElementById('searchHeader').textContent = searchHeader;
}

propertySelected = function(item){
  console.log('Property Selected : ', item);
  var itemID = item.id.substring(0,item.id.indexOf('__item'));
  console.log('Navigate to new Property Page: ', itemID);
  console.log(window.location.href = './properties/'+itemID);
  window.location.href = './properties/'+itemID;
}

loadPhotos = function(serverReturnData){
  console.log('Server returned with image data of the property from DB :\n', serverReturnData);
  serverReturnData.images.forEach((ent, index)=>{
    console.log('Entry to image_table : ', ent, '\n', currentGallery);

    if(ent.description+'_tab' != currentGallery || ent.wo != wo_list[currentWOindex].work_order) return;

	// return;

    var reader = new FileReader();
    var img = document.createElement("img");
    img.classList.add('obj');
    img.src = ent.urlString;
    var imageC = document.getElementById(previewID);
    var imageCImg = imageC.getElementsByTagName("img")[0];
    reader.onload = (function(image){
      console.log('Image loading: ', image);
      return function(e){
        console.log('\nonload function :', e);
        imageCImg.style.marginLeft = 'var(--standard_Padding)';
        imageCImg.style.marginRight = 'var(--standard_Padding)';
        imageCImg.src = e.target.result;
        imageCImg.title = files.url || files.id;
        imageCImg.style.objectFit = 'cover';
        filename.value = files.name;
          console.log('BOX: ', e.target);

          addToGallery(e.target.result, imageCImg);

          setTimeout(()=>{
            displayResize(e);
            // adjustGallery();
            // adjustGalleryHeight();
          }, 100);
      };
    })(img);

    // try// reader.readAsDataURL(ent.urlString);
    imageCImg.src = ent.urlString;
	var refresh = false;
	if(index === serverReturnData.images.length- 1) refresh = true;
    addThumbnail(ent.urlString, {name:ent.urlString, id:ent.urlString, refresh});
  });
 }

setHeaderWidth = function(){
	var tbody = document.querySelector('tbody');
	if(!tbody) return;
	if(tableFormat === 'standard') tbody.style.width = 'var(--table_width)';
	else tbody.style.width = '100%';
	console.log('table Header Width: ', headRow, tbody.offsetWidth);
	headRow.style.width = document.querySelector('tbody').offsetWidth + 'px';
}

function dragenterFile(e){
  e.stopPropagation();
  e.preventDefault();
}
function dragoverFile(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('current drag enter target : ', e.currentTarget);
  if(e.currentTarget.className.indexOf('dragOver')=== -1) e.currentTarget.className += ' dragOver';
}
function dragleaveFile(e){
  e.stopPropagation();
  e.preventDefault();
  console.log('LEaving : ', e.currentTarget);
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
  console.log('expand the detail pane: ', e.currentTarget);
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  console.log('\nContainer to expand : ', container);
  console.log('\nContainer style : ', container.style);

  var addElement = buildExpansion(container.id);
  if(!container.id || container.id === undefined){
	  addElement = container.parentNode;
	  console.log('Add Element: ', addElement);


	var contractor = false;

	try{
		contractor = document.getElementById('contractorRef').querySelector('.contractorVal').textContent;
	}catch(e){
		console.log('No Contractor Field\n\n', e);
	}

	  console.log('Reference : ', contractor, addElement.id);
	  switch(addElement.id){
		  case 'workOrder':
				console.log('Refer workOrder Dropdown : ', addElement, addElement.id);
			  return dropWorkOrders(addElement, wo_list, contractor);
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
  console.log('Element Added : ', addElement);
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
  console.log('HIDE the detail pane: ', e.currentTarget);
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  console.log('\nContainer to expand : ', container);
  console.log('\nContainer style : ', container.style);
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

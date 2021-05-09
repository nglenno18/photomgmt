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
var workOrders = function(){};
var loadingDetails = function(){};
var uplTag = false;






IF(
useremail()="apps@usresconstruction.com",true,

AND(
  ISNOTBLANK(LOOKUP(LOWER(USEREMAIL()), "user_table", "user_email", "user_type")),
  IF(
    IN(
      LOOKUP(LOWER(USEREMAIL()), "user_table", "user_email", "user_type"),
      List("SC Manager","SPOC","Asset Manager","Client")
    ),
  IF(
    IN([User_key], SELECT(Property[Broker], [User_key] = [Broker], true)),
    true,
    IF(
      IN([User_key], SELECT(bidrepairs[Contractor],  [User_key] = [Contractor], true)),
      true,
      IF(
        IN([User_key], SELECT(Inspection[Contractor],  [User_key] = [Contractor], true)),
        true,
      	false
      )
    )
  ),
	IF(IN(LOOKUP(LOWER(USEREMAIL()), "user_table", "user_email", "user_type"), LIST("Contractor", "Broker")),
		false,
		IF(IN(LOOKUP(LOWER(USEREMAIL()), "user_table", "user_email", "user_type"), LIST("Admin", "IT", "Billing", "Repair Specialist", "Vendor Procurement")), true, false)
	)
  )
)
)


window.onbeforeunload = function(e) {
  socket.disconnect();
};
socket.on('connect', function(){
    console.log('Socket connected : ', socket.id);

		// initUploadListeners();
	  // initializeSearchBar(null);
	  // initializeNavigation(null);

	  console.log('Property Page Initialized...');

    socket.on('whoAmI', function(params){
			console.log('\n\npropertyPage -- socketUser : ', params, '\n\n');
				if(loaded === true) return;
				loaded = true;
		      console.log('WHO AM I? ', params);

					var fetchID = false;
					var locID = window.location.href;
					console.log('Encoded Location : ', locID);
					if(locID.indexOf('/upload/')>-1) uplTag ='/upload/'
					if(locID.indexOf('/splitview/')>-1) uplTag ='/splitview/'
					if(uplTag){
						fetchID = locID.substring(locID.indexOf(uplTag) + uplTag.length);
						console.log('Property to Fetch = ', fetchID);
					}

					if(fetchID){
						if(fetchID.substring(fetchID.length-1) === '#'){
							console.log('#HASHTAG character detected, remove for ID query');
							fetchID = fetchID.substring(0, fetchID.length-1);

							return window.location.href = '../.'+uplTag +fetchID;
						}
					}
					// return;
					initializeSearchBar(null);
					initializeNavigation(null);

				var container = document.getElementById('property_dropdown');

				addPropertyOption = function(propertyAddress, container){
					console.log('Adding Property Option: ');
					var opt = document.createElement('option');
					opt.text = propertyAddress;
					if(!container){
						if(document.getElementById('property_dropdown'))document.getElementById('property_dropdown').add(opt);
					}else container.add(opt);
				}

				searchProperty = function(propertyText, callback){
					console.log('Send Search Request: ', propertyText);
					socket.emit('searchProperties', {propertyText, workOrders:true}, function(result){
						console.log('Property Search Returned from Server: ', result, '\nLength : ', result.length);
						if(result.properties.length === 1){
							console.log('Single Propery Return --> Navigate to PageID: ', result.properties[0].UniqueID);

							return window.location.href = '../.' + uplTag +result.properties[0].UniqueID;
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

				loadPropertyInfo = function(address){
					console.log('Request propertyInfo from server : ', address);
					socket.emit('loadProperty', address, function(results){
						console.log('Loaded Property: ', results);
						return loadDetails(results);
					});
				}

				refreshPhotos = function(params){
					clearGallery();
					var wo = params.work_order;
					var contract = params.contractor;
					console.log('\n\nRefresh Work Order param : ', wo_list[currentWOindex], wo_list, wo);
				    return socket.emit('propertyPhotos', {id: currentProperty.propID, gallery: currentGallery.substring(0, currentGallery.indexOf('_tab')), work_order: wo, contractor:contract}, loadPhotos);
				}

				workOrders = function(container){
					console.log('WorkOrders Dropdown : ', container, wo_list);

				}

				fetchProperty = function(propertyID, callback){
					console.log('Send FETCH Request: ', propertyID);
					var anis = startLoadAnimation();
					socket.emit('loadProperty', {propertyID, workOrders:true}, function(result){
						console.log('ANIS : \n\tfade: ', anis.fade, '\n\tdots: ', anis.dot);
						clearInterval(anis.fade);
						clearInterval(anis.dot);

						console.log('property + workOrders : ', result);
						console.log('PropertyMATCH : : ', result.Property);
						document.getElementById('searchbar').placeholder = 'Search for Properties...';
						document.getElementById('searchbar').title = "Search by Property Address";
						currentProperty = {property: result.Property, propID: result.Property_key};
						propID = currentProperty.propID;
						console.log('SEARCH BAR : ', document.getElementById('searchbar'));
						// initializeSearchBar(null);

						loadDetails(result);
						initializeListeners();

						// dragContainer = document.getElementById('uppy_reserve');
						var dropbox = document.getElementById('dropdown_gallery');
						// initDropBox(dropbox);
						// initGalleryDrag();

						var beforeTab = document.getElementById('before_tab');
						console.log('Loading work_orders', result);
											 console.log('Work Orders returned from fetch property process: ', loadWorkOrders(result.workOrders));
						// loadWorkOrders(currentProperty.property);
						clearGallery();
						// uppyInit();

						if(beforeTab) beforeTab.click();
						return;
					});
				}


				var locID = window.location.href;
				console.log('Encoded Location : ', locID);

				if(fetchID){
					console.log('Property ID: ', decodeURIComponent(fetchID));
					console.log('Running Fetch: ', fetchID);

					return fetchProperty(decodeURIComponent(fetchID), null);
				}else{
					// if there is nothing in the searchbar

					return document.querySelector('#searchBarContainer img').click();
				}

				window.addEventListener('resize', function(e){
					console.log('Document Width : ', document.body.clientWidth);
				});
    });
});

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
	ele.innerHTML = item.property;
	ele.id = item.UniqueID;
	document.getElementById('property_dropdownContainer').appendChild(ele);
	ele.addEventListener('click', navigateProperty);
}
navigateProperty = function(e){
	var ele = e.currentTarget;

	window.location.href = '../.' + uplTag +ele.id;
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
			searchHome.src = '.././images/homeImage_pressed.png';
			searchHome.classList.add('hovered');
		});
		searchHome.addEventListener('mouseout', function(e){
			searchHome.src = '.././images/homeImage_simple.png';
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

initializeNavigation = function(e){
	console.log('\n\nSearch Type : ', window.location.href);

	document.getElementById('homePage').addEventListener('click', function(e){
		// return window.location.href= '.././';
		return window.location.href= '.././propertySearch';
	});

	document.getElementById('myProperties').addEventListener('click', function(e){
		return window.location.href= '.././myProperties';
	});
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
	imageCount = 0;
	currentCount = 0;

	currentFiles = {};
	dbImageArray = [];

	try{
		var nL = serverReturnData.images.length;
		if(nL < 1 || nL > 2000) nL = 0;
		setGalCount(nL);
		setImageCountLabel({count: getGalCount().galleryImCount, gallery: serverReturnData.images[0].description});
	}catch(e){
		console.log('\n\nImage Count error! :',e);
	}
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
	addThumbnail(ent.urlString, {name:ent.urlString, id:ent.urlString, refresh});

		if(index === serverReturnData.images.length- 1){
			adjustGallery();

			refresh = true;
			$(function() {
				console.log('L-Element Loading ! \n', $('.lazy'));
						$('.lazy').Lazy({
							scrollDirection: 'vertical',
							effect: 'fadeIn',
							visibleOnly: true,
							appendScroll: document.getElementById('dropdown_gallery'),
							onError: function(element) {
									console.log('L-Element error loading ' + element.data('src'));
								},
							beforeLoad: function(element) {
								// called before an elements gets hAandled
								console.log('L-Element Will Load : ', element);
							},
							afterLoad: function(element){
								console.log('L-Element Loaded! ', element);
							},
	            onLoad: function(element){
                console.log('ELEMENT could not be loaded! ');
              },
	            onFinishedAll: function(element) {
								console.log('L-Elements all finished loading autoDestroy');
	                // if( !this.config("autoDestroy") )
	                //     this.destroy();
	            }
						});
				});
		}
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

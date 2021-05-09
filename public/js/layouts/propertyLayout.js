var socket = io();

// Load the properties from the router, not the compenent
var propIDArray = [];
var headRow = '';
var allEntries = [];
var tableFormat = 'deck';

var propertyOption = {};
var currentProperty = {};

socket.on('connect', function(){
    console.log('Socket connected : ', socket.id);
    socket.on('whoAmI', function(params){
      console.log('Load Properties Triggered from the Serverside: ', params);
      // loadProperties(params.socketUser.properties);
	  try{
		  var tbody = document.getElementById('property_table').querySelector('tbody');
			if(tbody){
				tbody.innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
				headRow = document.getElementById('tableHeader');
				headRow.className = 'deckClass';
			}
	  }catch(e){
		  console.log('Property Table not found on this page: ', e);
	  }


		var container = document.getElementById('property_dropdown');

		loadPropertyInfo = function(address){
			socket.emit('loadProperty', {propertyID: address, workOrders: true}, function(results){
				console.log('Loaded Property: ', results);
				loadDetails(results);
			});
		}

		addPropertyOption = function(propertyAddress, container){
			console.log('Adding Property Option: ');
			var opt = document.createElement('option');
			opt.text = propertyAddress;
			if(!container){
				if(document.getElementById('property_dropdown'))document.getElementById('property_dropdown').add(opt);
			}else container.add(opt);
		}
		socket.emit('myProperties', params.socketUser, function(propertyList){
			allEntries = propertyList;
          console.log('List Properties: ', propertyList);
          if(propertyList.addresses.length > 0){
            try{document.getElementById('undefined__item').parentElement.removeChild(document.getElementById('undefined__item'));}catch(e){}
          }

          propertyList.addresses.forEach((property, ind)=>{
			  console.log('property : ', property)
			  propIDArray.push(property.propertyID);
              // addProperty(property, 'deck');
			  addPropertyOption(property.Address, container);
			  if(ind === propertyList.addresses.length-1 && document.querySelector('tbody')) {
				  headRow.style.width = document.querySelector('tbody').getBoundingClientRect.width + 'px';
				  setHeaderWidth();
				  console.log('table Header Width: ', headRow, document.querySelector('tbody').getBoundingClientRect.width);
			  }
          });
		  propID = propertyList.addresses[0].UniqueID;
		  loadPropertyInfo(propertyList.addresses[0].Address);
        });

		window.addEventListener('resize', function(e){
			// console.log('RESIZING :', e);
			console.log('Document Width : ', document.body.clientWidth);
			setHeaderWidth();

			// if(document.body.clientWidth < 900 && tableFormat === 'standard'){
				// console.log('Document Width is narrow');
				// document.getElementById('property_table').querySelector('tbody').innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
				// propertyTableLoad(allEntries);
			// }else if(document.body.clientWidth > 900 && tableFormat === 'deck'){
				// document.getElementById('property_table').querySelector('tbody').innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
				// propertyTableLoad(allEntries);
			// }else{
				// setHeaderWidth();
			// }
		});
    });
    // loadProperties(null);
});


propertySelected = function(item){
  console.log('Property Selected : ', item);
  var itemID = item.id.substring(0,item.id.indexOf('__item'));
  console.log('Navigate to new Property Page: ', itemID);
  console.log(window.location.href = './properties/'+itemID);
  window.location.href = './properties/'+itemID;
}

loadPhotos = function(serverReturnData){
  console.log('Server returned with image data of the property from DB :\n', serverReturnData);
  serverReturnData.images.forEach((ent)=>{
    console.log('Entry to image_table : ', ent);

    if(ent.description+'_tab' != currentGallery) return;

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
        imageCImg.title = files.name || files.id;
        imageCImg.style.objectFit = 'cover';
        filename.value = files.name;
          console.log('BOX: ', e.target);

          addToGallery(e.target.result, imageCImg);

          setTimeout(()=>{
            displayResize(e);
            adjustGallery();
          }, 100);
      };
    })(img);

    // try// reader.readAsDataURL(ent.urlString);
    imageCImg.src = ent.urlString;
    addThumbnail(ent.urlString, {name:ent.name, id:ent.UniqueID});
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

function expandDetail(e){
  console.log('expand the detail pane: ', e.currentTarget);
  var field = e.currentTarget.parentNode;
  console.log('\nParent Target: ', field);
  var container = field.parentNode;
  console.log('\nContainer to expand : ', container);
  console.log('\nContainer style : ', container.style);

  var addElement = buildExpansion(container.id);
  container.appendChild(document.createElement('br'));
  if(addElement) container.appendChild(addElement);
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
  switch (containerID) {
    case 'Phase':
      createElement = buildPhaseCard();
      return createElement;
      break;
    default: false;
  }
}

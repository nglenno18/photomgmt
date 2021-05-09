var socket = io();

// Load the properties from the router, not the compenent
var propIDArray = [];
var headRow = '';
var allEntries = [];
var tableFormat = 'deck';

socket.on('connect', function(){
    console.log('Socket connected : ', socket.id);
    socket.on('whoAmI', function(params){
      console.log('Load Properties Triggered from the Serverside: ', params);
      // loadProperties(params.socketUser.properties);
		document.getElementById('property_table').querySelector('tbody').innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
		headRow = document.getElementById('tableHeader');
		headRow.className = 'deckClass';
		
		socket.emit('myProperties', params.socketUser, function(propertyList){
			allEntries = propertyList;
          console.log('List Properties: ', propertyList);
          if(propertyList.addresses.length > 0){
            try{document.getElementById('undefined__item').parentElement.removeChild(document.getElementById('undefined__item'));}catch(e){}
          }
          propertyList.addresses.forEach((property, ind)=>{
			  console.log('property : ', property)
			  propIDArray.push(property.propertyID);
              addProperty(property, 'deck');
			  if(ind === propertyList.addresses.length-1) {
				  headRow.style.width = document.querySelector('tbody').getBoundingClientRect.width + 'px';
				  setHeaderWidth();
				  console.log('table Header Width: ', headRow, document.querySelector('tbody').getBoundingClientRect.width);
			  }

          });
		  
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

setHeaderWidth = function(){
	var tbody = document.querySelector('tbody');
	if(tableFormat === 'standard') tbody.style.width = 'var(--table_width)';
	else tbody.style.width = '100%';
	console.log('table Header Width: ', headRow, tbody.offsetWidth);
	headRow.style.width = document.querySelector('tbody').offsetWidth + 'px';
}

var socket = io();

var tableStructure = {};

var propertySelect = function(x){};
// var propertyTableLoad = function(x){};
var propIDArray = [];
var allEntries = [];
var tableFormat = 'standard';
// Load the properties from the router, not the compenent
socket.on('connect', function(){
    console.log('Socket connected : ', socket.id);
    document.getElementById('tableHeader')
      .addEventListener('click', function(e){window.location.href = './properties'});

      socket.emit('whoAmI', function(params){
        console.log('\n\nI Am User: ', params);
        socket.emit('allProperties', params.socketUser, function(results){
			allEntries = results;
			if(document.body.clientWidth < 900 && window.location.href.indexOf('/tables/allProperties')===-1){
				tableFormat = 'deck';
				var tbody = document.querySelector('tbody');
				tbody.innerHTML = '<tr><th id="tableHeader">All Properties</th></tr><tr><th id="fillerHeader">All Properties</th></tr>';
				tbody.innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
				tbody.style.width = "100%";
			}
			
			else document.getElementById('property_table').querySelector('tbody').innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr></tr>';

			propertyTableLoad(results);
			var headRow = document.getElementById('tableHeader');

			try{headRow.style.width = document.querySelector('.standardRow').getBoundingClientRect.width + 'px';}catch(e){}
		});
      });
	  
    // loadProperties(null);
	propertySelected = function(item){
	  console.log('Property Selected : ', item);
	  var itemID = item.id.substring(0,item.id.indexOf('__item'));
	  console.log('Navigate to new Property Page: ', itemID, propIDArray);	  
	 
	 
			window.location.href = './properties/'+itemID;
	}
	
	
	// if(window.location.href.indexOf('/tables/allProperties')>-1)return;
	// console.log('Window Location : ', window.location.href.indexOf('/tables/allProperties'));
	window.addEventListener('resize', function(e){
		// console.log('RESIZING :', e);
		console.log('Document Width : ', document.body.clientWidth);
		var tbody = document.querySelector('tbody');
		if(document.body.clientWidth < 900 && tableFormat === 'standard'){
			console.log('Document Width is narrow');
			tbody.innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
			tbody.style.width = "100%";
			propertyTableLoad(allEntries);
		}else if(document.body.clientWidth > 900 && tableFormat === 'deck'){
			// headRow.style.width = tbody.getBoundingClientRect.width-10 + 'px';
			tbody.innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr></tr>';
			tbody.style.width = "var(--tbody_width)";
			// document.querySelector('table').innerHTML = document.querySelector('tbody');
			propertyTableLoad(allEntries);
		}else{
			var headRow = document.getElementById('tableHeader');
			try{headRow.style.width = tbody.offsetWidth + 'px';}catch(e){}
		}
	});
});

propertyTableLoad = function(propertyList){
          console.log('List Properties: ', propertyList);
          if(propertyList.addresses.length > 0){
            try{
				document.getElementById('undefined__item').parentElement.removeChild(document.getElementById('undefined__item'));
			}catch(e){};
          }
		  
		var headRow = document.getElementById('tableHeader');
		
		
		if(document.body.clientWidth < 900){

			console.log('Document Width is narrow -- force a Deck View');
			tableFormat = 'deck';
			if(headRow.className.indexOf('deckClass')) headRow.classList.add('deckClass');
			
		}else{
			tableFormat = 'standard';
			console.log('Document is WIDE --> create a full Table View');
			try{document.querySelector('tr').removeChild(document.getElementById('tableHeader'));}
			catch(e){console.log(e);}

			//Collect the Table Headers
			var ind = 0;
			Object.keys(propertyList.addresses[0]).forEach((key)=>{
				if(key === 'UniqueID') return;
				ind ++;
				var tHeader = document.createElement("th");
				tHeader.innerHTML = key;
				//retrieve the FIRST ROW (Header Row)
				tHeader.id = key+ '_header';
				document.querySelector('tr').appendChild(tHeader);
				tableStructure[tHeader.id] = {index:ind, maxwidth: false};
			});
			// var tbody = document.querySelector('tbody');
			// tbody.style.width = "var(--table_width)";
			// headRow.style.width = tbody.getBoundingClientRect.width-10 + 'px';
			
		}
          propertyList.addresses.forEach((property)=>{
			  console.log('property : ', property)
			  propIDArray.push(property.propertyID);
              addProperty(property, 'standard');
          });
		
		
		var headRow = document.getElementById('tableHeader');
		console.log('headrow: ', headRow);
		try{
			if(document.querySelector('tbody').offsetWidth){
				headRow.style.width = document.querySelector('tbody').offsetWidth-2+ 'px';
			}else{
				headRow.style.width = document.querySelector('.property_item').parentElement.getBoundingClientRect.width-2 + 'px';
			}
		}catch(e){
			try{
				headRow.style.width = document.querySelector('tbody').parentElement.offsetWidth-2 + 'px';
			}catch(e){
				console.log('error resizing column width: ', e);
			}
		}
		
		// FIX THE TABLE HEADER TO THE TOP
		if(tableFormat === 'standard'){
			//Checking the tableStructure header maxwidth values :
			// console.log('\n\nTABLESTRUCTURE : ', tableStructure);
			// console.log(setHeaderWidths());
			
			// console.log('\n\nTABLESTRUCTURE UPDATED : ', tableStructure);
					// throw Error;

		}
    };

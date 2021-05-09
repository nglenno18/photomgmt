var socket = io();
var selectedRow = '';
var countRowIndex = 0;

socket.on('connect', function(){
  propertyNavigation();
});

addProperty = function(property, viewType){
  console.log(property);
  countRowIndex ++;
  var table = document.getElementById('property_table');
  countRows(table, function(rowCount){
    console.log('Row Count Returned : ', rowCount);
    var property_item = table.insertRow(-1);
    var address = property.Address;
    var uniqueID = property.propertyID;
    if(property.UniqueID) uniqueID = property.UniqueID;
    if(property.property) address = property.property;

	// document.getElementById('property_table').querySelector('tbody').innerHTML = '<tr><th id="tableHeader">Address</th></tr><tr><th id="fillerHeader">Address</th></tr>';
	// var headRow = document.getElementById('tableHeader');
	// headRow.style.width = document.querySelector('tbody').getBoundingClientRect.width + 'px';

    // innerHTML should be a variable. This innerHTML is a deck of the Address/Prop info
	if(!viewType){
		property_item = deckRow(property, property_item);
		console.log('\n\n\n\n',property_item.id, '\n\n\n');
	}else{
		console.log('Property Row Type : ', viewType)
		property_item = setRow(property, viewType, property_item);
		// console.log('\n\n\n\n',property_item.id, '\n\n\n');
		console.log('property_item : ', property_item);
	}

    property_item.addEventListener('click', selectItem);
    // console.log('\n\n\nProperty Address Here : ', property_address, countRowIndex);
  });
}

propertyNavigation = function(){
  document.getElementById('myProperties').addEventListener('click', function(e){
    return window.location.href = '/myProperties';
  });
  try{
		document.getElementById('allProperties').addEventListener('click', function(e){
			return window.location.href = '/properties';
		});
  }catch(e){console.log('Error Caught: ', e);}
  document.getElementById('homePage').addEventListener('click', function(e){
    return window.location.href = '/';
  });
}

loadProperties = function(propertyList){
    console.log('List Properties: ', propertyList);
    if(propertyList.length > 0) {
		// counRowIndex --;
      document.getElementById('undefined__item').parentElement.removeChild(document.getElementById('undefined__item'));
    }

    propertyList.forEach((property)=>{
      addProperty(property);
    });
  }

countRows = function(tb, callback){
  var rowcount = 0;
  console.log('Table:', tb.rows);
  for(var i = 0; i < tb.rows.length; i++){
    if(tb.rows[i].className.indexOf('selected')) selectedRow = tb.rows[i];
    // console.log(tb.rows[i], '\n', tb.rows[i].getElementsByTagName('td'));
    rowcount += tb.rows[i].getElementsByClassName('property_item').length;
    if(i === tb.rows.length-1) return callback(rowcount);
  }
}

selectItem = function(e){
  console.log('\nRow Selected : ', e);
  var item = false;
  e.path.forEach((p)=>{
    if(p.nodeName === 'TR' && !item) item = p;
  });
  console.log('Item Identified: ', item);
  if(e.target.className.indexOf('selected') === -1){
    clearSelected();
    addClass(item, 'selected');
    console.log('Property Selected... property.js or allProperties determines the next steps with propertySelected()');
    propertySelected(item);
  }
}

clearSelected = function(){
  var list = document.querySelectorAll('tr');
  console.log(list);
  list.forEach((row)=>{
    console.log('before:', row.className);
    if(row.className.indexOf('selected')>-1){
      row.className = row.className.substring(0, row.className.indexOf('selected'));
                      // row.className.substring(row.className.indexOf('selected') + 'selected'.length);
    }
    console.log('after:', row.className);
  });
}
addClass = function(element, classname){
  console.log('add Class to ', element, ' :: ', classname);
  if(element.className.indexOf(classname)===-1) return element.className = element.className + ' ' + classname;
  else return false;
}


deckRow = function(property, property_item){
	console.log('Property Row : ', property, '\n\n\n', property_item);
	console.log('DECK TYPE');
	console.log('Address : ', property.Address)
	property_item.innerHTML = '<div class="property_item" display="table"><p class="property_address"><label placeholder="' + property.Address + '">' +
    property.Address + '</label></p><p class="property_status"><div class="statusClass"><label placeholder="STATUS"> Repair\'s Status</label></div></p><p class="property_status">' +
    '<label placeholder="STATUS">' + property.repair_specialist + '</label></p></div>';

    property_item.className = 'deckClass';
    property_item.id = property.UniqueID;
	property_item.id += '__item';

	var property_address = property_item.querySelector('.property_address');
	property_address.getElementsByTagName('label')[0].innerHTML = "Property # " + countRowIndex + ' </br>' + property.Address;
	return property_item;
}

standardRow = function(property, property_item){
	console.log('Property Row : ', property, '\n\n\n', property_item);
	console.log('DECK TYPE');
	console.log('Address : ', property.Address)
	property_item.innerHTML = '';

	//get the header row columns to assign the property values to the appropriate cell
	var columns = document.querySelectorAll('th');
	console.log(columns);
	var colValues = [];
	columns.forEach((col, index)=>{
		colValues.push({header:col.outerText, index});
		var fieldID = col.outerText + '_field';
		if(index === 0){
			property_item.innerHTML += '<td style="min-width: var(--min_width_mainCol);" class="' + fieldID + '">' + property[col.outerText] + '</td>';
		}else{
				property_item.innerHTML += '<td class="' + fieldID+ '">' + property[col.outerText] + '</td>';
		}
	});
	console.log('colValues : ', colValues);

    property_item.className = 'standardRow';
    property_item.id = property.UniqueID;
	property_item.id += '__item';

	var property_address = property_item.querySelector('.property_address');
	// property_address.getElementsByTagName('label')[0].innerHTML = "Property # " + countRowIndex + ' </br>' + property.Address;
	return property_item;
}

setRow = function(property, viewType, divItem){
	console.log('Set Row with Format: ', viewType, property, divItem);

	switch(viewType){
		case 'standard':
			if(document.body.clientWidth < 900){
				console.log('Document Width is narrow');
				return deckRow(property, divItem);
			}
			return standardRow(property, divItem);
			break;
		case 'deck':
			return deckRow(property, divItem);
			break;
	}
}

getHeaderDivID = function(fieldName){
	var fieldID = fieldName + '_field';
	return fieldName + '_header';
}

setHeaderWidths = function(){
	Object.keys(tableStructure).forEach((fieldName)=>{
		console.log('tableStructure key')
		var fieldID = fieldName.substring(0,fieldName.indexOf('_header')) + '_field';
		console.log('fieldID: ', fieldID);
		var fieldDiv = document.getElementsByClassName(fieldID)[0];
		var headerDivID = fieldName;
		console.log('HEADER DIV ID : ', headerDivID);
		console.log('Table Structur Column : ', tableStructure[headerDivID]);
		// if(tableStructure[headerDivID].maxwidth < fieldDiv.offsetWidth){
			tableStructure[headerDivID].maxwidth = fieldDiv.offsetWidth;
			document.getElementById(headerDivID).style.width = fieldDiv.offsetWidth + 'px';
		// }
	});
	return tableStructure;
}

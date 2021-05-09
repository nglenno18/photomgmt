var sampleProperty = {
  "Phase 1": '12/01/2017',
  "Phase 2": '12/15/2017',
  "Phase 3": '12/22/2017',
  "Phase 4": null,
  "OTB": null,
  "Completed": null
}
var po_entry =[];

fetchPropURL = function(){
  console.log('fetchPropURL()');
	var fetchID = false;
	var locID = window.location.href;
	if(locID.indexOf('/upload/')>-1) uplTag ='/upload/'
  if(locID.indexOf('/splitview/')>-1) uplTag ='/splitview/'
  if(locID.indexOf('/table/')>-1) uplTag ='/table/'
	if(uplTag){
		fetchID = locID.substring(locID.indexOf(uplTag) + uplTag.length);
		// console.log('Property to Fetch = ', fetchID);
	}

	if(fetchID){
		if(fetchID.substring(fetchID.length-1) === '#'){
			console.log('#HASHTAG character detected, remove for ID query');
			fetchID = fetchID.substring(0, fetchID.length-1);

			return window.location.href = '../.'+uplTag +fetchID;
		}
	}

  if(fetchID.indexOf('#')>-1){
    fetchID = fetchID.replace(/#/g, '!!!!');
  }

	fetchID = decodeURIComponent(fetchID);
	return fetchID;
}

fetchWorkOrder = function(){
  console.log('fetchWorkOrder()');
	// console.log('\n\n\n\\n\n\n\n\n\nFETCH WORKORDER\n\nFinding Work Order TextVal : ', currentWorkOrder, '\n\tWO_index: \n', currentWOindex, '\n\tWO_LIST: \n', wo_list);
  var wotoreturn = false;
  try{
    var woele = document.getElementsByClassName('workOrderVal')[0];
		if(woele) wotoreturn = woele.textContent || false;
	}catch(er){
		console.log('Error retreiving WO : ', er);
    // console.log('\n\nWork Orderfetched : ', currentWorkOrder);
		wotoreturn = currentWorkOrder.work_order;
	}finally{
    return wotoreturn;
  }
}

function loadDetails(propertyInfo){
	console.log('\n\nProperty Info !');
	var keyValues = document.querySelectorAll('.keyValue');
  var propLabel =document.getElementById('propertyLabel');
	propLabel.innerHTML = '<label id="propIDLabel" style="line-height: 30px">' +  propertyInfo.Property +'</label>';
  var clientLabel = document.createElement('span');
  clientLabel.innerHTML = ''+
                          // '<div class="clear">'+
                          '</div><span class="" id="clientSpan">     (LN# ' + propertyInfo['Loan Number']+ ')</span>';


  po_entry = [{
    Phase: propertyInfo.Phase,
    Status: propertyInfo.Status,
    "Client":propertyInfo["Client"],
    Broker: propertyInfo.Broker,
    "Service Company": propertyInfo["Service Company"],
    "Asset Manager": propertyInfo["Asset Manager"],
    "lastUpdate": propertyInfo["lastUpdate"],
    "phaseDate": propertyInfo["phaseDate"]
  }];


  initPropFlankers(propertyInfo);
  propTableResize();
  window.addEventListener('resize', propTableResize);

  document.getElementById('propertyLabel').appendChild(clientLabel);
	keyValues.forEach((keyval)=>{
		var keyID = keyval.id;
		// console.log('Property Key Val : ', keyval);
		if(!propertyInfo[keyval.id] && propertyInfo[keyval.id.toLowerCase()]) keyID = keyval.id.toLowerCase();
		if(propertyInfo[keyID]){
			// console.log('Property Key Valeu -- ', keyID, ': ', propertyInfo[keyID], keyval);
			var refimage = keyval.querySelector('.quickdrop img');
			if(propertyInfo[keyID].indexOf('T') >-1 && propertyInfo[keyID].indexOf('0.000Z')>-1){
				keyval.querySelector('.valueField').textContent = propertyInfo[keyID].substring(0, propertyInfo[keyID].indexOf('T'));
			}else{
				keyval.querySelector('.valueField').textContent= propertyInfo[keyID];
			}
			if(refimage){
				// console.log('Input new image back : ', refimage, keyval.querySelector('.quickdrop'));
				keyval.querySelector('.quickdrop').appendChild(refimage);
			}
		}
	});
	alignDetails();
}

function initializeDropdown(e){
			var container = document.getElementById('property_dropdown');
					console.log('\n\nAdd Event Listener to the Dropdown box. ', container);

		container.addEventListener('click', function(e){
			e.preventDefault();
			console.log('Clicked');
		})

		container.addEventListener("change", function(e){
			console.log('\n\nAdd Event Listener to the Dropdown box');
				var targ = e.currentTarget;
				// console.log('currentTarget : ', e.currentTarget);
					document.querySelectorAll('option .current').forEach((row)=>{
							row.classList.remove('current');
					});
				currentProperty = {property:container.options[container.selectedIndex].text};
				loadPropertyInfo(currentProperty.property);
			});
			return true;
}


function initPropFlankers(propertyInfo){
  console.log('Initialize Prop FLANKERS! ');
  var grid = document.getElementsByClassName('detailsGrid')[0];
  var leftLabelDiv, phaseLabelDiv;
  try {
    var leftLabelDiv = document.getElementById('phaseLabelDiv1');
    leftLabelDiv.id = 'phaseLabelDiv1';
  } catch (e) {
    var leftLabelDiv = document.createElement('div');
    leftLabelDiv.id = 'phaseLabelDiv1';
  }
  return;
  leftLabelDiv.innerHTML = '<div class="divstart" style="width:100%; height: 100%">'+
                                                          '<div class="labeldiv divstart">CLIENT</div>'+
                                                          '<div style="clear:both">'+'</div>'+
                                                          '<div class="spacerbreaker" style="width:92%"></div>' +
                                                          '<div class="valueDiv">' + propertyInfo['Client'] + '</div>' +
                                                          '<div class="valueDate hidedisable">' + propertyInfo['Service Company'] + '</div>' +
                                                        '</div>'+
                                                        '<div class="divlast" style="width:100%; height: 100%">'+
                                                        '<div class="labeldiv divlast">BROKER</div>'+
                                                          '<div style="clear:both">'+'</div>'+
                                                          '<div class="spacerbreaker" style="width:92%"></div>' +
                                                          '<div class="valueDiv">' + propertyInfo.Broker + '</div>' +
                                                          '<div class="valueDate hidedisable">' + propertyInfo['Asset Manager'] + '</div>' +
                                                        '</div>';


  try {
    var phaseLabelDiv = document.getElementById('phaseLabelDiv');
    phaseLabelDiv.id = 'phaseLabelDiv';
  } catch (e) {
    var phaseLabelDiv = document.createElement('div');
    var parentContainer = document.createElement('div');
    parentContainer.id = 'propertyTable';
    phaseLabelDiv.id = 'phaseLabelDiv';
    parentContainer.className = 'detailSection divright propertyTable';
    var divHeader = document.createElement('div');
    divHeader.className  = "headerLabel divmiddle broadcell";
    divHeader.innerHTML = document.getElementById('propertyLabel').innerHTML;
    divHeader.id = 'propertyLabel';
    grid.innerHTML = '';
    var parentContainerLeft = document.createElement('div');
    parentContainerLeft.id = 'propertyTable1';
    leftLabelDiv.id = 'phaseLabelDiv1';
    parentContainerLeft.className = 'detailSection divleft propertyTable';
    grid.appendChild(parentContainer);
    parentContainer.appendChild(phaseLabelDiv);
    grid.appendChild(parentContainerLeft);
    parentContainerLeft.appendChild(leftLabelDiv);
    grid.appendChild(divHeader);
  }
  phaseLabelDiv.innerHTML = '<div class="divstart" style="width:100%; height: 100%">'+
                                                          '<div class="labeldiv divstart">PHASE</div>'+
                                                          '<div style="clear:both">'+'</div>'+
                                                          '<div class="spacerbreaker" style="width:92%"></div>' +
                                                          '<div class="valueDiv">' + propertyInfo.Phase + '</div>' +
                                                          '<div class="valueDate hidedisable">' + propertyInfo.phaseDate + '</div>' +
                                                        '</div>'+
                                                        '<div class="divlast" style="width:100%; height: 100%">'+
                                                        '<div class="labeldiv divlast">STATUS</div>'+
                                                          '<div style="clear:both">'+'</div>'+
                                                          '<div class="spacerbreaker" style="width:92%"></div>' +
                                                          '<div class="valueDiv">' + propertyInfo.Status + '</div>' +
                                                          '<div class="valueDate hidedisable">' + propertyInfo.lastUpdate + '</div>' +
                                                        '</div>';

  console.log('\n\n\n----------HEIGHT of DATA DETAIL: ',
          phaseLabelDiv.children[0], '\n',
          phaseLabelDiv.children[0].offsetHeight,
          '\nVS. headerLabel height: ', document.getElementById('propIDLabel'),'\n',
          document.getElementById('propIDLabel').offsetHeight,
          '\nLineHeight: ', $('#propIDLabel').css('line-height').replace('px', ''),' lineheight\n\n\nNumber of Lines: ',
          document.getElementById('propIDLabel').offsetHeight / $('#propIDLabel').css('line-height').replace('px', '')
        );
  if(document.body.offsetWidth < 12000 || document.getElementById('propIDLabel').offsetHeight / $('#propIDLabel').css('line-height').replace('px', '') > 1){
    // enable the third row of date in the flanker details
    var dates= document.body.querySelectorAll('.valueDate.hidedisable');
    console.log('UNHIDE DATE DETAIL INFO : ', dates);
    dates.forEach((dateLabel)=>{
      dateLabel.classList.remove('hidedisable');
    });
  }else{
    var dates= document.body.querySelectorAll('.valueDate');
    console.log('HIDE ALL DATE DETAIL INFO : ', dates);
    dates.forEach((dateLabel)=>{
      dateLabel.classList.add('hidedisable');
    });
  }
}

function tableDetailGrid(){
  console.log('\n\n\nGRIDDING TABLE UNDER PROPERTY HEADER! ');
  var gridcells = document.querySelectorAll('.propertyTable');
  var grid = document.getElementsByClassName('detailsGrid')[0];
  console.log('SCREEN small : ', document.body.offsetWidth);
  var simplestatbar = document.createElement('div');
  if(gridcells.length > 0){
    gridcells.forEach((chi)=>{
      grid.removeChild(chi);
    });
    var propertyInfo = po_entry[0];
    var simplestatDIV = document.createElement('div');
    simplestatDIV.appendChild(simplestatbar);
    simplestatbar.innerHTML = '<div class="divstart" style="width:100%; height: 100%">'+
                                      '<div class="labeldiv divstart"><div class="paddDiv">CLIENT</div></div>'+
                                      '<div style="clear:both">'+'</div>'+
                                      '<div class="spacerbreaker" style="width:92%"></div>' +
                                      '<div class="valueDiv"><div class="paddDiv">' + propertyInfo['Client'] + '</div></div>' +
                                      '<div class="valueDate"><div class="paddDiv">' + propertyInfo['Service Company'] + '</div></div>' +
                                    '</div>'+
                                    '<div class="divmiddle" style="width:100%; height: 100%">'+
                                        '<div class="div1 divm divleft">'+
                                              '<div class="labeldiv"><div class="paddDiv">STATUS</div></div>'+
                                              '<div style="clear:both">'+'</div>'+
                                              '<div class="spacerbreaker"></div>' +
                                              '<div class="valueDiv"><div class="paddDiv">' + propertyInfo.Status + '</div></div>' +
                                              '<div class="valueDate"><div class="paddDiv">' + (propertyInfo['Phase'] || '') + '</div></div>' +
                                        '</div>' +
                                      '</div>' +
                                    '<div class="divlast" style="width:100%; height: 100%">'+
                                      '<div class="labeldiv divlast"><div class="paddDiv">BROKER</div></div>'+
                                        '<div style="clear:both">'+'</div>'+
                                        '<div class="spacerbreaker" style="width:92%"></div>' +
                                        '<div class="valueDiv"><div class="paddDiv">' + propertyInfo.Broker + '</div></div>' +
                                        '<div class="valueDate"><div class="paddDiv">' + propertyInfo['Asset Manager'] + '</div></div>' +
                                    '</div>';
    simplestatbar.id = "simplestats";
    grid.appendChild(simplestatDIV);
    simplestatDIV.id = "simplestatDIV";
  }else{
    // initPropFlankers(propertyInfo);
  }
}
function propTableResize(e){
  console.log('BODY DIV DETAIL RESIZING!!!');
  var gridcells = document.querySelectorAll('.propertyTable');
  var grid = document.getElementsByClassName('detailsGrid')[0];

  if(document.body.offsetWidth < 1200){
    return tableDetailGrid();
  }else{
    var propertyInfo = po_entry[0];
    var gri = getPropertyGrid();
    var gri2 = document.getElementById('simplestatDIV');
    // console.log('Property Grid retreived from expansions.js');
    if(!gri.table){
      console.log('\n\nInitialize Property Grid Call!');
      var propLabel = document.getElementById('propertyLabel').cloneNode(true);
      var detailsGrid = document.getElementsByClassName('detailsGrid')[0];
      return;
      detailsGrid.innerHTML = '';
      detailsGrid.parentNode.appendChild(propLabel);
      var propG = document.getElementById('propertyGrid');
      if(propG) {
        propG = propG.cloneNode(true);
        detailsGrid.parentNode.appendChild(propG);
      }
      detailsGrid.parentNode.removeChild(detailsGrid);
      return setPropertyGrid(propertyInfo);
    }else{
      console.log('INIT GRID 2!');
      return tableDetailGrid();
    }

    var simplestat = document.getElementById('simplestatDIV');
    if(simplestat){
      simplestat = simplestat.cloneNode(true);
      var propLabel = document.getElementById('propertyLabel').cloneNode(true);
      var detailsGrid = document.getElementsByClassName('detailsGrid')[0];
      var propTable = document.getElementById('property_grid').cloneNode(true);
      return;
      detailsGrid.innerHTML = '';
      detailsGrid.parentNode.appendChild(propLabel);
      var leftMost = document.createElement('div');
      leftMost.className = "divstart";
      leftMost.style.height= "100%";
      leftMost.style.width= "100%";
      leftMost.innerHTML = '<div class="labeldiv divstart"><div class="paddDiv">STATUS</div></div>'+
                      '<div style="clear:both">'+'</div>'+
                      '<div class="spacerbreaker" style="width:92%"></div>' +
                      '<div class="valueDiv"><div class="paddDiv">' + propertyInfo['Status'] + '</div></div>' +
                      '<div class="valueDate"><div class="paddDiv">' + propertyInfo.lastUpdate +'<span style=" float:right; top: -2px; padding-left: 8px; font-size: 70%;">(Last Updated)</span>'+ '</div>'+
                      '</div>';

      leftMost.style.title = "LastUpdate : " + propertyInfo.lastUpdate;
      console.log('\n\n\nPROP INFO DATES : ', propertyInfo);

      var rightMost = document.createElement('div');
      rightMost.className = "divend";
      rightMost.style.height= "100%";
      rightMost.style.width= "100%";
      rightMost.innerHTML = '<div class="labeldiv divend"><div class="paddDiv">PHASE</div></div>'+
                      '<div style="clear:both">'+'</div>'+
                      '<div class="spacerbreaker" style="width:92%"></div>' +
                      '<div class="valueDiv"><div class="paddDiv">' + propertyInfo['Phase'] + '</div></div>' +
                      '<div class="valueDate"><div class="paddDiv">' + propertyInfo.phaseDate +
                      '<span style=" float:left; top: -2px; padding-left: 8px; font-size: 70%;">(' + propertyInfo.Phase + ' Date)</span>'+ '</div>'+
                      '</div>';
      rightMost.style.title = propertyInfo['Phase'] + propertyInfo.phaseDate;
      // console.log('PROP INFO DATES ');
      detailsGrid.appendChild(rightMost);
    }
  }
  if(document.getElementById('propIDLabel').offsetHeight / $('#propIDLabel').css('line-height').replace('px', '') > 1){
    // enable the third row of date in the flanker details
    var dates= document.body.querySelectorAll('.valueDate.hidedisable');
    // console.log('UNHIDE DATE DETAIL INFO');
    dates.forEach((dateLabel)=>{
      dateLabel.classList.remove('hidedisable');
      dateLabel.classList.remove('nofiller');
    });
  }else{
    var dates= document.body.querySelectorAll('.valueDate');
    // console.log('HIDE ALL DATE DETAIL INFO : ', dates);
    dates.forEach((dateLabel)=>{
      dateLabel.classList.add('nofiller');
    });
  }
}

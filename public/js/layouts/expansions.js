var sampleProperty = {
  "Phase 1": '12/01/2017',
  "Phase 2": '12/15/2017',
  "Phase 3": '12/22/2017',
  "Phase 4": null,
  "OTB": null,
  "Completed": null
}
var thisDataTable = {};
var thisPropData = {};

function buildPhaseCard(){
  var createElement = document.createElement('div');

  createElement.id = 'PhaseDetails';
  createElement.className = 'expansion';


  // loop
  Object.keys(sampleProperty).forEach((phase)=>{
    var div = document.createElement('div');
    div.className = 'phases';
    div.id = phase+' option';
    if(sampleProperty[phase]){
      var textC = document.getElementById('Phase').querySelector('.quickdrop');
      console.log('\n\nFind MAtch: ', textC, textC.textContent);
      if(phase.toLowerCase() === textC.textContent.trim().toLowerCase()){
        console.log('\n\n\nMatch Found! \n', textC.textContent);
        div.className += ' selected';
      }
      div.innerHTML = "<span class='phaseField'>" + phase.toUpperCase() + "</span><span class='phaseDate'>" +
      sampleProperty[phase] +
      "</span>";
    }else{
      div.innerHTML = "<span>" + phase.toUpperCase() + "</span>";
    }

    // ADD EVENT LISTENER to change the value of the PropertyPhase Field;
    var id = div.id;
    div.addEventListener('click', function(e){
      var clickedPhase = document.getElementById('Phase').querySelector('.quickdrop');
      var img = document.getElementById('Phase').querySelector('.quickdrop img');
        document.getElementById('Phase').querySelector('.quickdrop').innerHTML = id.substring(0, id.indexOf(' option'));
        document.getElementById('Phase').querySelector('.quickdrop').appendChild(img);
        document.getElementById('Phase').querySelector('.quickdrop img').click();
    });
    createElement.appendChild(div);
  });

  // end loop

  return createElement;
}

function setWorkOrder(workOrderObj, currentWO, dropdownID){
	console.log('\n\n\n\n---------------------\n\n\nrefreshing references : ', workOrderObj, currentWO, workOrder);

  currentWorkOrder = workOrderObj;
  currentWOindex = currentWO;

	enableGallery(true);
	showReferences(true);
  console.log('\n\n--------------CURRENT WO : ', currentWorkOrder);
		document.body.querySelector('#workOrder label').innerHTML = "Work Order <span class='workOrderVal'>" + currentWorkOrder.work_order + '</span>';
		document.body.querySelector('#contractorRef label').innerHTML = "Contractor   <span class='contractorVal'>" + ' ' +currentWorkOrder.contractor + '</span>';

	var contractor = workOrderObj.contractor;
	var numWOs = 0;
	if(dropdownID === 'co_dropdown') {
		filterWOs(wo_list, workOrderObj.contractor, dropdownID);
	}

	console.log('refreshingPhotos : ', workOrderObj, dropdownID);

  var drop = document.getElementById(dropdownID);
	drop.className = drop.className.replace(/hidedisable/g, '');
	drop.className += ' hidedisable';
	console.log('dropdown to view : ', drop, drop.className);

  if(document.querySelectorAll('.selected').length != 0) refreshPhotos({work_order: workOrderObj.work_order, contractor: workOrderObj.contractor});
	return true;
}


function filterWOs(workOrders, contractor, dropdownID){
	var drop = document.getElementById('wo_dropdown');
	var dropSize = 0;
	var numWOs = 0;
	document.body.querySelectorAll('#wo_dropdown option').forEach((opt, index)=>{
		console.log('workOrder option: ', opt, index, '\n', workOrders[index], '\n\t VS: \n', contractor);
		var add = true;
    try{
      if(contractor && contractor != "null") add = false;
      woContractorTrim = workOrders[index].contractor.trim()
      if(!add) console.log('check for contractor: (', woContractorTrim.length, '=', contractor.trim().length, ')');
    }catch(e){
      woContractorTrim = 'null';
      console.log('\n\nContractor Null...sub a text value in for the null obj');
    }
		if(woContractorTrim.trim() === contractor) console.log('TRUE');
		if(add === false && woContractorTrim.trim() === contractor.trim()){
			add = true;
			numWOs ++;
			console.log('TRUE');
		}else{
			console.log('NO MATCH');
		}
		if(add){
			dropSize++;
			opt.classList.remove('hidedisable');
		}else{
			opt.classList.add('hidedisable');
		}
	});
	if(numWOs<2){
		drop.className = 'refDropdown hidedisable';
		disableListRef(['workOrder']);
	}else{
		enableListRef(['workOrder']);
	}
	if(numWOs === 2) console.log('Dropped WONums: ', numWOs);
	if(numWOs < 3) drop.size = numWOs;
	else drop.size = 3;
	return drop.size;
}

function showReferences(show, containerID){
	var unavails = [];
	if(containerID) unavails = document.querySelectorAll('div .jobList:not(#'+ containerID + ')');
	else unavails = document.querySelectorAll('div .jobList');
	console.log('ClassName ; ', unavails);
	unavails.forEach((div)=>{
		console.log('ClassName ; ', div)
		div.className = div.className.replace(/hidedisable/g, '');
		if(!show && div.id != 'contractorRef') div.className += ' hidedisable';
	});
}


function dropWorkOrders(container, workOrders, contractor){
	console.log('Drop Work Orders for Selection: ', container);

	document.body.querySelectorAll('.refDropdown:not(#'+container.id+')').forEach((dro)=>{
		dro.size = 0;
		dro.classList.remove('showing');
		dro.classList.add('hidedisable');
	});

	// showReferences(false, container.id); //hides the references that are not this container

  var droo = document.getElementById(container);
  if(container.id != 'workOrder') return $('#inputpicker-4').click();
  else return $('#inputpicker-3').click();

	var drop = document.getElementById(container.id).parentElement.getElementsByTagName('select')[0];
	console.log('Drop Work Orders for Contractor Selection: ', container, drop);
	drop.className = drop.className.replace(/hidedisable/g, '');
	console.log('dropdown to view : ', drop, drop.className, container.id);

	if(container.id === 'workOrder'){
		drop = filterWOs(workOrders, contractor, 'wo_dropdown');
	}else{
		if(drop.options.length > 3){
			console.log('Drop Size is greater than 2!', drop.size, ' convert to ', drop.options.length);
			drop.size = 3;
		}
		else drop.size = drop.options.length;
	}

	console.log('\n\nDropped WOs');
}


// -------------------------------------------------------------------------------------------------------------
function loadRefOpts(drop, list){
  return;
	console.log('Loading Work : ', drop, '\n\t :: ', list);

	var div = document.getElementById(drop);
	var workList= [];
	var textHTML = '';
	var contList = '';
	var numContractors = 0;
  var colist = [];
  var woList = [];
	list.forEach((wo, index)=>{
		if(drop === 'co_dropdown' && contList.indexOf(wo.contractor)===-1) {
			contList += wo.contractor;
			numContractors = numContractors + 1;
      colist.push({ind: index, text: wo.contractor, value:wo.work_order, description: wo.amount, date: wo.approved});
      woList.push({ind: index, text:wo.work_order, value:wo.contractor, description: wo.amount, date: wo.approved});
			console.log('added contractor: ', wo.contractor, numContractors);
		}else{
      colist.push({ind: index, text:wo.contractor, value: wo.work_order, description: wo.amount, date: wo.approved});
      woList.push({ind: index, text:wo.work_order, value:wo.contractor, description: wo.amount, date: wo.approved});
    }
	});
	div.id = drop;

	div.parentElement.appendChild(div);
	if(numContractors === 1){
		console.log('contractor = 1', numContractors, '\n', list);
		disableListRef(['contractorRef']);
		var wounset = true;
		list.forEach((w, index)=>{
			console.log('contractor : ', w.contractor, '  vs.  ', contList[index]);
			if(w.contractor === contList && wounset){									// wounset will stop the remaining workorders from firing.
				wounset = false;
        console.log('\nSET WORKORDER : contractor === contList && wounset : ', contList, wounset);
			}
		});
	}else{
    disableListRef(['workOrder']);
  }

  console.log('\n\n\nINIT multi-column dropdown');
  $('#wo_drop').inputpicker({
    data:woList,
    fields:[
      {name:'text',text:'WO'},
      {name:'value',text:'Contractor'},
      {name:'description', text:'Amount'},
      {name:'date', text: 'Approved'}
    ],
    autoOpen: true,
    headShow: true,
    fieldText : 'value',
    fieldValue: 'text'
  });
  console.log('\n\n\nINIT multi-column dropdown');
  $('#co_drop').inputpicker({
    data:colist,
    fields:[
      {name:'value',text:'WO'},
      {name:'text',text:'Contractor'},
      {name:'description',text:'Amount'},
      {name:'date', text: 'Approved'}
    ],
    autoOpen: true,
    headShow: true,
    fieldText : 'text',
    fieldValue: 'value'
  });

  $('#co_drop').on('change', function(e){
    console.log('\n\nSELECT TABLE changed : ', e.currentTarget);
    console.log(e.currentTarget.value, ' --> ', $('co_drop').textContent);
    console.log($('.inputpicker-active ')[0]);
    console.log(document.body.querySelectorAll('[data-value= \'' + e.currentTarget.value + '\']')[0]);
    var newCont = document.body.querySelectorAll('[data-value= \'' + e.currentTarget.value + '\']')[0].textContent.substring(e.currentTarget.value.indexOf(e.currentTarget.value) + e.currentTarget.value.length);
    newCont = newCont.substring(0, newCont.indexOf('$'));
    console.log('\n\nNew Contractor = ', newCont);
		document.body.querySelector('#contractorRef label').innerHTML = "Contractor   <span class='contractorVal'>" + ' ' + newCont + '</span>';

    if(e.currentTarget.id === 'co_drop') workorderByContractor(newCont);
  });

  $('#co_drop').on('change', function(e){
    console.log('\n\nSELECT WO changed : ', e.currentTarget);
    console.log(e.currentTarget.value, ' --> ', e.currentTarget.text);
    console.log($('.inputpicker-active ')[0]);
    console.log(document.body.querySelectorAll('[data-value= \'' + e.currentTarget.value + '\']')[0]);
    var newWO = document.body.querySelectorAll('[data-value= \'' + e.currentTarget.value + '\']')[0];
    newWO = newWO.innerHTML.toString().split("<td style=\"\"");
    console.log('\n\nNew WORK ORDER = ', newWO);

    newWO = newWO[1].substring(1);
    newWO = newWO.replace('</td>', '');
    console.log('NEW WO formatted = ', newWO,'\n\n');

    wo_list.forEach((woEnt, index)=>{
      console.log('ind : ', index);
      if(woEnt.work_order === newWO){
        console.log('\n\n\n\n\n\n\nMATCH FOUND! ', woEnt);
        currentWOindex = index;
        currentWorkOrder = woEnt;
      }
    });

  });

	console.log('Div OPTIONS : ', div.options);
	return div;
}

function workorderByContractor(contractorName){
  console.log('Filter Work Order by Contractor Name : ', contractorName);
  var relavants = [];
  currentWOindex = 0;
  var numWOs= 0;
  wo_list.forEach((woEntry, index)=>{
    if(woEntry.contractor === contractorName){
      numWOs ++;
      if(currentWOindex === 0) currentWOindex = index;
    }
  });
  showReferences(true);
  console.log('\n\nTotal number of workorders for this contractor : ', numWOs);
  if(numWOs > 1){
    enableListRef(['workOrder']);
  } else {
    enableListRef(['workOrder']);
  }
}

function enableGallery(yesno, photoLabel){
  var photosBar = document.getElementById('photosBar');

  var galsection = document.getElementById('photosBody');
  var photosect = document.getElementById('photo_section');
  console.log('\n\n\nENABLE GALLERY ???', yesno);
  try{
    console.log('Enable Gallery! ', yesno);
    if(yesno){
      photosect.classList.remove('hidedisable');
      if(galsection) {
        if(yesno) galsection.classList.remove('hidedisable');
      }
      if(photosBar) {
        if(yesno) photosBar.classList.remove('hidedisable');
      }
    }
    else{
      photosect.classList.add('hidedisable');
      if(galsection) {
        if(yesno) galsection.classList.remove('hidedisable');
      }
      if(photosBar) {
        if(yesno) photosBar.classList.remove('hidedisable');
      }
    }
    if(photoLabel) {
      console.log('\n\n\nPHOTO LABEL : ', photoLabel);
      if(photoLabel.indexOf('JOB PHOTOS')===-1) document.getElementById('photo_sectionLabel').classList.add('toUpper');
      else document.getElementById('photo_sectionLabel').classList.remove('toUpper');
      document.getElementById('photo_sectionLabel').textContent = photoLabel;
    }else document.getElementById('photo_sectionLabel').classList.remove('toUpper');

    adjustGallery();
  }catch(e){console.log('ERROR No gallery section found');}
}

function loadWorkOrders(list){
	console.log('Loading Work Orders', list);
	var drop = 'wo_dropdown';
	if(!list) return disableListRef(['workOrder', 'contractorRef']);
	else{
		var workOrders = [];
    var wo_table_entries = [];
    var allInvalid = {};
    allInvalid.approved = false;
    allInvalid.amount = false;
		list.forEach((rep)=>{
			console.log('WO: ',rep);
			if(rep.work_order){
				console.log('Valid WO: ',rep.work_order);
				workOrders.push(rep);
        var woEntry ={
          "WO": rep.work_order,
          "Contractor": rep.contractor,
          "Amount":rep.amount,
          "Date": rep.approved,
          "Date1": rep.received,
          "Status": rep.status
        }
        if(rep.approved != 'Invalid Date' && allInvalid.approved === false) allInvalid.approved = true;
        if(rep.amount != 'NaN' && rep.amount != '$0.00' && allInvalid.amount === false) allInvalid.amount = true;
        if(rep.amount === 'NaN') woEntry.Amount = '$0.00';
        if(rep.approved.toLowerCase() === 'invalid date') woEntry.Date = '';
        if(rep.received.toLowerCase() === 'invalid date') woEntry.Date1 = '';
        wo_table_entries.push(woEntry);
			}
		});
    amountClass = "";
    approvedClass = "";

    (function () {
      setDataTable($('#wo_table').DataTable({
        columns: [
          {data: "Contractor", class:"col1 contractorCell", value: "Contractor"},
          {data: "Amount", title: "Approved AMT", class:"midtext amountCell"},
          {data: "Date1", class: amountClass+" midtext date1Cell", name: "Received", title: "Bid Received"},
          {data: "Date", class: amountClass+" midtext date2Cell", name: "Approved", title: "Approved Date"},
          {data:"Status", class:"midtext statusCell", title:"Job Status"},
          {data: "WO", class:"statusValue woID"}
        ],
        api: true,
        responsive: true,
          columnDefs: [
              { responsivePriority: 1, targets: 0 },
              { responsivePriority: 2, targets: -1 }
          ],
        data: wo_table_entries,
        lengthChange: false,
        paging: false,
        searching: false,
        stateLoaded: function(settings, data){
          console.log('\n\nDATATABLES state Loaded!: ', e, '\nSettings : ', settings, '\n\nData: ', data);
        },
        scrollX:        true
      }));
      var table = getDataTable();

      table.rows().every( function () {
          this.child('<td>Row details for row: '+this.index() + '</td>');
          var childCell = this.child()[0].children[0];
          console.log('\n\nchildrow - cell: ', childCell,'\nchildrow: ', childCell);
          childCell.parentNode.classList.add('childCell');
          childCell.classList.add('childCellRowIndex');
      } );

      $('#wo_table tbody').on( 'click', 'tr', function () {
        console.log('childrow selected THIS : ', this);
          var child = table.row( this ).child;
          console.log('childrow selected! : ', child);
          if (child.isShown() ) {
              child.hide();
          }
          else {
            console.log('childrow not shown');
            try {
              console.log('table rows : ', document.body.querySelectorAll('tbody tr:not(.childCell)').length);
              table.rows().every(function(){
                // console.log('child: ', this, this.child());
                console.log('child isShown : ', table.row(this).child.isShown());
                if(table.row(this).child.isShown()) table.row(this).child.hide();
              });
            } catch (e) {
              console.log(e);
            } finally {
              // console.log('now show child: ', child);
            }
          }
      } );

      // console.log('\n\n\nWO_TABLE FINAL INIT : ', wo_table_entries);
      document.body.querySelectorAll('#wo_table tbody tr').forEach((row)=>{
        console.log('\nTable Row : ', row);
        row.addEventListener('click', changeWorkOrder);
      });
    })();

    wo_list = list;
    this.activeOrders = list;

		return workOrders;
	}
}


function setDataTable(dt){
  this.thisDataTable = dt;
}
function getDataTable(){
  return this.thisDataTable;
}
function isHidden(elementID){
  var ele = document.getElementById(elementID);
  var ishidden = true;
  if(ele){
    console.log('\n\n\nELEMENT idHidden() : ', elementID);
    if(ele.className.indexOf('hidedisable')>-1) ishidden = true;
    else ishidden = false;
  }
  return ishidden;
}

function changeWorkOrder(e){
  console.log('CHANGE THE SELECTED WORK ORDER! \nTABLE ROW: ', e.currentTarget);
  showHidePhotoBar(true);
  if(isHidden('photo_section')){
    var gel = getGalleryTag();
    // console.log('\n\n\nChange Gallery and init Photo Section! : ', gel);
    enableGallery(true);
    if(gel === undefined || gel.length === 0) {
      gel = 'Before';
      // console.log('\n\nchange gallery id to click : ', gel);
    }
    var clickButton = $('#'+ gel.substring(0,1).toUpperCase() + gel.substring(1));
    console.log('\n\nChange Gallery from WO trigger: ', clickButton);
    clickButton.click();
  }else{
    enableGallery(true);
  }
  showHidePeriods(true);


  var photoLabel = document.getElementById('photo_sectionLabel');
  var params = e.currentTarget.childNodes;
  var wo_ent = {};
  params.forEach((ent)=>{
    console.log('\n\n\nworkOrder!!! ', ent);
    if(ent.className.indexOf('woID') > -1) wo_ent.WO = ent.textContent;
    else if(ent.className.indexOf('statusCell')>-1) wo_ent.Status = ent.textContent;
    else if(ent.className.indexOf('date1Cell')>-1) wo_ent.Date1 = ent.textContent;
    else if(ent.className.indexOf('dateCell')>-1) wo_ent.Date = ent.textContent;
    else if(ent.className.indexOf('amountCell')>-1) wo_ent.Amount = ent.textContent;
    else if(ent.className.indexOf('contractorCell')>-1) wo_ent.Contractor = ent.textContent;
  });

  clearWorkOrderSelection();

  e.currentTarget.classList.add('currentselection');
  e.currentTarget.children[0].classList.add('selectedspacer');
  console.log('\n\nTable Row Selected! Assign Work Order : ', wo_ent);
  if(currentWorkOrder.work_order === wo_ent.WO && currentWorkOrder.work_order)return;
  currentWorkOrder = {
    work_order: wo_ent.WO,
    contractor: wo_ent.Contractor,
    amount: wo_ent.Amount,
    approved: wo_ent.Date,
    received: wo_ent.Date1,
    status: wo_ent.Status
  };

  var gal = getSubPeriod();
  if(!gal) gal = getGalleryTag().substring(0, 1).toUpperCase() + getGalleryTag().substring(1);
  setFilteredCountLabel({count:0, gal});


  if(photoLabel) photoLabel.innerHTML = "JOB PHOTOS <span style='font-size: 80%'>(WO# " + currentWorkOrder.work_order + ")</span>";
  try{
    getDataTable().columns.adjust().responsive.recalc();
  }catch(ert){
    console.log('\n\n\nERROR retreiving data table! ', getDataTable().columns.adjust(), '\n\nERROR: ', ert);
  }
  if(document.querySelectorAll('.selected').length != 0){
    console.log('refreshingPhotos : ? : ', currentWorkOrder);
    enableGallery(true);
    refreshPhotos({work_order: currentWorkOrder.work_order, contractor: currentWorkOrder.contractor});
  }else{
    enableGallery(true);
  }
}


function clearWorkOrderSelection(){
  var selections = document.querySelectorAll('.currentselection');
  if(selections){
    selections.forEach((sel)=>{
      sel.classList.remove('currentselection');
      sel.children[0].classList.remove('selectedspacer');
    });
  }
}

function changeWorkDetails(woToSet){
  console.log('MOUSEOVER OPTION BLAAAAAA');
  console.log(woToSet);
  document.getElementById('approvedDate').textContent = woToSet.approved;
  document.getElementById('repairType').textContent = woToSet["Repair Type"];
  document.getElementById('amountLabel').textContent = woToSet.amount;
}
function clearWorkDetails(){
  if(currentWorkOrder){
    document.getElementById('approvedDate').textContent = currentWorkOrder.approved;
    document.getElementById('repairType').textContent = currentWorkOrder["Repair Type"];
    document.getElementById('amountLabel').textContent =currentWorkOrder.amount;
  }else{
    document.getElementById('approvedDate').textContent = "Approved Date";
    document.getElementById('repairType').textContent = "Repair Type";
    document.getElementById('amountLabel').textContent = "Job Cost";
  }
}

function enableListRef(referenceIDs){
	console.log('Enabling referenceIDs : ', referenceIDs);
		referenceIDs.forEach((referenceID)=>{
			var wobox = document.getElementById(referenceID);
      try {
        wobox.classList.remove('unavail');
        wobox.getElementsByClassName('expand')[0].classList.remove('unavail');
        // wobox.getElementsByClassName('expand')[0].addEventListener('click', expandDetail);
        wobox.getElementsByClassName('expand')[0].style.pointerEvents = "none";
        wobox.getElementsByClassName('expand')[0].addEventListener('click', expandDetail);
        wobox.addEventListener('click', function(e){
          e.stopPropagation();
          wobox.getElementsByClassName('expand')[0].click();
        });
      } catch (e) {
        console.log('\nERROR No referenceID element : ', referenceID, '\n\nERROR : ', e);
      } finally {
      }

			// to remove any event listeners without having to id their functions, clone/replace the node
		});
}
function disableListRef(referenceIDs){
  // return;
	console.log('disabling referenceIDS : ', referenceIDs)
		referenceIDs.forEach((referenceID)=>{
			var wobox = document.getElementById(referenceID);
      // if(!wobox) return;
			wobox.classList.add('unavail');
			wobox.getElementsByClassName('expand')[0].classList.add('unavail');
			// to remove any event listeners without having to id their functions, clone/replace the node
			var newbox = wobox.cloneNode(true);
			wobox.parentNode.replaceChild(newbox, wobox);
			newbox.style.pointerClicks = 'none';
			newbox.parentNode.style.pointerClicks = 'none';
			newbox.title = 'Please Register a ' + referenceID + ' at arcvmapp.com';
		});
}

var thisPropertyGrid = {};
function getPropertyGrid(){
  console.log('getProperty Grid\nreturn this.thisPropertyGrid : ', this.thisPropertyGrid);
  return this.thisPropertyGrid;
}
function setPropertyGrid(propertyInfo) {
  console.log('\n\n\nSETTING PROPERTY GRID! ', propertyInfo);
  var propE = [{
    Status: propertyInfo.Status,
    Phase: propertyInfo.Phase,
    "Asset Manager": propertyInfo["Asset Manager"],
    Broker: propertyInfo.Broker
  }];

  var status_div = document.getElementById('status_grid');
  var phase_div = document.getElementById('phase_grid');
  var am_div = document.getElementById('am_grid');
  var broker_div = document.getElementById('broker_grid');

  Object.keys(propE[0]).forEach((key)=>{
    var keyID = key;
    if(keyID === "Asset Manager") keyID = "am";
    keyID = keyID.toLowerCase() + '_grid';
    var div = document.getElementById(keyID);
    console.log('\n\n\nProperty Keys! ' + key + ': \ninto div : ', div, propE[0]);
    if(div)div.querySelector('.field_value label').textContent = propE[0][key];
  });
  // return;

  try {
    document.getElementById('propertyGrid').classList.remove('hidedisable');
    this.thisPropertyGrid =  $('#propertyGrid').DataTable({
        columns: [
          {data: "Status", class:"", value: "Status"},
          {data: "Phase", title: "Phase", class:""},
          {data: "Asset Manager", class:"", name: "AM", title: "AM Name"},
          {data: "Broker", class: "", name: "Broker", title: "Broker Name"}
        ],
        api: true,
        responsive: true,
          columnDefs: [
              { responsivePriority: 1, targets: 0 },
              { responsivePriority: 2, targets: -1 }
          ],
        data: propE,
        lengthChange: false,
        paging: false,
        searching: false,
        stateLoaded: function(settings, data){
          console.log('\n\nPROPERTY HEAD DATATABLES state Loaded!: ', e, '\nSettings : ',
          settings, '\n\nData: ', data);
        },
        scrollX:        false
      });
  } catch (e) {
    console.log('\n\n\nDataTables Component Error : ', e);
  } finally {}
}

/*
	Assemble an option tag element to fit the work orders list
	return the tag html
*/
function woHTML(wo, refID){
	if(refID === 'co_dropdown') return '<option><span class="contractorOption"> ' + wo.contractor + '</span></option>';
	return '<option>'+
            wo.work_order +
          '</option>';
    }

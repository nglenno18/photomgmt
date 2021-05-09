var sampleProperty = {
  "Phase 1": '12/01/2017',
  "Phase 2": '12/15/2017',
  "Phase 3": '12/22/2017',
  "Phase 4": null,
  "OTB": null,
  "Completed": null
}

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
	console.log('refreshing references : ', currentWO, workOrder);

  currentWorkOrder = workOrderObj;
	enableGallery();
	showReferences(true);
	var drop = document.getElementById(dropdownID);
	drop.className = drop.className.replace(/hidedisable/g, '');
	drop.className += ' hidedisable';
	console.log('dropdown to view : ', drop, drop.className);
	currentWOindex = currentWO;
	// document
		document.body.querySelector('#workOrder label').innerHTML = "Work Order <span class='workOrderVal'>" + workOrderObj.work_order + '</span>';
		document.body.querySelector('#contractorRef label').innerHTML = "Contractor   <span class='contractorVal'>" + ' ' +workOrderObj.contractor + '</span>';
    // document.body.querySelector('#orderDetail label').innerHTML = "Contractor   <span class='contractorVal'>" + ' ' +workOrderObj.contractor + '</span>';
    // document.body.querySelector('#order label').innerHTML = "Contractor   <span class='contractorVal'>" + ' ' +workOrderObj.contractor + '</span>';

	var contractor = workOrderObj.contractor;
	var numWOs = 0;
	if(dropdownID === 'co_dropdown') {
		filterWOs(wo_list, workOrderObj.contractor, dropdownID);
	}
	// workOrders.forEach((wo)=>{
		// if(wo.contractor === contractor) numWOs++;
	// });

	console.log('refreshingPhotos : ', workOrderObj, dropdownID);
	// clearGallery();

	if(document.querySelectorAll('.selected').length != 0) refreshPhotos({work_order: workOrderObj.work_order, contractor: workOrderObj.contractor});
  changeWorkDetails(currentWorkOrder);
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


function dropContractors(container, workOrders){

}

function dropWorkOrders(container, workOrders, contractor){
	console.log('Drop Work Orders for Selection: ', container, workOrders);
	document.body.querySelectorAll('.refDropdown:not(#'+container.id+')').forEach((dro)=>{
		dro.size = 0;
		dro.classList.remove('showing');
		dro.classList.add('hidedisable');
	});

	showReferences(false, container.id); //hides the references that are not this container
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
	// drop.className += ' showing';

	console.log('\n\nDropped WOs : ', drop);
}

function loadRefOpts(drop, list){
	console.log('Loading Work Contractors: ', list);

	var div = document.getElementById(drop);
	var workList= [];
	var textHTML = '';
	var contList = '';
	var numContractors = 0;
	list.forEach((wo, index)=>{
		if(drop === 'co_dropdown' && contList.indexOf(wo.contractor)===-1) {
			contList += wo.contractor;
			numContractors = numContractors + 1;
			textHTML += woHTML(wo, drop);
			console.log('added contractor: ', wo.contractor, numContractors);
		}
		else textHTML += woHTML(wo, drop);
	});
	div.id = drop;
	// div.className = div.className.replace(/.hidedisable/g, '');
	div.innerHTML = textHTML;
	console.log('loading work textHTML : ', textHTML);

	// document.getElementById('coWrapper').appendChild(div);
	div.parentElement.appendChild(div);
	if(numContractors === 1){
		console.log('contractor = 1', numContractors, '\n', list);
		disableListRef(['contractorRef']);
		var wounset = true;
		list.forEach((w, index)=>{
			console.log('contractor : ', w.contractor, '  vs.  ', contList[index]);
			if(w.contractor === contList && wounset){									// wounset will stop the remaining workorders from firing.
				wounset = false;
				return setWorkOrder(w, index, 'co_dropdown');
			}
		});
	}else{
    // setWorkOrder(list[0], 0, drop);
    disableListRef(['workOrder']);
  }

  var newOpts = document.body.querySelectorAll('#wo_dropdown option');
  console.log('\n\nSELECT TAG : ', newOpts);
  newOpts.forEach((opt, optIndex)=>{
    console.log('\n\nOPTION NUMBER : ', optIndex, '\n\t:: ', opt);
    opt.addEventListener('mouseover', function(e){
      changeWorkDetails(wo_list[optIndex])
    });
    opt.addEventListener('mouseout', clearWorkDetails);
  });

	div.addEventListener("change", function(e){
	console.log('\n\nAdd Event Listener to the Dropdown WorkOrders options: ');
		var targ = e.currentTarget;
		console.log('change Property: ', e);
		console.log('currentTarget : ', e.currentTarget);
		// if(targ.className.indexOf('current')>-1) targ.className = targ.className.substring(0, targ.className.indexOf('current')) + targ.className.substring(targ.className.indexOf('current')+ 'current'.length-1);
			document.querySelectorAll('option .current').forEach((row)=>{
					row.classList.remove('current');
			});
		currentWOindex = div.selectedIndex;
		console.log('SELECTED PROPERTY : ', currentProperty.property);
		console.log('refreshing selected wo: ', currentWOindex, drop);
					 setWorkOrder(wo_list[currentWOindex], currentWOindex, drop);
	});
	console.log('Div OPTIONS : ', div.options);
	div.querySelectorAll('option').forEach((opt)=>{
		opt.addEventListener('click', function(){
			console.log('clicked !');
			if(div.options[div.selectedIndex] === opt){
					showReferences(true);
				// clearGallery();
				// setWorkOrder(wo_list[div.selectedIndex], currentWOindex, drop);

				div.size = 0;
				div.classList.remove('showing');
				div.classList.add('hidedisable');
			}
		});
	});
	return div;
}

function enableGallery(){
  try{document.getElementById('photo_section').classList.remove('hidedisable');}catch(e){console.log('ERROR No gallery section found');}
}

function loadWorkOrders(list){
	console.log('Loading Work Orders', list);
	var drop = 'wo_dropdown';
	if(!list) return disableListRef(['workOrder', 'contractorRef']);
	else{
		enableListRef(['workOrder', 'contractorRef']);
		var workOrders = [];
		list.forEach((rep)=>{
			console.log('WO: ',rep);
			if(rep.work_order){
				console.log('Valid WO: ',rep.work_order);
				workOrders.push(rep);
			}
		});

		var div = loadRefOpts(drop, workOrders);

		console.log('Loading Work Order :', list, list.workOrders);
		wo_list = list;
				loadRefOpts('co_dropdown', workOrders);

				var currentWork = wo_list[0];
		currentWOindex = 0;
		console.log('Current Work Order : ', currentWork);
		// document.getElementById('wo_dropdown').
		// setWorkOrder(wo_list[currentWOindex], currentWOindex, drop);
		return workOrders;
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
			wobox.classList.remove('unavail');
			wobox.getElementsByClassName('expand')[0].classList.remove('unavail');
      // wobox.getElementsByClassName('expand')[0].addEventListener('click', expandDetail);
      wobox.getElementsByClassName('expand')[0].style.pointerEvents = "none";
      wobox.getElementsByClassName('expand')[0].addEventListener('click', expandDetail);
      wobox.addEventListener('click', function(e){
        e.stopPropagation();
        wobox.getElementsByClassName('expand')[0].click();
      });

			// to remove any event listeners without having to id their functions, clone/replace the node
		});
}
function disableListRef(referenceIDs){
	console.log('disabling referenceIDS : ', referenceIDs)
		referenceIDs.forEach((referenceID)=>{
			var wobox = document.getElementById(referenceID);
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

/*
	Assemble an option tag element to fit the work orders list
	return the tag html
*/
function woHTML(wo, refID){
	if(refID === 'co_dropdown') return '<option><span class="contractorOption"> ' + wo.contractor + '</span></option>';
	return '<option>'+
          // '<span class="woOption"> '+
            wo.work_order +
          // '</span>' +
              // ' || ' +
          // '<span class="contractorOption"> ' + wo.contractor + '</span>'+
          '</option>';
    }

function buildFolderList(serverList){
	console.log('\n\n\n\n---------------------\n\n\nBuilding Folder List : ',serverList);

  var photoTypeWrapper = document.getElementById('photo_type');
  // photoTypeWrapper.removeChild(document.getElementById('folder_table'));

  var div = document.createElement('div');
  div.className = 'listwrap';
  photoTypeWrapper.appendChild(div);
  var div2 = document.createElement('div');
  div2.className = 'listwrap';
  div2.style.backgroundColor = "white";
  div2.style.paddingTop = "5px";
  div2.style.paddingBottom = "5px";
  div2.style.margin= "0 auto";
  div2.style.width="calc(100% - 6px);";
  div2.style.boxShadow = "inset 0px 2px 1px 0px var(--lightgrey)";
  div.appendChild(div2);

  serverList.forEach((folder)=>{
    var folderOption = document.createElement('div');
    folderOption.id = "folder_" + folder.TagName;
    folderOption.className = "folderOption";
    folderOption.innerHTML = '<div class="folderCheck" >'+
      '<input id="checkBox_' + folder.TagName + '" name="checkbox" class="checkboxClass" type="checkbox" value="Select All"/>' +
      // addFolderName
			"<div class='folderName' id='" + folder.TagName + "'><label>" + folder.TagName + "</label>"+ "</div>" +
      '</div>' + //end foldercheck
      '<div class="folderDescription">' + folder.Description + '</div>';
    div2.appendChild(folderOption);
    folderOption.addEventListener('mouseover', function(e){
      folderOption.classList.add('hovering');
    });
    folderOption.addEventListener('mouseout', function(e){
      folderOption.classList.remove('hovering');
    });
    folderOption.addEventListener('click', function(e){
      var getFolder = getFolderTag();
      var foldID = folderOption.id.replace('folder_', '');
      if(getFolder){
        console.log('getFolder.toUpperCase() = ', getFolder.toUpperCase(), '\nfolderoption.id.toUpperCase() = ', foldID.toUpperCase());
        if(getFolder.toUpperCase() === foldID.toUpperCase()){
          return;
        }
      }
      selectFolder(folderOption);
      folderOption.classList.remove('hovering');
    });

    if(folder.TagName.indexOf("Inspection") >-1){
      folderOption.classList.add('unavail');
    }else if(folder.TagName.indexOf("BPO") >-1 || folder.TagName.indexOf("Sale") >-1){
      folderOption.classList.add('hidedisable');
			folderOption.classList.add('p_level');
    }
		if(folder.TagName === "Initial Property") folderOption.classList.add('p_level');
  });
  var fillerdiv = document.createElement('div');
  fillerdiv.className = "fillerdiv";
  fillerdiv.style = "height: 5px; background-color:transparent;";


	targetID = 'folder_Initial Property';
	var wos = getWorkOrders();
	console.log('\n\n\nWork Order Length : ', wos);
	if(!wos) disableFolder(['Bids & Repairs']);
	else if(getUserType() === "Contractor") targetID = 'folder_Bids & Repairs';
  document.getElementById(targetID).click();
  // photoTypeWrapper.appendChild(fillerdiv);
	mobilizeTime();
}

function selectFolder(folderOption){
  console.log('SELECT FOLDER OPTION : ', folderOption.id);
  if(folderOption.className.indexOf('checked')>-1){
    folderOption.classList.remove('checked');
    folderOption.querySelector('input').checked = false;
    return clearParams();
  }else{
    var allchcked = document.getElementById('photo_type').querySelectorAll('.folderOption.checked');
    if(allchcked){
      allchcked.forEach((chk)=>{
        selectFolder(chk);
      });
    }
    var jobSelections = document.getElementById('job_selection').querySelectorAll('.currentselection');
    jobSelections.forEach((jobselected)=>{
      console.log('\n\nPrevious selection : ', jobselected);
      jobselected.classList.remove('.currentselection');
    });
    folderOption.classList.add('checked');
    folderOption.querySelector('input').checked = true;
    var newID = folderOption.id.replace('folder_', '');
    setFolderParam(newID);
    console.log('\n\n\nGET FOLDER TAG : ', getFolderTag());
    showhideParams();
  }
}

function setFolderParam(folderText){
  this.folderTagName = folderText;
}

/*
	Disables a Photo Type based on returned data from the initial pageload
	EX: Disable Bidrepairs when Number of WO = 0
*/
function disableFolder(folderTextArray){
	console.log('\n\nDisableFolder! : ', folderTextArray);
	folderTextArray.forEach((id)=>{
		var tab = document.getElementById('folder_' + id);
		console.log('\n\nDisableFolder Complonent found : ', tab);
		tab.classList.add('restrict');
	});
}

function clearWorkOrder(){
  currentWorkOrder = {};
  clearWorkOrderSelection();
  clearGallery();
	console.log('\n\n\ndisable GALLERY');
  enableGallery(false);
}

function clearParams(){
  console.log('\n\n\nUNSELECT ALL PARAMS: ');
  clearTabSelected();
  clearWorkOrder();
}

function showhideParams(){
  // TAB-SPECIFIC Methods
  var wolist = document.getElementById('propertyRefs');
  var photoLabel = document.getElementById('photo_sectionLabel');
  //JOB SELECTED
  var tagButton = getFolderTag().toUpperCase();
  console.log('\n\nADJUST PARAMETER ELEMENT DISPLAY! ');
  if(tagButton === "BIDS & REPAIRS" || tagButton === "INSPECTIONS"){
    document.getElementById('job_selection').classList.remove('hidedisable');
    currentWorkOrder = {};
    updateTagSettings(tagButton);
  }else{
    document.getElementById('job_selection').classList.add('hidedisable');
  }

  if(tagButton === "BIDS & REPAIRS"){
		clearTabSelected();
		clearTimeSelected();
		showHidePeriods({hide: ['Before']});
    console.log('ShowHide BIDS/Repairs Table!');
    photoLabel.textContent = "Job Photos";
    showHidePhotoBar(false);
		console.log('\n\n\ndisable GALLERY!!');

    enableGallery(false);
    console.log('\n\n\n\nREVIEAL DATA TABLE : ', $('#wo_table').scroller);
    // $('#wo_table').css('display', 'table');
    console.log('\nData Table Recalc Responsive : ', getDataTable().responsive);
    // getDataTable().columns.adjust();
    wolist.classList.remove('hidedisable');
    wolist.querySelectorAll('h2')[0].classList.add('hidedisable');
    try{
      $('#wo_table').DataTable().columns.adjust().responsive.recalc();
      getDataTable().columns.adjust().responsive.recalc();
    }catch(ert){
      console.log('\n\n\nERROR retreiving data table! ', getDataTable().columns.adjust(), '\n\nERROR: ', ert);
    }
  }else{
    wolist.classList.add('hidedisable');
    updateTagSettings(tagButton);
  }


  // BROKER SELECTED
  if(tagButton === "INITIAL PROPERTY"){
    clearWorkOrder();
    photoLabel.textContent = "Initial Property Photos";
		photoLabel.classList.add('p-level');
    clearGallery();
    clearTabSelected();
		clearTimeSelected();

    enableGallery(true);
    showHidePeriods({show: ['Before'], hide: ['During', 'After']});
		$('#period_Before').click();
  }else{
		photoLabel.classList.remove('p-level');
    // photoLabel.textContent = "Photo Section";
    // enableGallery(false);
		clearWorkOrder();
		photoLabel.textContent = "Photo Section";
		clearGallery();
		clearTabSelected();
		enableGallery(false);
		if(tagButton === "BIDS & REPAIRS"){
			var t_wo = getWorkOrders();
			var wo_l = t_wo.length;
			console.log('\n\nTagButton Selected = Bids & Repairs\nWOLIST = 1: ', t_wo, '\nwo_length: ',wo_l);
			if(wo_l=== 1){
				var woI = t_wo[0];
				var woRow = document.querySelector('#wo_table td.contractorCell');
				console.log('\n\nTagButton Selected = Single-Row WOLIST : ', woRow);
				woRow.click();
			}
		}
  }
}

function showHidePhotoBar(yesno){
  var photob = document.getElementById('photosBar');
  if(yesno === true) photob.classList.remove('hidedisable');
  else photob.classList.add('hidedisable');
}

function showHidePeriods(params){
  console.log('\n\n\nENABLE/DISABLE buttons: ', params);
  if(params.hide){
    console.log('HIDE BUTTON TABLS FOR THIS FOLDER SELECTION :\n', params.hide);
    params.hide.forEach((id)=>{
			var tab = document.getElementById(id.toLowerCase()+'_tab');
			tab.classList.add('unavail');
			var check = document.getElementById('period_'+id);
			check.classList.add('unavail');
			if(id.toLowerCase() === 'during') hideFolderPeriods(true);
    });
  }
  if(params.show){
    params.show.forEach((id)=>{
			var tab = document.getElementById(id.toLowerCase()+'_tab');
			tab.classList.remove('unavail');
			var check = document.getElementById('period_'+id);
			check.classList.remove('unavail');
			if(id.toLowerCase() === 'during') hideFolderPeriods(false);
    });
  }
  if(!params.show && !params.hide) showHidePeriods({show:['Before', 'During', 'After']});
  if(!params) showHidePeriods({hide:['Before', 'During', 'After']});
}

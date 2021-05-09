var filteredCount = 0;
var subPeriod = '';

function initTimeList(){
	console.log('\n\n\n\n---------------------\n\n\nINIT Time (PHOTO Phase) List : ');

  var photoTypeWrapper = document.getElementById('timeselection');
  // photoTypeWrapper.removeChild(document.getElementById('folder_table'));

  var div = document.createElement('div');
  div.className = 'listwrap';
  photoTypeWrapper.appendChild(div);
  var div2 = document.createElement('div');
  div2.className = 'listwrap';
	div2.id = 'time_options';

  div2.style.backgroundColor = "white";
  div2.style.paddingTop = "5px";
  div2.style.paddingBottom = "5px";
  div2.style.margin= "0 auto";
  div2.style.width="calc(100% - 6px);";
  div2.style.boxShadow = "inset 0px 2px 1px 0px var(--lightgrey)";
  div.appendChild(div2);

  var fillerdiv = document.createElement('div');
  fillerdiv.className = "fillerdiv";
  fillerdiv.style = "height: 5px; background-color:transparent;";

  // photoTypeWrapper.appendChild(fillerdiv);

	if(getUserType() === "Contractor"){
		console.log('\n\n\n\ngetUserType != "Contractor" :: ', getUserType());
		document.getElementById('gallery_menu').classList.remove('hidedisable');
	}
}

function addTimeOption(folder){
	console.log('\n\nAdd to time period : ', folder);
	var div2 = document.getElementById('time_options');

	var folderOption = document.createElement('div');
	folderOption.id = "period_" + folder.TagName;
	folderOption.className = "folderOption";
	folderOption.innerHTML = '<div class="folderCheck" >'+
		// add checkbox
		'<input id="checkBox_' + folder.TagName + '" name="checkbox" class="checkboxClass" type="checkbox" value=""/>' +
		// add folderName
		"<div class='folderName' id='" + folder.TagName + "'><label>" + folder.TagName + "</label>"+ "</div>" +
		//add count_space
		"<div class='foldercount' id='" + folder.TagName + "_count" + "'><label>" + '' + "</label>"+ "</div>" +
		'</div>'; //end foldercheck
		// '<div class="folderDescription">' + folder.Description + '</div>';
	if("BEFOREDURINGAFTER".indexOf(folder.TagName.toUpperCase())===-1) {
		folderOption.classList.add('sub_folder');
		var spacebreak = document.createElement('div');
		spacebreak.style.height = '1px';
		spacebreak.className = 'spacebreak';
		div2.appendChild(spacebreak);
		div2.appendChild(folderOption);
		div2.appendChild(spacebreak);
	}else{
		div2.appendChild(folderOption);
	}

	folderOption.addEventListener('mouseover', function(e){
		folderOption.classList.add('hovering');
	});
	folderOption.addEventListener('mouseout', function(e){
		folderOption.classList.remove('hovering');
	});
	folderOption.addEventListener('click', function(e){
		var getFolder = getGalleryTag();
		console.log('Gallery Tag : ', getFolder);
		var foldID = folderOption.id.replace('period_', '').toLowerCase();
		if(getFolder){
			console.log('getFolder.toUpperCase() = ', getFolder.toUpperCase(), '\nfolderoption.id.toUpperCase() = ', foldID.toUpperCase());
			if(getFolder.toUpperCase() === foldID.toUpperCase()){
				console.log('\n\n\nREPEAT GALLERY TAB CLICK: ', getFolder);
				// uncheckTimePeriod(folderOption);
				return;
			}
		}
		selectTime(folderOption);
		folderOption.classList.remove('hovering');
	});
}

/*
	Unchecks all active time selection folders/subfolders
*/
function clearTimeSelected(){
	var options = document.getElementById('timeselection').querySelectorAll('.checked');
	setFilteredCountLabel({count:0}); 	// clear the image count
	try {
		options.forEach((ea)=>{
			ea.classList.remove('checked');
			uncheckTimePeriod(ea);
		})
	} catch (e) {
		console.log('\n\ncould not clear time selection : ', e);
	}
	this.currentGallery = '';
}


function getGalleryTag(){
	return this.currentGallery;
}

function setGalleryTag(gTag){
	console.log('\n\n\n\nSET GALLERY TAG : ', gTag);
	var gID = gTag.replace("period_", "");
	gTag = gID.toLowerCase();
	var taglist = "";
	setSubPeriod();
	clearActiveTags(); // clears any other big3 tags that might still be applied/hidden
	if(gTag === "punchlist" || gTag === "agent_progress" || gTag === "gc_progress"){
		clearActiveTags(); // clears any other big3 tags that might still be applied/hidden
		addActiveTags([gTag]);
		setSubPeriod(gID);
		gTag = "during";
	}else if(gTag === 'agent_qc' || gTag === 'gc_completed'){
		console.log('\n\n\nQC GALTAG SELECTED');
		clearActiveTags(); // clears any other big3 tags that might still be applied/hidden
		addActiveTags([gTag]);
		setSubPeriod(gID);
		gTag = "after";
	}
	console.log('Gallery Tag : ', gTag, '\n\nGALLERY TAGLIST : ', this.activeTagList);
	this.currentGallery = gTag;
	clearTabSelected();
	document.getElementById(gTag+'_tab').classList.add('selected');

	// document.getElementById(gTag + '_tab').click();
}

/*
	sets or clears the sub period
	contains
*/
function setSubPeriod(gTag){
	if(!gTag) gTag = '';
	this.subPeriod = gTag;
}
function getSubPeriod(){
	return this.subPeriod;
}


/*
	Uncheck + Hide Folder Count
*/
function uncheckTimePeriod(element){
	console.log('\n\nUncheck Time Period : ', element);
	element.classList.remove('checked');
	element.querySelector('input').checked = false;
	var foldercount = element.querySelector('.foldercount');
	if(foldercount) foldercount.textContent = '';
}
/*
	Uncheck All Time Periods/Sub Periods + Hide Image Counts
*/
function clearTimePeriod(){
	console.log('Clear Time Periods');
	var allchecked = document.getElementById('timeselection').querySelectorAll('.folderOption.checked');
	console.log('\n\n\nCLEAR TIME PERIOD CALL : ', allchecked);
	if(allchecked.length > 0){
		allchecked.forEach((ele)=>{
			uncheckTimePeriod(ele);
		});
	}
}
/*
	Uncheck only SUB Periods + Hide Image Counts
*/
function clearSubPeriods(){
	console.log('Clear Sub Period');
	var allchecked = document.getElementById('timeselection').querySelectorAll('.sub_folder.checked');
	clearActiveTags();
	if(allchecked.length > 0){
		allchecked.forEach((ele)=>{
			uncheckTimePeriod(ele);
		});
	}
}

function selectTime(folderOption){
  console.log('SELECT FOLDER OPTION : ', folderOption.id);
	var allsubs = document.getElementById('timeselection').querySelectorAll('.sub_folder.checked');
	var allchcked = document.getElementById('timeselection').querySelectorAll('.folderOption:not(.sub_folder).checked');
	var sublength = 0;
	if(allsubs) sublength = allsubs.length;
	var isSub = false;
	var isChecked = false;
	var refresh = false;
	var autoset = null;

	// if subfolder:
	if(folderOption.className.indexOf('sub_folder') > -1){
		isSub = true;
	}
	if(folderOption.className.indexOf('checked') >-1) isChecked = true;

	// Uploads can be just DURING
	// if(isChecked === true && isSub === false) return;
	// Uploads MUST have a Folder Tag in During
	if(isChecked === true) return;

	var foID = folderOption.id.toLowerCase().replace('period_', '').replace('_tab','');
	if(isSub === true){
		if(getUserType() === "Contractor") return;
		if(getGalleryTag().toUpperCase() != "DURING" && (foID === 'agent_progress'||foID === 'gc_progress' || foID ==="punchlist")){
			clearTimePeriod();
			refresh = true;
		} else if(getGalleryTag().toUpperCase() != "AFTER" && (foID === 'agent_qc' || foID === 'gc_completed')){
			console.log('\n\n\n\nCLEAR TIME PERIOD !\nWAS : ', getGalleryTag(), '\n\nNOW : ', foID);
			clearTimePeriod();
			refresh = true;
			clearSubPeriods();
		}else clearSubPeriods();

		console.log('\n\n\nIS SUB FOLDER! :', isSub, '\n\nischecked = ', isChecked);
		if(isChecked){
			console.log('is Checked = true : ', folderOption);
			uncheckTimePeriod(folderOption);
			showHiddenThumbnails(folderOption.id);
		}else{
			console.log('\n\n\nsubfolder (clear time period) NOT checked! check it :', foID);
			if(foID === 'agent_qc' || foID === 'gc_completed') baseID = 'period_After';
			else baseID = 'period_During';
			console.log('FOLDER to CHECK : (clear time period) ', baseID);
			var duringtab = document.getElementById(baseID);
			duringtab.classList.add('checked');
			duringtab.querySelector('input').checked = true;
			if(getUserType() != "Contractor"){
				folderOption.classList.add('checked');
				folderOption.querySelector('input').checked = true;
			}

			// addActiveTags([folderOption.id.toLowerCase().replace('period_', '').replace('_tab','')]);

			// refreshGallery(folderOption.id);
			// refresh = true;
			showHideImageTags(folderOption.id, true);
		}
	}else{
		// IF TIME FOLDER:
		console.log('REAL GALLERY FOLDER!');

		if(folderOption.id === "period_During" || folderOption.id === "period_After"){
			if(isChecked) allsubs.forEach((sub)=>{
				uncheckTimePeriod(sub);
			});
			else if(folderOption.id === "period_During" && getUserType() === "Broker") autoset = "agent_progress";
			else if(folderOption.id === "period_During" && getUserType() != "Broker") autoset = "gc_progress";
			else if(folderOption.id === "period_After" && getUserType() != "Contractor") autoset = "agent_qc";
			else if(folderOption.id === "period_After" && getUserType() === "Contractor") autoset = "gc_completed";
			else autoset = false;
			// if(getUserType() === "Contractor"){autoset = false}
		}

		if(isChecked){
			uncheckTimePeriod(folderOption);
		}else{
			console.log('time period not checked (isChedked = False) : ', folderOption);
			clearTimePeriod();
			folderOption.classList.add('checked');
			folderOption.querySelector('input').checked = true;
			refresh = true;
		}
	}
	var jobSelections = document.getElementById('job_selection').querySelectorAll('.currentselection');
	jobSelections.forEach((jobselected)=>{
		console.log('\n\nPrevious selection : ', jobselected);
		// jobselected.classList.remove('.currentselection');
	});
	var newID = folderOption.id.replace('period_', '').replace('_tab', '');
	// if(refresh === true)
	console.log('\n\ntrigger getGal tag = ', newID);
	setGalleryTag(newID);

	console.log('\n\nautoset filter function prerefresh : ', autoset);
	if(autoset) {
		console.log('\n\n\nautoset : ', autoset);
		if(autoset === "agent_qc") autoset = "Agent_QC";
		if(autoset === "gc_completed") autoset = "GC_Completed";
		if(autoset.indexOf('_progress')>-1) autoset = autoset.replace('_progress', '_Progress');
		if(autoset.indexOf('_completed')>-1) autoset = autoset.replace('_completed', '_Completed');
		if(autoset.indexOf('_')===2) autoset = autoset.substring(0,2).toUpperCase() + autoset.substring(2);
		console.log('\n\n\nAUTOSET ELEMENT ID : ', autoset, '\n\n');
		var tab = document.getElementById('period_' + autoset.substring(0,1).toUpperCase() + autoset.substring(1));
		tab.classList.add('checked');
		tab.querySelector('input').checked = true;
		addActiveTags([autoset.toLowerCase()]);
		setSubPeriod(autoset.toLowerCase());
	}
	if(refresh === true) refreshGallery(folderOption.id, autoset);

	if(!isSub)mobilizeTime();
	console.log('\n\n\nGET Gallery TAG : ', getGalleryTag());
}

function refreshGallery(fID, autoset){
	console.log('\n\n\n\n\n\n\n\nREFRESH GALLERY : foldeID : ', fID,'\n\n\nautoset filter function: ', autoset);
	fID = fID.replace('_tab', '').replace('period_', '').toLowerCase();
	var timeperiod = document.getElementById('timeselection').querySelectorAll('.checked');
	try {
		timeperiod.forEach((chk)=>{
			console.log('Time Period Checked : ', fID);
		});
	} catch (e) {
		console.log('\n\n\nNo Time Periods Checked!');
	} finally {
		console.log('workOrder page filter images by work order : ')
			var workOrder = currentWorkOrder.work_order;
			var cont = currentWorkOrder.contractor;
			var folder = getFolderTag();
			var gal = getGalleryTag();
			console.log('workOrder Page filter image by :', workOrder);
			if((gal != 'bids & repairs' && workOrder) || folder==='Initial Property') fetchPhotos({id: propID, gallery: gal, work_order: workOrder, contractor: cont, folder}, loadPhotos);
			// , function(){
			// 	console.log('\n\nAUTOSET : ', autoset);
			// 		if(autoset) {
			// 			setGalleryTag(autoset);
			// 			showHideImageTags(autoset, true);
			// 		}
			// }
	}
}

function showHiddenThumbnails(title){
	var tagname = title.toLowerCase().replace('period_', '').replace('_tab','');
	console.log('\n\n\n\nSHOW/HIDE ImageTags: ', tagname, '\n true/false: ');
	var allhidden = document.body.querySelectorAll('.hideThumbnail');
	console.log('\n\nSHOW/HIDE list : ', allhidden);
	var filCount = 0;
	try {
		// if(allhidden.length > 0){
			allhidden.forEach((thumb)=>{
				console.log('\n\nshow/hide imagetags : ', thumb.id, '\nvs. ', activeThumbnails);
				var id = parseForGoogleID(thumb.id);
				if(activeThumbnails[id]){
					console.log('activeThumbails[thumb.id] = \n', activeThumbnails[id]);
					if(activeThumbnails[id].tags.indexOf(tagname) === -1){
						thumb.classList.remove('hideThumbnail');
						filCount ++;
					}
				}
			});
		// }
	} catch (e) {
		console.log('\n\n\nSHOW/HIDE error: ', e);
	} finally {
		adjustGallery();
		setFilteredCountLabel({count:filcount, gal:title.replace('period_', '')});
	}
}


//////////// SET IMAGE COUNTS INSIDE THIS FILTERATION METHOD
function showHideImageTags(title, yesno){
	// setFilteredCountLabel();
	var tagname = title.toLowerCase().replace('period_', '').replace('_tab','');

	console.log('\n\n\n\nSHOW/HIDE ImageTags: ', tagname, '\n true/false: ', yesno);
	var allthumbnails = document.body.querySelectorAll('.thumbnail');
	// filcount = Object.keys(activeThumbnails).length;
	filcount = 0;
	console.log('\n\nSHOW/HIDE list : ', allthumbnails, '\nFILCOUNT = ', filcount);
	try {
		// if(allhidden.length > 0){
			allthumbnails.forEach((thumb)=>{
				console.log('\n\nshow/hide imagetags : ', thumb, '\nvs. ', activeThumbnails);
				var id = parseForGoogleID(thumb.id);
				if(id) id = id.replace('_thumbnail', '');
				console.log('id = ', id);
				if(activeThumbnails[id]){
					console.log('activeThumbails[thumb.id] = \n', activeThumbnails[id]);
					if(activeThumbnails[id].tags.indexOf(tagname) > -1){
						console.log('\n\nTAG MATCHED! : ', tagname);
						thumb.classList.remove('hideThumbnail');
						filcount ++;
						//if thumbnail is within view
						var containerDim = document.getElementById('dropdown_gallery').getBoundingClientRect();
						console.log('L-img subperiod gallery bounding client Rectangle : ', containerDim), 'L-img thumb.offsetTo = ', thumb.offsetTop;
						if(thumb.offsetTop < containerDim.bottom){
							$(function() {
								$(thumb.querySelector('img.lazy')).Lazy({
										event : "manualTrigger"
								});
							});
						}

						$(thumb.querySelector('img.lazy')).trigger("manualTrigger");
					}
					else thumb.classList.add('hideThumbnail');
				}
			});
			// if(filCount > 0)
			console.log('\nshow/hide image count : ', filcount);
		// }
	} catch (e) {
		console.log('\n\n\nSHOW/HIDE error: ', e);
	} finally {
		// if(getUserType() === "Contractor") setImageCountLabel({count:imageCount,  gallery: currentGallery.replace('_tab', '').toLowerCase()})
		setFilteredCountLabel({count:filcount, gal:title.replace('period_', '')});

		adjustGallery();
	}
}

function setFilteredCount(count){
	this.filteredCount = count;
}
function getFilteredCount(){return this.filteredCount;}

function clearWorkOrder(){
  currentWorkOrder = {};
  clearWorkOrderSelection();
  clearGallery();
  enableGallery(false);
	console.log('\n\n\ndisable GALLERY AND WORKORDER');
}

function clearParams(){
  console.log('\n\n\nUNSELECT ALL PARAMS: ');
  clearTabSelected();
  clearWorkOrder();
}

function hideFolderPeriods(yesno){
	console.log('HIDE SUBFOLDERS (During Tab Only)!');
	var list = document.getElementById('timeselection').querySelectorAll('.sub_folder');
	console.log('\n\nList of SUBFOLDERS to Hide/Show: ', list);
	list.forEach((ent)=>{
		console.log('Hide SUB-FOLDER :  ', ent.id, '\njquery div : ', $('#' + ent.id));
		if(yesno === true) $('#' + ent.id)[0].classList.add('unavail');
		else ent.classList.remove('unavail');
	})
}

function resizePeriods(show){
	if(getUserType() === "Contractor") show = false;
	var list = document.getElementById('timeselection').querySelectorAll('.sub_folder');
	list.forEach((ent)=>{
		if(show === false) $('#' + ent.id)[0].classList.add('hidedisable');
		else ent.classList.remove('hidedisable');
	})
}

function showHidePhotoBar(yesno){
  var photob = document.getElementById('photosBar');
  if(yesno === true) photob.classList.remove('hidedisable');
  else photob.classList.add('hidedisable');
}

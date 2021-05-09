function buildTagList(serverList){
	console.log('\n\n\n\n---------------------\n\n\nBuilding TAG List : ',serverList);

  // var tagListWrapper = document.getElementById('tag_selection');
	var tagListWrapper = document.getElementsByClassName('listwrap_outer')[0];


	var div = document.createElement('div');
	div.className = 'listwrap_inner';
	tagListWrapper.appendChild(div);
	// attachFillerDiv(div, 'var(--highlightshade)');

	if(getUserType() === 'Repair Specialist' || true) {
		console.log('init Time Selection List: ', initTimeList());
		addTimeOption({TagName: 'Before'});
		addTimeOption({TagName: 'During'});
	}

  serverList.forEach((folder)=>{
    var folderOption = document.createElement('div');
    folderOption.id = "tagbox_" + folder.TagName;
    folderOption.className = "tagOption";
    folderOption.innerHTML = ''+
			'<div class="tagCheck" >'+
      "<div class='tagName' id='" + folder.TagName + "'><label>" + folder.TagName + "</label>"+ "</div>" +
			'<input id="tagcheck_' + folder.TagName + '" name="checkbox" class="checkboxClass" type="checkbox" value="Select All"/>' +
      '</div>';

		if(folder.TagName === "Broker" || folder.TagName === "Asset Manager") folderOption.classList.add('tag_invalid');

		if(folder.OrderNum < 5){
			folderOption.classList.add('j_level');
			if(getUserType() === 'Repair Specialist' || true){
				console.log('trigger add to Time Selection');
				if(folder.TagName === 'Agent_QC'){
					addTimeOption({TagName: 'After'});
					addTimeOption(folder);
				}else addTimeOption(folder);
			}
		}else{
			div.appendChild(folderOption);
		}
		if(folder.TagName === "QC"){
			console.log('\n\n\nQC TAG TRIGGERED!: ', folderOption);
			// attachFillerDiv(div, 'var(--highlightshade)');
		}

    folderOption.addEventListener('mouseover', function(e){
      folderOption.classList.add('hovering');
    });
    folderOption.addEventListener('mouseout', function(e){
      folderOption.classList.remove('hovering');
    });
    folderOption.addEventListener('click', function(e){
      selectTag(folderOption);
      folderOption.classList.remove('hovering');
    });
  });

	if(getUserType() === 'Repair Specialist' || true) {
		console.log('init Time Selection List: ');
		// addTimeOption({TagName: 'After'});
	}

	attachFillerDiv(tagListWrapper);
}


function attachFillerDiv(toDiv, colour){
	var fillerdiv = document.createElement('div');
	fillerdiv.className = "fillerdiv";
	fillerdiv.style = "height: 5px; background-color:transparent;";
	if(colour) fillerdiv.style.backgroundColor = colour;
	toDiv.appendChild(fillerdiv);
}

function buildSearchBar(){
  // var searchdiv = document
}



function selectTag(folderOption){
  console.log('SELECT FOLDER OPTION : ', folderOption.id);
  if(folderOption.className.indexOf('checked')>-1){
    folderOption.classList.remove('checked');
    folderOption.querySelector('input').checked = false;
  }else{
    folderOption.classList.add('checked');
    folderOption.querySelector('input').checked = true;
  }
}

function updateTagSettings(folderOption){
	var big3 = document.body.querySelectorAll('.j_level');
	console.log('\n\n\nUPDATE TAGStatus : ', big3);
	try{
		if(folderOption.toUpperCase() === "INSPECTIONS" || folderOption.toUpperCase() === "BIDS & REPAIRS"){
			big3.forEach((tag)=>{
				tag.classList.remove('checked');
				tag.classList.remove('tag_invalid');
			});
		}else{
			big3.forEach((tag)=>{
				tag.classList.add('tag_invalid');
				tag.classList.remove('checked');
			});
		}
	}catch(e){
		console.log('\n\nERROR: no p-level tags were found!',e);
	}
}


function clearActiveTags(){
	this.activeTagList = [];
}
function addActiveTags(taglist){
	console.log('addActiveTags : ', taglist);
	if(taglist.length >0){
		taglist.forEach((tag)=>{
			this.activeTagList.push(tag);
		});
		return true;
	}
}

/*
	1. EXPLICITLY PUSHES (commits) all selected tags to the activeTagList variable
*/
function pushActiveTags(){
	var allactives = document.body.querySelectorAll('.tagOption.checked');
	var activetext = "";
	if(allactives){
		var outof = allactives.length;
		var temptags = [];
		allactives.forEach((activetag, index)=>{
			activetext = activetext + activetag.id.replace('tagbox_', '');
			temptags.push(activetag.id.replace('tagbox_', ''));
			if(index != outof-1) activetext = activetext + ':::';
		});
		addActiveTags(temptags);
		return activetext;
	}
}

/*
	1. EXPLICITLY PUSHES (commits) all selected tags to the activeTagList variable
				- does this by calling pushActiveTags();
	2. Runs through activeTagList, returning the string-formatted array of tags to return to user as final list
*/
function getActiveTags(){
	pushActiveTags();
	var activetext = "";

	try {
		if(this.activeTagList.length > 0){
			var outof = this.activeTagList.length;
			this.activeTagList.forEach((tag)=>{
				activetext = activetext + tag;
				if(index != outof-1) activetext = activetext + ':::';
			});
		}
	} catch (e) {
		console.log('\n\n\nNO ACTIVE TAGS in upload!');
	}

	// TESTING for ":::"
			// activetext = activetext + ":::" ;

	if(activetext) {
		console.log('\n\ngetActiveTags()\nPUSHING ACTIVE TAGS : ', activetext, '');
		var lastDelim = activetext.substring(activetext.length-3);
		var trimmedText = activetext.substring(0, activetext.length-3);
		// console.log('getActiveTags() --> ', trimmedText, '\nlast3Chars --> ', lastDelim);
		if(lastDelim === ":::") activetext = trimmedText;
	}

	return activetext;
}

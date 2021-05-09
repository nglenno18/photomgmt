var searchType = "all";
var searchURL = ".././search/properties";
(function(){
	console.log('\nSearch type: ', searchType,'\n', window.location);
	if(window.location.pathname === "/myProperties"){
		searchType = "myProperties";
		searchURL = ".././search/myProperties"
	}
})();

initializeSearchBar = function(e, property){
	console.log('initialize SearchBar: ', property);
	var searchbar = document.getElementById('searchbar');

	if(currentProperty) searchbar.innerHTML = currentProperty.property;
	var searchClick = document.querySelector('#searchBarContainer img:not(#homeImage)');
	// searchbar.addEventListener('change', function(e){
	try {
		var searchHome = document.getElementById('homeImage');
		searchHome.addEventListener('mouseover', function(e){
			// searchHome.src = '.././images/homeImage_pressed.png';
			searchHome.classList.add('hovered');
		});
		searchHome.addEventListener('mouseout', function(e){
			// searchHome.src = '.././images/homeImage_simple.png';
			searchHome.classList.remove('hovered');
		});
		searchHome.addEventListener('click', function(e){
			return window.location.href = '.././propertySearch';
		});
	} catch (ee) {
		console.log('Search HOME button not available on this page');
	}
	// });
	// if(!e){
	// 	searchbar = cloneElement(searchbar);
	// 	searchClick = cloneElement(searchClick);
	// }
	console.log('Searchbar initializing Click Action: ', searchClick);
	searchClick.addEventListener('click', function(e){
		var searchTerm = searchbar.value;
				document.getElementById('property_dropdownContainer').innerHTML = '';
				currentArray = {};

		console.log('searchbar active ::', searchTerm);
		searchProperty(searchTerm, function(properties){
			console.log('Test property Search: ', 'belvedere\n', properties);
		});
	});

	searchbar.addEventListener('keypress', function(e){
		if(searchbar.value.length === 0){
			searchClick.style.opacity = '0.5';
			document.getElementById('property_dropdownContainer').innerHTML = '';
			currentArray = {};
		}else searchClick.style.opacity = '1.0';

		console.log('key: ', e.keyCode);
		switch(e.keyCode){
			case 13: return searchClick.click();
			break;
			case 40: 			// down arrow
				return downSearch();
			break;
			case 39:
				return upSearch();
			break;
		}
	});

	//initialize the key-arrow presses
	searchbar.addEventListener('keydown', function(e){
		console.log('key: ', e.keyCode);
		switch(e.keyCode){
			case 40: 			// down arrow
				return optionsIndex = downSearch(optionsIndex);
			break;
			case 39:
				return upSearch();
			break;
		}
	});

	searchbar.focus();
}


initializePropertyLists = function(e){
	var displayDetails = false;
	var i = 0;
	var displayListen = function(e){
		console.log('window listener...', displayDetails, e.srcElement);
		if(displayDetails === true && e.srcElement.id != 'searchSum'){
			document.getElementById('searchDetails').classList.add('hidedisable');
			e.currentTarget.classList.remove('clicked');
			displayDetails = false;
			i = 0;
			document.body.removeEventListener('click',this);
		}else{
			console.log('ELSE ...', displayDetails, '\n', i);
			i++;
		}
	}

	document.getElementById('searchSum').addEventListener('click', function(e){
			console.log('Summary Clicked...\nSHOW DeTAILS!');
			if(displayDetails === false){
				document.getElementById('searchDetails').classList.remove('hidedisable');
				e.currentTarget.classList.add('clicked');
				displayDetails = true;
				document.body.addEventListener('click', displayListen);
			}
			else{
				document.getElementById('searchDetails').classList.add('hidedisable');
				e.currentTarget.classList.remove('clicked');
				displayDetails = false;
			}
	});



	document.getElementById('homePage').classList.remove('hidedisable');
	document.getElementById('myProperties').classList.remove('hidedisable');
	if(searchType === "all"){
		searchHeader = "All Active Properties";
		document.getElementById('homePage').classList.add('currentSearch');
		document.getElementById('myProperties').classList.remove('currentSearch');
		document.getElementById('myProperties').addEventListener('click', function(e){
			return window.location.href= '.././myProperties';
		});
	}else{
		searchHeader = "My Properties";
		document.getElementById('myProperties').classList.add('currentSearch');
		document.getElementById('homePage').classList.remove('currentSearch');
		document.getElementById('homePage').addEventListener('click', function(e){
			return window.location.href= '.././propertySearch';
		});
	}

	document.getElementById('searchHeader').textContent = searchHeader;
}

collectProperties = function(searchURL, element, action){
	if(!element) element = document.getElementById('property_select2');
	if(!action) action = null;

	$.ajax({
		type:'GET',
		dataType: "json",
		contentType: "application/json",
		url: searchURL,
		success: function(successresult){
			initializeListeners();
			thisUser = successresult.userData;
			if(thisUser.user_type === 'Contractor' || thisUser.user_type === 'Client'){
				document.getElementById('homePage').classList.add('hidedisable');
				document.getElementById('myProperties').classList.add('hidedisable');
			}
			console.log('Successful GET request!\n\tRESULT : \n', successresult.properties.length, '\nUser Retreived');
			document.getElementById('searchSum').textContent = successresult.properties.length + " Properties";
			document.getElementById('searchDetails').innerHTML =
								"<span id='user_type'>"+ successresult.userData.user_type + " </span>"+
								"<span id='user_name'>"+ successresult.userData.user_name + " </span>";

			var successresult = successresult.properties;
			successresult.forEach((res, i)=>{
				loadSelectOption(res, element, navigateProperty);
				currentArray[res.property] = res.Property_key || res.UniqueID;
				if(i === successresult.length-1) {
					console.log('INDEX : ', i);
					$('#property_select2').val('');

					$('#property_select2').on('select2:open', function(){
						console.log('\n\n\nSELECT2 opened!');
						console.log($('.select2-selection'));
						document.getElementById('detailsContainer').style.opacity = '0.3';
						document.getElementsByClassName('select2-search__field')[0].classList.add('focusedSearch');
						document.getElementsByClassName('select2-results')[0].classList.add('focusedSearch');

						var tempSearchBox =document.querySelector('.select2-selection');
						tempSearchBox.style.display= "none";
						var container =document.querySelector('.select2-dropdown');
						var searchField =document.querySelector('.select2-search__field');
						var magGlass =document.querySelector('#magGlass');

						magGlass.style.zIndex = '101';
						container.style.top  = '-24px';
						searchField.style.borderRadius = '20px 0px 0px 20px';

						var resopts = $('.select2-results')[0];
						console.log('\n\nSearchbar ', document.getElementById('searchBarContainer').style, '\n\nHeight calc : ', resopts.style.height);
						var searchb = document.getElementById('searchBarContainer');
						searchb.style.height = '600px';
									(Number(searchb.style.height.replace("px", '')) + resopts.offsetHeight)+'px';
						console.log('\n\nSearchbar 2 ', container.offsetHeight);
					});


					$('#property_select2').on('select2:close', function(){
						console.log('\n\n\nSELECT2 closed!');
						document.getElementById('detailsContainer').style.opacity = '1';
						var tempSearchBox =document.querySelector('.select2-selection');
						tempSearchBox.style.display= "block";
						var container =document.querySelector('.select2-dropdown');
						var searchField =document.querySelector('.select2-search__field');
						var magGlass =document.querySelector('#magGlass');

						var searchb = document.getElementById('searchBarContainer');
						searchb.style.height = '49px';

						magGlass.style.zIndex = '0';
					});

					$('#property_select2').on('change', function(e){
						console.log(e.target);
						console.log('\n\nSelected Property : ', document.getElementById('property_select2')[document.getElementById('property_select2').selectedIndex]);
						var changedVal = document.getElementById('property_select2')[document.getElementById('property_select2').selectedIndex].id;
						if(changedVal.indexOf('#')>-1){
							changedVal = changedVal.replace(/#/g, '!!!!');
						}
						return window.location.href = '.././upload/'+ encodeURIComponent(changedVal);
					});
				}
			});
		},
		error: function(errResult){
			console.log('FAILED GET request\n\tError : \n', errResult);
		}
	});
	return true;
}



propertySelected = function(item){
  console.log('Property Selected : ', item);
  var itemID = item.id.substring(0,item.id.indexOf('__item'));
  window.location.href = './properties/'+itemID;
}

loadSelectOption = function(item, element, action, hide){
	if(!element) element = document.getElementById('property_select2');
	var ele = document.createElement('option');
	ele.text = item.property || item.Property;
	ele.id = item.UniqueID || item.Property_key;
	if(!action) ele.id = ele.id + '--in-form' + (Math.random()*1000)+1
	ele.title = ele.text;
	if(hide) ele.classList.add('hidedisable');
	element.add(ele);
	if(action) 	ele.addEventListener('click', action);
}

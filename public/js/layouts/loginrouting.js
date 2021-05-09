var themeColor = {
	r: 107,
	g: 206,
	b: 229
}


function informationPane(profile){
console.log('\n\n\nUSER REQUEST FAIL: Profile: ', profile);
	document.getElementById('request_click').addEventListener('click', transitionToForm);
}

function setPageTitle(titleText){
	console.log('\n\n\n\nSetting page title : ', titleText);
	document.title = titleText;
	console.log('Page Title Set');
}


function transitionToForm(back){
	var current = document.querySelectorAll('.error_detail, #request_click');
	setPageTitle('User Request Form');
	var hiddenForms = document.querySelector('.form_container.hidedisable');
	var mainContainer = document.getElementById('main_container');
	mainContainer.classList.add('form_pane');
	console.log('hiddenForms : ', hiddenForms);
	try {
		document.getElementById('form_click').classList.remove('hidedisable');
		mainContainer.querySelector('.header1').textContent = "  Access Request";
		mainContainer.querySelector('.header2').textContent = "Submit a Request to access Constructive PhotoMgmt";
		current.forEach((form)=>{
			if(form.classList)form.classList.add('hidedisable');
		});
		if(hiddenForms)hiddenForms.classList.remove('hidedisable');
		document.getElementById('backBTN').classList.remove('hidedisable');
		document.getElementsByClassName('popup')[0].classList.add('nobottom');
	} catch (e) {
		console.log('\n\nCannot unhide form element: ', e);
	} finally {}
}

/*
	- unhides all elements from the description pane
	- logs which PANE
	- hides elements from form pane
*/
function backClick(){
	setPageTitle('Error Occured');
	var mainContainer = document.getElementById('main_container');
	mainContainer.classList.remove('form_pane');
	var hidden = document.getElementsByClassName('error_detail')[0];
	hidden.classList.remove('hidedisable');
	mainContainer.querySelector('.header1').textContent = "   An Error Occured While Logging In";
	mainContainer.querySelector('.header2').textContent = "The email did not match any Constructive Accounts";
	document.getElementById('form_click').classList.add('hidedisable');
	document.getElementById('backBTN').classList.add('hidedisable');
	document.getElementById('request_click').classList.remove('hidedisable');
	document.getElementById('form_request_container').classList.add('hidedisable');
	// document.getElementById('try_again').classList.add('hidedisable');
	document.getElementsByClassName('popup')[0].classList.remove('nobottom');

}

function initializePopup(e){
	console.log('\n\n\n\n\nINITIALIZE POPUP FORM : ', e);
  console.log(e.sessionStorage, '\n\nparams: ', e.params);
	var firstName, lastName, emailAddress;
	firstName = document.getElementsByClassName('firstName')[0].id;
	lastName = document.getElementsByClassName('lastName')[0].id;
	emailAddress = document.getElementsByClassName('emailID')[0].id;
	emailAddress = document.getElementsByClassName('emailID')[0].id;
	buildRequestForm({firstName, lastName, emailAddress});
	informationPane({firstName, lastName, emailAddress});
	return;
  window.alert('------------------------\n'+
              '[' + firstName + ' ' +
                    lastName + ']\n' +
              '[' +
              emailAddress +
              ']\n'+
              '------------------------\n\nGoogle Account is not Registered through Constructive\nPlease Try Again...');
  console.log('e', e);

  // window.location.href = '/auth/google';
}


function buildRequestForm(options){
	var emailEle = document.getElementById('email_field');
	var companyEle = document.getElementById('company_field');
	var nameEle = document.getElementById('name_field');


	emailEle.placeholder = options.emailAddress;
	console.log('\n\nbuildRequest Form : ', options.emailAddress, '\n\nplaceholder element : ', emailEle.style.value);

	initializeInfo();
	// HANDLE THE FUNCTION BEFORE THE SUBMIT!
	document.getElementById('form_click').addEventListener('click', function(e){
		// e.preventDefault();
		console.log('\n\n\n\nFORM SUBMISSION :! cancel out of it');
		console.log('\n\n\n\n');
		var company_Val = companyEle.value;
		// var email_Val = emailEle.textContent || options.emailAddress;
		var email_Val = emailEle.value;
		var name_Val = nameEle.value;
		name_Val = name_Val.trim();
		console.log('\n\n\n\nFinal Form Submission : ', e, '\n\ncompany_Val : ', company_Val, '\nemail_Val : ', email_Val);

		var reject = false;

		//VALIDATE EMAIL
		if(email_Val === ''){
				emailEle.textContent = emailEle.placeholder;
				emailEle.value = emailEle.placeholder;
				email_Val = emailEle.value;
			}
		if(email_Val === '' ||
			email_Val.indexOf('@')<2 ||
			email_Val.lastIndexOf('.') <= (email_Val.indexOf('@')+2)||
			(email_Val.length - email_Val.lastIndexOf('.')) < 2){
				console.log('\n\n\nEmail Val : ', email_Val);
				console.log('\n\nEMAIL VAL . LENGTH : ', email_Val.length);
				console.log('emailVal (@) :', email_Val.indexOf('@'));
				console.log('emailVal (.) :', email_Val.lastIndexOf('.'));
				console.log('\n\nemailval @ - . \t ', email_Val.length - email_Val.lastIndexOf('.'));
				console.log('email_Val.lastIndexOf(.) <= (email_Val.indexOf(@)+2): ', (email_Val.lastIndexOf('.') <= (email_Val.indexOf('@')+2)));
				console.log('\n\n(email_Val.length - email_Val.lastIndexOf(.)) < 2 : ', ((email_Val.length - email_Val.lastIndexOf('.')) < 2));
				reject = true;
				rejectSubmit('email');
		}else{
			validSubmit('email');
		}

		//VALIDATE INDIV Name
		if(name_Val === '' || name_Val.indexOf(' ')<1 || name_Val.length < 3){
			console.log('\n\n\nINVALID NAME! : ', name_Val);
			reject = true;
			rejectSubmit('name');
		}else{
			validSubmit('name');
		}


		// VALIDATE COMPANY
		if(company_Val === '' || company_Val < 3){
			console.log('\n\n\nERROR : user must include the Contractor (Company Name)', companyEle);
			reject = true;
			rejectSubmit('company');
		}else{
			validSubmit('company');
		}
		if(reject === false){
			submitFormData();
		}
		return false;
	});

	document.getElementById('form_submit').addEventListener('keypress', function(e){
		var keyNum = e.which || e.keyCode;
		if(keyNum === 13){
			e.preventDefault();
			document.getElementById('form_click').click();
			return false;
		}
	});

	document.getElementById('backBTN').addEventListener('click', backClick);
}

function submitFormData(){
	console.log('\n\n\n\n\nDISABLE PAGE ELEMENTS AFTER FORM IS SUBMITTED');
	var eles = document.getElementById('form_submit').querySelectorAll('input, label');
	var lengtheles = eles.length;
	document.getElementById('submit').click();

	eles.forEach((chld, index)=>{
		console.log('\n\n\nChild Input : ', chld);
		disableEle(chld);
		if(index===lengtheles-1) {
			escapeLink();
			window.alert('Your request for user access has been sent!');

			initializeInfo();
		}
	});
	return;


	// document.getElementById('submit').click();
	// console.log('\n\n\nForm Submit : ', $('#form_submit').submit());
	// escapeLink();
	//
	//
	// initializeInfo();
	// return;
	// var seriData = $('form_submit').serialize();
	// console.log('\n\n\nForm Submit Serial : ', seriData);
	// $('#form_submit').submit(function(){
	// 	$.ajax({
	// 		// url: $('#form_submit').attr('action'),
	// 		url:'/access/request/',
	// 		type:'POST',
	// 		data: seriData,
	// 		success: function(){
	// 			console.log('Form Submitted!');
	// 		}
	// 	});
	// })
}

function escapeLink(){
	var escapeDiv = document.createElement('div');
	escapeDiv.style="width: 90%; margin: 10px auto; height: 35px;";
	themeColor.a = 1;
	var colorCode ="rgba("+themeColor.r + ","+ themeColor.g +"," +themeColor.b +","+themeColor.a+")";
	// escapeDiv.style.backgroundColor = colorCode;
	escapeDiv.classList.add('hidedisable');
	console.log('\n\n\nescape button created: ', escapeDiv.style.backgroundColor);
	console.log('\n\n\nESCAPE Color : ', colorCode);
	escapeDiv.textContent = 'ESCAPE BUTTON';
	escapeDiv.addEventListener('click', function(e){return window.location.href="/"})
	document.getElementById('form_submit').parentNode.appendChild(escapeDiv);

	escapeDiv.click();
}

function disableEle(ele){
	ele.style.pointerEvents="none";
	ele.style.opacity="0.5";
	ele.style.border="1px grey solid";
}

function initializeInfo(){
	var info_buttons = document.querySelectorAll('.infoimg');
	console.log(info_buttons);
	info_buttons.forEach((but)=>{
		console.log('\n\nCreate info btn listener : ', but);
		but.addEventListener('click', reactDescription);
	});
}

/*
	Based on the clicked info_icon's position and id,
			function will expand/collapse desired field desc
*/
function reactDescription(e){
	var id = e.currentTarget.id;
	var desiredEle = document.getElementById(id.replace('info_', 'description_'));
	console.log('\nn\n\nINFO ICON CLICKED --> element to react : ', desiredEle);
	if(desiredEle.className.indexOf('hidedisable')>-1) desiredEle.classList.remove('hidedisable');
	else desiredEle.classList.add('hidedisable');
}


function validSubmit(idtext){
	console.log('\n\nVALID SUBMIT Values for  : ', idtext);
	var ele = document.getElementById('description_'+idtext);
	try{
		document.getElementById(idtext + '_field').style.borderColor = 'grey';

		if(ele.id){
			ele.style.color = 'darkgrey';
			ele.style.fontWeight = 'normal';
		}
	}catch(e){
		console.log('\n\nNo FIELD Description for cID : ', idtext, '\nERROR: ', e);
	}
}

function rejectSubmit(idtext){
	var container =document.getElementById('main_container');
	var left = true;
	var shimmy = 0;
	document.getElementById(idtext + '_field').style.borderColor = 'red';
	container.style.borderRight= "1px Transparent solid";
	container.style.borderLeft= "1px Transparent solid";
	var shakes =
		setInterval(function(){
			if(left === true){
				left = false;
				container.style.borderLeftWidth = '10px';
				container.style.borderRightWidth = '0px';
			}else{
				left = true;
				container.style.borderRightWidth = '10px';
				container.style.borderLeftWidth = '0px';
			}
			shimmy ++;
			if(shimmy > 4){
				console.log('\n\n\nShakedown CLEAR THE INTERVAL!');
				container.style.borderRightWidth = '1px';
				container.style.borderLeftWidth = '1px';
				container.style.borderColor = 'Transparent';
				showError(idtext);

				clearInterval(shakes);
			}
		}, 60);
}

/*
	Accepts a company, email, etc TEXT and prefixes it with "description_"
	Retreives Desired description element, shows it,
	and passes the element to the blink animation
*/
function showError(cID){
	console.log('\n\nShow error for  : ', cID);
	try {
		var ele = document.getElementById('description_'+cID);
		if(ele.id){
			ele.classList.remove('hidedisable');
			blinkMessage(ele, 3);
		}
	} catch (e) {
		console.log('\n\nINFO Button/DESC not found for cID: ', cID,'\nERROR: ', e);
	} finally {}
}
function blinkMessage(container, numTimes){
	var potent = 255;
	var goingRate = 20;
	if(!numTimes) numTimes = 4;
	var times = 0;
	var fin = false;
	var newID = container.id.replace('description_', '');
	newID = newID + '_field';
	var inputContainer = document.getElementById(newID);
	if(inputContainer) inputContainer.focus();
	container.style.fontWeight = "bold";
	document.getElementById(newID).focus();

	var blinkInterval = setInterval(function(){
		container.style.color = 'rgba(' + potent + ', 0, 0, 1)';
		if(fin === true){
				// container.style.color = 'darkgrey';
				// container.style.fontWeight = "normal";

				// document.getElementById(newID).style.borderColor = 'grey';
				// document.getElementById(newID).focus();

				return clearInterval(blinkInterval);
		}
		if(potent+goingRate > 250 || potent+goingRate < 100) {
			console.log('Change Opacity : ', potent);
			goingRate = (goingRate*-1)
			times ++;
			if(numTimes*2 === times-1){
				console.log('escapeInterval');
				fin = true;
			}
		}
		potent = potent+goingRate;
	}, 30);
}

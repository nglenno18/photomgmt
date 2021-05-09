var wOrders = [];
var during_drop_options = '<option>GC_PROGRESS</option>' + '<option>AGENT_PROGRESS</option>' + '<option>PUNCHLIST</option>';
var after_drop_options = '<option>AGENT_QC</option>' + '<option>GC_COMPLETED</option>';
var sub_drop_options = null;
getOrders = function(){
  return this.wOrders;
}
setOrders = function(orders){
  this.wOrders = orders;
}

/*
  EVENT LISTENER (btn-click)
  BATCH ROTATE FUNCTION
*/
initMoveListener = function(){
  var move_btn= document.getElementById('movePhotos');
  if(!move_btn) return false;
  move_button_element = move_btn;
  move_btn.addEventListener('click', promptMove);
}

testMove = function(){
  // TEST MOVE ::
  setMultiSelect(true);
  showMultiOptions(true);

  var nail_list = document.querySelector('.thumbWrap img:not(.thumbaction):not(.status)');
  console.log('\n\nTEST MOVE : ', nail_list);
  // nail_list.click();
  addToSelect(nail_list)
  setTimeout(function(){
    move_button_element.click();
  }, 1000)
}

promptMove = function(e){
  e.preventDefault();
  console.log('\n\n\n\n\n\n\n\n\n\nPrompt User MOVE Specs + Dialogue');

  var nail_list = getSelectedThumbnails();
  var length = nail_list.length;
  var gal = getGalleryTag();
  console.log('MOVE BATCH from gallery tag : ', gal);
  if(gal === 'during' || gal === 'after') gal = getActiveTags();

  // UPDATE --> prevent request for list of 0 items
  if(length === 0) return alert('0 Images selected\nPlease Select an Image or Gallery to Move');

  var buildResult = buildMovePrompt(length);
  console.log('\n\n--------build Rotate Prompt RETURNED\n\tbuildResult = ', buildResult);
  initMovePrompt(buildResult.popout, buildResult.submit);

  buildResult.submit.parentNode.classList.add('disabled');

  buildResult.submit.addEventListener('click', function(e){
    console.log('\n\n*********batchMOVE submission !');
    // VALIDATE form data (if necessary)
    var ver = verifyFormDifference(true, buildResult.submit);
    console.log('ver : ', ver);
    if(ver != null && ver != 'Invalid Submission'){
      if(confirm('This action will permanantly transfer the selected images from the current gallery')){
        escapePopout();
        nail_list.forEach(function(nail, indio){
          createStatus(nail, 'pending', 'batchrotate');
        });

        ver.rotationTimer = setRotationTimer();

         requestMove(
           {
             prop: currentProperty.property,
             propID: currentProperty.Property_key || currentProperty.propID,
             folder: getFolderTag(),
             contractor: currentWorkOrder.contractor,
             wo: currentWorkOrder.work_order,
             time: getGalleryTag(),
             sub: getActiveTags()
           },
           ver,
           nail_list
         );
         selectAll(false);

         return 'Request Made';
      }else{
        return 'User Cancelled';
      }
    }
  });
}

buildPrompt = function(length, title){
  if(!title) title = 'MOVE';

  title = title.toUpperCase();
  var modal = document.createElement('div');
  modal.className = 'modal';
  var prompt = document.createElement('div');
  prompt.className = 'popout move-popout';

  prompt.innerHTML = '<div class="prompt-header">' +
                      '<img src=".././branding/cstr-ico.ico"></img>' +
                      '<label class="popout-title">' + title + '</label>' +
                      // 'MOVE' +
                      '<div class="esc_group">' +
                        '<div><button class="esc-btn">X</button></div>' +
                        '<label>' + length + ' Selected Images</label>' +
                      '</div>' +
                      '</div>';

  return {modal, prompt};
}

/*
  buildRotatePrompt()
  builds the modal + popout form for BATCH ROTATION
*/
buildMovePrompt = function(length){
  console.log('\nbuildMovePrompt()');
  var modalprompt = buildPrompt(length);
  var modal = modalprompt.modal;
  var prompt = modalprompt.prompt;
  prompt.class="move-prompt";

  // HEADER


  // PART_A :: LOCATION INFO
  var partA = document.createElement('div');
  partA.id = "location_form";

  // ERR MESSAGE
  var errDrop = document.createElement('div');
  errDrop.innerHTML = '<img src=".././images/info.png"></img>' + '<label>SERVER ERROR</label>' + '<span>Cannot connect to the database</span>'
  errDrop.className = 'errMessage hidedisable';
  errDrop.id = 'property_drop_error';
  partA.appendChild(errDrop);

  // PROPERTY FIELD ////////////////////////////////
  var propertyField = document.createElement('div');
  propertyField.className = 'popout-form-field';
  propertyField.marginTop = '10px';
  propertyField.innerHTML = '<div class="form-section-label form-head">' +
                            '<label>PROPERTY</label>' +
                            '<div class="form-section-break"></div>' +
                            '</div>';

  var property_drop_container = document.createElement('div');
  property_drop_container.id = 'property-drop-container';
  property_drop_container.className = 'drop-container';

  var property_drop = document.createElement('select');
  property_drop.id = 'property_drop';
  property_drop.className = 'select2';
  // populateProperties()
  // property_drop.innerHTML = '<option>FAKE PROPERTY</option>';
  property_drop_container.appendChild(property_drop);
  var drop_icon = document.createElement('img');
  drop_icon.className = 'dropdown_icon';
  drop_icon.src = ".././images/orange-arrow.png";
  property_drop_container.appendChild(drop_icon);

  propertyField.appendChild(property_drop_container);

  partA.appendChild(propertyField);

  // FOLDER FIELD ////////////////////////////////
  var folderfield = document.createElement('div');
  folderfield.className = 'popout-form-field';
  folderfield.innerHTML = '<div class="form-section-label">' +
                            '<label>FOLDER</label>' +
                            '</div>';

  var folder_drop_container = document.createElement('div');
  folder_drop_container.id = 'folder-drop-container';
  folder_drop_container.className = 'button-container';

  var folder_drop = document.createElement('div');
  folder_drop.id = 'folder_drop';
  folder_drop.className = 'button-row'
  // populateProperties()
  folder_drop.innerHTML = '<button id="initial_property_option" class="first-button">Initial Property</button>' +
                          '<button id="bids_&_repairs_option" class="last-button">Bids & Repairs</button>';
  folder_drop_container.appendChild(folder_drop);

  folderfield.appendChild(folder_drop_container);
  partA.appendChild(folderfield);


  // Contractor FIELD ////////////////////////////////
  var contractorField = document.createElement('div');
  contractorField.className = 'popout-form-field';
  contractorField.innerHTML = '<div class="form-section-label">' +
                            '<label>CONTRACTOR</label>' +
                            '</div>';

  var contractor_drop_container = document.createElement('div');
  contractor_drop_container.id = 'contractor-drop-container';
  contractor_drop_container.className = 'drop-container';

  var contractor_drop = document.createElement('select');
  contractor_drop.id = 'contractor_drop';
  contractor_drop.className = 'select2';

  // populateProperties()
  // contractor_drop.innerHTML = '<option>South Jersey Custom Painting and Repair Teams</option><option>Contractor B</option>';
  contractor_drop_container.appendChild(contractor_drop);
  var drop_icon3 = document.createElement('img');
  drop_icon3.className = 'dropdown_icon';
  drop_icon3.src = ".././images/orange-arrow.png";
  contractor_drop_container.appendChild(drop_icon3);

  contractorField.appendChild(contractor_drop_container);

  partA.appendChild(contractorField);


  // Work Order FIELD ////////////////////////////////
  var woField = document.createElement('div');
  woField.className = 'popout-form-field';
  woField.innerHTML = '<div class="form-section-label">' +
                            '<label>WORK ORDER</label>' +
                            '</div>';

  var wo_drop_container = document.createElement('div');
  wo_drop_container.id = 'wo-drop-container';
  wo_drop_container.className = 'drop-container';

  var wo_drop = document.createElement('select');
  wo_drop.id = 'wo_drop';
  // populateProperties()
  // wo_drop.innerHTML = '<option>X5RT3 - Standard Repair</option><option>RTB35 - OTB Bid</option>';
  wo_drop_container.appendChild(wo_drop);
  var drop_icon3 = document.createElement('img');
  drop_icon3.className = 'dropdown_icon';
  drop_icon3.src = ".././images/orange-arrow.png";
  wo_drop_container.appendChild(drop_icon3);

  woField.appendChild(wo_drop_container);
  partA.appendChild(woField);



  //                               ////////////////////////////////
  // PART_B :: TIME PERIOD SECTION ////////////////////////////////
  var partB = document.createElement('div');
  partB.id = "timeperiod_form";

  // TIME PERIOD FIELD ////////////////////////////////
  var timePeriodField = document.createElement('div');
  timePeriodField.className = 'popout-form-field';
  timePeriodField.innerHTML = '<div class="form-section-label form-head">' +
                            '<label>TIME PERIOD</label>' +
                            '<div class="form-section-break"></div>' +
                            '</div>';

  var period_drop_container = document.createElement('div');
  period_drop_container.id = 'period-drop-container';
  period_drop_container.className = 'button-container';

  var period_drop = document.createElement('div');
  period_drop.id = 'period_drop';
  period_drop.className = 'button-row'
  // populateProperties()
  period_drop.innerHTML = '<button id="before_t" class="first-button">BEFORE</button>' +
                          '<button id="during_t">DURING</button>' +
                          '<button id="after_t" class="last-button">AFTER</button>';
  period_drop_container.appendChild(period_drop);
  timePeriodField.appendChild(period_drop_container);

  partB.appendChild(timePeriodField);


  // SubPeriod FIELD ////////////////////////////////
  var subPeriodField = document.createElement('div');
  subPeriodField.id = 'sub-period-fields';
  subPeriodField.className = 'popout-form-field';
  subPeriodField.innerHTML = '<div class="form-section-label">' +
                            '<label>Sub-Period</label>' +
                            '</div>';

  var sub_drop_container = document.createElement('div');
  sub_drop_container.id = 'sub-drop-container';
  sub_drop_container.className = 'drop-container';

  var sub_drop = document.createElement('select');
  sub_drop.id = 'sub_drop';
  // populateProperties()
  sub_drop.innerHTML = sub_drop_options;
  sub_drop_container.appendChild(sub_drop);
  var drop_icon = document.createElement('img');
  drop_icon.className = 'dropdown_icon';
  drop_icon.src = ".././images/orange-arrow.png";
  sub_drop_container.appendChild(drop_icon);

  subPeriodField.appendChild(sub_drop_container);

  partB.appendChild(subPeriodField);

  //          ////////////////////////////////////////
  // ASSEMBLY ////////////////////////////////////////
  var sample_image = document.createElement('div');
  sample_image.className = 'form-container';
  sample_image.innerHTML = '<img id="test-rotate" class="centered_img" src="'+ '.././branding/brand.png' + '"></img>';

  var formWrapper = document.createElement('div');
  formWrapper.className = 'form-wrapper';

  var submit = document.createElement('div');
  submit.className = 'rotate-submit-container';
  submit.innerHTML = '<input class="rotate-submit" type="submit" value="SAVE LOCATION"></input>';

  formWrapper.appendChild(partA)
  formWrapper.appendChild(partB)
  prompt.appendChild(formWrapper);
  prompt.appendChild(submit);
  // prompt.appendChild(sample_image);
  modal.appendChild(prompt);

  document.body.appendChild(modal);


  initializeEscape();    // When Submitted or clicked away, destroy the popout modal
  return {
    popout: prompt,
    submit: submit.children[0]
  };
}

clearFolders = function(){
  var folder_buttons = document.getElementById('folder_drop');
  folder_buttons = folder_buttons.querySelectorAll('button.pressed');
  folder_buttons.forEach(function(but, ind){
    but.classList.remove('pressed');
  })
}
clearPeriods = function(){
  var folder_buttons = document.getElementById('period_drop');
  folder_buttons = folder_buttons.querySelectorAll('button.pressed');
  folder_buttons.forEach(function(but, ind){
    but.classList.remove('pressed');
  })
}


initMovePrompt = function(prompt, submission){
  var errMessage = document.getElementById('property_drop_error');

  $("html, body").animate({scrollTop: 0}, '1000');
  document.body.classList.add('noscroll');

  console.log('\ninitMovePrompt()');
  var folder_buttons = document.getElementById('folder_drop');
  folder_buttons = folder_buttons.querySelectorAll('button');
  folder_buttons.forEach(function(but, ind){
    but.addEventListener('click', function(e){
      if(but.className.indexOf('pressed') === -1){
        clearFolders();
        but.classList.add('pressed');
      }else{
        // but.classList.remove('pressed');
        // clearPeriods();
        return false;
      }

      if(but.className.indexOf('pressed') > -1 && but.textContent === 'Initial Property'){
        console.log('\nInitial Property PRESSED!', document.getElementById('before_t'));
        contractor_drop.parentNode.classList.add('disabled');
        $('#contractor_drop').val(contractor_drop.options[0].id);
        $('#contractor_drop').trigger('change');
        wo_drop.parentNode.classList.add('disabled');
        if(document.getElementById('before_t').className.indexOf('pressed') === -1) {
          clearPeriods();
          document.getElementById('before_t').click();
        }
        lockTimePeriod(['during_t', 'after_t'], true);
      }else if(but.className.indexOf('pressed') === -1){
        lockTimePeriod(['during_t', 'after_t']);
        contractor_drop.parentNode.classList.add('disabled');
        contractor_drop.selectedIndex = -1;
        $('#contractor_drop').trigger('change');
        wo_drop.parentNode.classList.add('disabled');
      }else{
        lockTimePeriod(['during_t', 'after_t']);
        contractor_drop.parentNode.classList.remove('disabled');
        // contractor_drop.selectedIndex = 0;
        loadContractorOrders();
        wo_drop.parentNode.classList.remove('disabled');
      }
      verifyFormDifference(false, submission);
    })
  });

  var period_buttons = document.getElementById('period_drop');
  period_buttons = period_buttons.querySelectorAll('button');
  period_buttons.forEach(function(but, ind){
    but.addEventListener('click', function(e){
      if(but.className.indexOf('pressed') === -1){
        clearPeriods();
        but.classList.add('pressed');
      }else{
        // but.classList.remove('pressed');   // OMMITTING this line makes the field required
      }

      // disable sub-periods when applicable
      $('#sub_drop').val(null).trigger('change');
      sub_drop.innerHTML = '';

      if(but.className.indexOf('pressed') > -1 && but.textContent === 'BEFORE'){
        $('#sub_drop').attr("disabled", "true");
        sub_drop.parentNode.classList.add('disabled');
        // sub_drop.disabled = true;
      }else if(but.className.indexOf('pressed') > -1){
        $('#sub_drop').attr("disabled", null);
        sub_drop.parentNode.classList.remove('disabled');
        if(but.textContent === 'DURING') sub_drop_options = during_drop_options;
        else sub_drop_options = after_drop_options;
        var opts = sub_drop_options.split('</option>');
        console.log('\n\nSUB DROP OPTIONS! ', opts);
        opts.forEach(function(opt, ind){
          if(ind  < opts.length-1){
            console.log('\nadd option');
            opt = opt + '</option>'
            $('#sub_drop').append(opt)
          }
        });
        console.log('GET ACTIVE TAGS ! ', getActiveTags());
        if(getActiveTags() && getGalleryTag() === but.textContent.toLowerCase()) $('#sub_drop').val(getActiveTags().toUpperCase())
      }else{
        $('#sub_drop').attr("disabled", "true");
        sub_drop.parentNode.classList.add('disabled');
      }
      verifyFormDifference(false, submission);
    })
  })

  // ////////////////////////////////////////
  // PASS down-arrow clicks to the parent element for dropdown selections
  // ////////////////////////////////////////
  var downarrows = $('.popout .dropdown_icon');
  if(downarrows){
    downarrows.each(function(ind, arrow){
      console.log('downarrow #' + ind + ' : ', arrow, '\n\t next sibling : ', arrow.previousSibling);
      arrow.addEventListener('click', function(e){
        // e.stopPropagation();
        // if(arrow.previousSibling.length === 0) arrow.previousSibling.length = '100%';
        console.log(arrow.previousSibling.previousSibling);
        var downele = $('#' + arrow.previousSibling.previousSibling.id);
        if(downele) downele.select2('open');
      })
    })
  }


  // ////////////////////////////////////////
  // Load Properties and Workorder Data
  // ////////////////////////////////////////
  console.log('\n\n\nPROPERTY LIST : ', currentArray);
  var propIndex = null;
  property_drop = document.getElementById('property_drop');
  selectArray = [];

  $('#' + property_drop.id).select2({
    placeholder: "Search for a Property",
    theme: 'popout-select',
    data: selectArray
  }).on('select2:open', function(e){
    // markCurrent(property_drop, currentProperty.property);
  });
  // otherwise, set up this equation 1 time in the css

  Object.keys(currentArray).forEach(function(prop, ind){
    if(prop === currentProperty.property) propIndex = ind;
    prop = Object.assign(prop, {});
    loadSelectOption({Property: prop, Property_key: currentArray[prop]}, property_drop);
    // selectArray.push({id: currentArray[prop], text: prop});
  });
  property_drop.selectedIndex = propIndex;
  property_drop.onchange = function(e){
    console.log('e : ', e);
    selectedID = e.target.options[e.target.selectedIndex];
    if(!selectedID) throw Error;
    selectedID = selectedID.id.substring(0, selectedID.id.indexOf('--'));
    console.log('\nPROPERTY CHANGED! : ', selectedID);
    var pathurl = '/api/property/' + selectedID;
    getPropertySelection(pathurl, function(propertydata, err){
      console.log('\n\ngetPropertySelection()\n', propertydata);
      var orders = [];
      if(err){
        setOrders([]);
        loadContractorOrders();
        // ERROR HANDLING HERE
        if(errMessage) errMessage.classList.remove('hidedisable');
        else alert('Server Error : Cannot Retreive Data from the Database');
        verifyFormDifference(false, submission);
        return false;
      }
      if(errMessage) errMessage.classList.add('hidedisable');
			if(propertydata.workOrders){
				console.log('Loading work_orders');
				setOrders(propertydata.workOrders);
			}else{
				console.log('\n\nLoading Workorders --- NO WORK ORDERS FOUND!');
				setOrders([]);
			}
      // loadWOField()
      if(getFolderButton() != 'Initial Property') loadContractorOrders();
    });
    verifyFormDifference(false, submission);
  };


  $('#property_drop').on('query', function(params){
    console.log('\nPARAMS QUERY : ', params);
    this.dataAdapter.query('', function (data) {
        $(this).trigger('results:all', {
          data: data,
          query: ''
        });
      });
  })
    $('#property_drop').on('results:all', function(e){
      console.log('property Results:all ---> ', e.data);
    });

  // ////////////////////////////////////////
  // Load Properties and Workorder Data
  // ////////////////////////////////////////
  // console.log('\n\n\nContractor LIST : ', activeOrders);
  var cIndex = null;
  var wIndex = null;
  var eleID = 'contractor_drop';
  contractor_drop = document.getElementById(eleID);
  wo_drop = document.getElementById('wo_drop');
  $('#' + contractor_drop.id).select2({
    placeholder: "Search for a Contractor",
    theme: 'popout-select'
  }).on('select2:open', function(e){
    if(currentProperty.property === property_drop.value) markCurrent(contractor_drop, currentWorkOrder.contractor);
  });
  $('#' + wo_drop.id).select2({
    placeholder: "Search for a Work Order",
    theme: 'popout-select'
  }).on('select2:open', function(e){
    if(currentProperty.property === property_drop.value && currentWorkOrder.contractor === contractor_drop.value) markCurrent(wo_drop, currentWorkOrder.work_order);
  });

  // add contractor/work order listeners
  contractor_drop.onchange = function(e){
    console.log('\n\nCONTRACTOR CHANGED :: ', e.target.value);
    loadWOField(e.target.value);
    verifyFormDifference(false, submission);
  }

  if(activeOrders){
    setOrders(activeOrders);
    loadContractorOrders();

    // contractor_drop.selectedIndex = cIndex;
    // wo_drop.selectedIndex = wIndex;
    loadWOField(contractor_drop.value);
  }

  // ////////////////////////////////////////
  // Load TIME PERIOD Data
  // ////////////////////////////////////////
  $('#' + sub_drop.id).select2({
    placeholder: "No Sub-Periods available",
    theme: 'popout-select'
  });


  console.log('\n\nCURRENT FOLDER : ', getGalleryTag(), '\n\tFOLDER : ', getFolderTag());
  folder_buttons = folder_drop.querySelectorAll('button');
  console.log('\nfolder-buttons = ', folder_buttons);
  folder_buttons.forEach(function(child){
    if(child.textContent === getFolderTag() && child.className.indexOf('pressed') === -1) return child.click();
  });

  period_buttons = period_drop.querySelectorAll('button');
  console.log('\nfolder-buttons = ', folder_buttons);
  period_buttons.forEach(function(child){
    if(child.textContent.toLowerCase() === getGalleryTag() && child.className.indexOf('pressed') === -1) return child.click();
  });

  // add listeners to work order and sub-period to verifyFormDifference()
  wo_drop.onchange = function(e){verifyFormDifference(false, submission)};
  sub_drop.onchange = function(e){verifyFormDifference(false, submission)};
}
// //////////////////////////
// END INIT MOVE PROMPT
// //////////////////////////

inArr = function(val, arr){
  var itis = false;
  arr.some(function(v){
    if(v === val) return itis = true;
  });
  return itis;
}

loadWOField = function(contractorValue){
  var wo_drop = document.getElementById('wo_drop');
  wo_drop.innerHTML = '';
  var wIndex = null;
  getOrders().forEach(function(order, index){
    console.log(order.contractor, '    v.    ', contractorValue);
    if(order.contractor === contractorValue){
      console.log('\n\nMATCHED!!! ', index);
      if(!wIndex) wIndex = order.work_order;
      if(currentWorkOrder.work_order === order.work_order) wIndex = order.work_order;
      loadSelectOption({Property:order.work_order, Property_key: order.work_order}, wo_drop);
    }
  });
  $('#wo_drop').val(wIndex);
}

loadContractorOrders = function(){
  contractor_drop.selectedIndex = (-1);
  contractor_drop.innerHTML = '';
  // $('#contractor_drop').val(null).trigger('change');
  var col = [];
  var cIndex = null;
  getOrders().forEach(function(contract, ind){
    if(contract.work_order === currentWorkOrder.work_order) wIndex = ind;
    var hide = null;
    if(inArr(contract.contractor, col) === true) hide = true;
    else col.push(contract.contractor)
    if(!hide){
      if(contract.contractor === currentWorkOrder.contractor) cIndex = currentWorkOrder.contractor;
      loadSelectOption({Property: contract.contractor, Property_key: contract.contractor}, contractor_drop);
    }
    // loadSelectOption({Property: contract.work_order, Property_key: contract.work_order}, wo_drop);
  });
  console.log('\n\n\nContractor Options Loaded! : ', contractor_drop.options[0]);

  if(!cIndex && contractor_drop.options.length > 0) cIndex = contractor_drop.options[0].value;
  $('#contractor_drop').val(cIndex);
  $('#contractor_drop').trigger('change');
  // if(getFolderButton() === 'Initial Property'){
  // }
}

getFolderButton = function(){
  if(document.getElementById('initial_property_option').className.indexOf('pressed') > -1) return 'Initial Property';
  if(document.getElementById('bids_&_repairs_option').className.indexOf('pressed') > -1) return 'Bids & Repairs';
}

lockTimePeriod = function(tArray, lock){
  tArray.forEach(function(id, ind){
    var ele = document.getElementById(id);
    if(lock) ele.classList.add('disabled');
    else ele.classList.remove('disabled');
  })
}


verifyFormDifference = function(actionable, submission){
  var isValid = true;
  var isSame = true;
  var eMess = null;
  var prop = document.getElementById('property_drop').value;
  var folder = getFolderButton();
  var con = document.getElementById('contractor_drop').value || "";
  var wo = document.getElementById('wo_drop').value || "";
  var pd = $('#period_drop button.pressed')[0];
  if(pd) pd = pd.textContent;
  try {
    if(pd) pd === pd.toLowerCase();
  } catch (e) {
    console.log('\n\nCould not get period_drop button!');
    pd = null
  }
  var sub = document.getElementById('sub_drop').value;

  var update = {
    property: prop,
    folder,
    contractor: con,
    work_order: wo || "",
    period: pd || "",
    subperiod:sub || ""
  }
  console.log('Form Update : ', update);
  if(!prop || prop === '' || !folder || folder === '' || !pd || pd === ''){
    isValid = false;
    eMess = 'Missing Required Fields!';
  }else if(pd.toLowerCase() === 'before'){
    if(sub) {
      isValid = false;
      eMess = 'Before Photos cannot have a Sub Period';
    }
  }else if(pd.toLowerCase() != 'before' && !update.subperiod){
    isValid = false;
    eMess = 'Missing Sub-Period'
  }


  if(isValid === true){
    if(folder === 'Initial Property'){
      if(pd.toLowerCase() != 'before'){
        console.log($('#period_drop button.pressed')[0], '\t v. ', pd);
        isValid = false;
        eMess = 'Initial Property Photos must use the "BEFORE" Time Period : ', pd;
      }
    }else if(!con || !wo){
      isValid = false;
      eMess = 'Contractor & Work Order are Required for Job Photos';
    }
  }else{
    console.log('INVALID : ', eMess, '\nperiod = ',pd);
  }

  if(isValid === false){
    console.log('\n\nForm Parameters are not valid!');
    if(actionable) return moveViolation(eMess);
    // decide if there should be an inline form alert to describe the violation
  }else{
    console.log('\n\nCurrent Page info : ', currentProperty, '\nfolder = ', getFolderTag(), '\nwo = ', currentWorkOrder.work_order,
                '\ncontractor = ', currentWorkOrder.contractor, '\nperiod  = ', getGalleryTag(), '\nsub-period = ', getActiveTags());
    if(currentProperty.property.toLowerCase() != prop.toLowerCase()){
      isSame = false;
      console.log('different property');
    }
    if(isSame && folder.toLowerCase() != getFolderTag().toLowerCase()){
      isSame = false;
      console.log('different folder');
    }
    if(isSame && (currentWorkOrder.work_order || "") != wo){
      isSame = false;
      console.log('different work order');
    }
    if(isSame && (currentWorkOrder.contractor || "") != con){isSame = false; console.log('different contractor');}
    if(isSame && getGalleryTag() != pd.toLowerCase()){isSame = false; console.log('different gallery');}
    if(isSame && getActiveTags().replace(/:::/g, '') != sub.toLowerCase()){isSame = false; console.log('different tags');}
  }

  if(isValid === true && isSame === false){
    submission.parentNode.classList.remove('disabled');
    if(actionable){
      return update;
    }
  }else{
    console.log('isValid = ', isValid, ' & isSame = ', isSame);
    submission.parentNode.classList.add('disabled');
    if(actionable) {
      alert('INVALID submission. No request was made to the server');
      return 'Invalid Submission';
    }
  }
}

moveViolation = function(message){
  return alert(message);
}

markCurrent = function(element, value){
  setTimeout(function(){
    // console.log($('#select2-' + element.id + '-results').find('[title="' + value +'"]'));
    var ele = $('#select2-' + element.id + '-results').find('[title="' + value + '"]');
    if(ele)ele.attr('aria-current', 'true');
  }, 100)
}

setCurrentCSS = function(){
  var doc_rot = document.styleSheets;
  var docum = null;
  Object.keys(doc_rot).some(function(styles){
    var style = doc_rot[styles]
    if(style.href.substring(style.href.lastIndexOf('/')).indexOf('popout_selections.css') > -1) return docum = style;
  });
  var rot_rule = null;
  Object.keys(docum.rules).some(function(rule){
    var dr = docum.rules[rule];
    if(dr.selectorText.indexOf('.select2-results__option[title="placeholderlabel"]')) return rot_rule = dr.style;
  })
  var selectoT = '.select2-results__option[title="placeholderlabel"]';
  selectoT = selectoT.replace('placeholderlabel', currentProperty.property);
  console.log('insertRULE == ', rot_rule);
  var newRule = '{'+
    'border-left: 2px solid black;' +
    'color: var(--brand_theme)!important;' +
  '}';
  var newRule = '{' + 'border-left: ' + rot_rule['border-left'] + '!important;'
                    + 'color: ' + rot_rule['color'] + '!important;'
                    + 'background: ' + rot_rule['background'] + '!important;'
                    + 'font-weight: ' + rot_rule['font-weight'] + '!important;'
                    + 'border-top: ' + rot_rule['border-top'] + '!important;'
                    + 'border-bottom: ' + rot_rule['border-bottom'] + '!important;'
                    // + 'border-top: 20px solid black!important;'
                    + '}';
  console.log('NEW RULE : ', newRule);
  docum.insertRule(selectoT + newRule, 1);
  docum.syle = rot_rule;
}

requestMove = function(current, update, list){
  console.log('\n\nRequest has passed initial form validation.\nREQUESTING TO MOVE IMAGES');
  update.property_key = currentArray[update.property];
  update.batchID = createBatchID();

  var notification = {
    type: 'move',
    gal: getGalleryTag(),
    items: list.length
    ,
    batch_identification: update.batchID
  }


  list = collectURLS(list);
  var listsplit = list.split(':::,');
  listtext = '';
  if(listsplit){
    listsplit.forEach(function(ul, index){
      // listtext += '"' + ul + '"'
    })
  }
  console.log('\n\nCURRENT Gallery : ', current, '\n\nUPDATE : ', update, '\nimagelist : ', listsplit);

// TEST with invalid values
  // update = testMoveObject(update);

  addNotif(notification, function(notifObject){
    update.socket_identification = 'socketid-' + notifObject.socketid;
    var sendData = {};
    var datapairs = [];
    Object.keys(update).forEach(function(key, ind){
      datapairs.push('"' + key + '"' + ':' + '"' + update[key] + '"');
    });
    datapairs.push('"imagelist":' + '' + '"' + listsplit.join(':::') +'"');
    var retryNum = 0;

    var datastring = '{' + datapairs.join(',') + '}';
    console.log('\nDATASTRING : ', datastring, '\nJSON : ', JSON.stringify(datastring), JSON.parse(datastring));
    console.log('\n\nCURRENT V. UPDATE : \n', current, '\n\n', update);

    var xhr = $.ajax({
        type:'POST',
        url: '../editing/move/',
        data:datastring,
        success: function(successResult){
          console.log('\n\nSUCCESS moving images : ', successResult);
          console.log('\n\nREMOVE TIMER : ', update);
          clearInterval(update.rotationTimer);
          removeNotif(notifObject);
          if((update.period + '').toLowerCase() === current.time.toLowerCase() && current.time.toLowerCase() != 'before'){
            if(currentWorkOrder.work_order === update.work_order) refreshPhotos(currentWorkOrder);
          }
          xhr.abort();
          return true;
        },
        error: function(erResult, textStatus, errThrown){
          console.log('\n\nERROR moving images : ', erResult ,'\ntextStatus : ', textStatus, '\nerrThrown : ', errThrown);
          if(erResult.responseJSON.error) alert(erResult.responseJSON.error);

          var currentCall = this;
          if(retryNum < 50 && textStatus === 'timeout'){
            console.log('POST REQUEST TIMEOUT : retry call');
            $.ajax(currentCall);
            retryNum ++;
          }else if(retryNum < 50 && errThrown === "Service Unavailable"){
            setTimeout(function(){
              console.log('service cut, wait 5 seconds');
              $.ajax(currentCall);
            }, 4000);
          }else{
            console.log('ERROR out of retries : ', list);
            clearTimer(notifObject);
            removeNotif(notifObject);
            clearInterval(update.rotationTimer);
            listsplit.forEach(function(errImage, index){
              console.log('\n\nErrored IMAGE : ', errImage);
              var tIm = document.getElementById(errImage + 'image');
              setThumbnailStatus(tIm, 'failed', 'move', 'errThrown');
            })
            xhr.abort();
          }
          return false;
        }
    });
    escapePopout();
    return true;
  })
}



/*
  testMoveObject()
  clientside manipulation of the request's data object
*/
testMoveObject = function(locObject){
  console.log('\n\nTESTING MOVE FUNCTION -- Object Manipulations\n\n');
  var loc = Object.assign({}, locObject);

  // REQUIRED FIELDS
    // loc.property = '';
    // loc.property_key = '';
    // loc.folder = '';
    // loc.period = '';

  // BEFORE PERIOD
    // loc.period = 'BEFORE';
    // loc.subperiod = 'AGENT_PROGRESS';

  // DURING/AFTER pd VIOLATION
    // loc.period = 'DURING';
    // loc.subperiod = '';

  // INVALID Initial Property
  // loc.folder = 'Initial Property';
    // loc.contractor = 'Someone';
    // loc.work_order = 'notnull';
    // loc.period = 'DURING'; loc.subperiod = 'AGENT_PROGRESS';


  // INVALID Bids & Repairs
  // loc.folder = 'Bids & Repairs';
    // loc.contractor = '';
    // loc.work_order = '';

  return loc;
}

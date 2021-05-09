var deleteImage = function(e){console.log(e);};
var batchDelete = function(e){console.log(e);};

var selecteds = [];
var dbImageArray = [];
/*
  Pass an e.currentTarget into this method on batch deletion
*/
  deleteImage = function(target){
    // e.preventDefault();
    console.log('Image to Delete: ', target, '\nMultiSelect enabled?', getMultiSelect());
    if(getUserType() === "Contractor") return alert('Contractors are not authorized to delete from the gallery\nArchive feature coming soon!');
    var promptTxt = "Are you sure you want to Delete this Image?";
    if(target.id) if(target.id.indexOf('view=&id=')>-1 || target.id.indexOf('../media/')>-1 ) addToSelect(target.target.querySelector('img.vert'));
    if(getMultiSelect()===true) promptTxt = 'Are you sure you would like to delete ' + document.body.querySelectorAll('img.multiselected').length + ' images?';

    if(confirm(promptTxt)){
          // if(getMultiSelect() === true)
          return batchDelete(target);
    }else{
      return console.log('CANCEL Delete!');
    }
  }

batchDelete = function(target){
  if(getUserType() === "Contractor") return alert('Contractors are not authorized to delete from the gallery\nArchive feature coming soon!');
  console.log('Batch Delete Requested : ', target);
  // if(target.id.indexOf('view=&id=')) addToSelect(target.target.querySelector('img.vert'));
  deleteGal = currentGallery;
  showMultiOptions(false);

  var thumbnails = document.body.querySelectorAll('img.multiselected');
  if(thumbnails.length === 0) {
    if(target.id) if(target.id.indexOf('_delete')>-1){
      var v = target.id.replace('_delete', '');
      v = getUserProxy() + v;
      console.log('\nV = ', v);
      thumbnails = [document.getElementById(target.id)]
      // thumbnails = [document.getElementById(v)]
      console.log('\n\nthumbnails = ', thumbnails);
    }
  }
  var ids = [];
  setMultiSelect(false);
  // multiSelect = false;
  thumbnails.forEach((thum)=>{
    var id = thum.id;
    console.log('delete id : ', id);
    // if(id.indexOf('_delete')>-1) id = id.replace('_delete', '')
    // if(!id)
    if(id.length > 10){
      if(id.indexOf('_delete')>-1) id = id.substring(0, id.indexOf('_delete'))
      else id = thum.parentNode.querySelectorAll('.delete')[0].id;
    }
    if(id === "null" || !id) id = thum.id;
    console.log('\nnew ID = ', id);
    if(id.indexOf('_delete')>-1) id = id.substring(0, id.indexOf('_delete'))
    id = parseForGoogleID(id);
    // id = getUserProxy() + id
    // if(id.indexOf('https://drive.google.com')>-1) id = id.substring(id.indexOf('&id=')+'&id='.length);
    // if(id.indexOf('&time=')>-1) id = id.substring(0, id.indexOf('&time='))
    ids.push(id);
  });
  if(ids.length === 0) return setMultiSelect(false); //multiSelect = false;

  removeThumbnails(thumbnails);

  console.log('Batch Delete Images : ', ids);
  var xhr = $.ajax({
    type: "POST",
    url: '/deleteimages/',
    dataType: 'json',
    retryLimit: 1,
    data:{
      googleIDs: ids
    },
    success: function(returnedDelete){
      console.log('\n\nPOST-REQUEST :: Delete Success!\n', returnedDelete);
      xhr.abort();
      // removeThumbnails(thumbnails);
    },
    error: function(err, textStatus, errThrown){
      console.log('\n\nPOST FAILED DELETION ERROR : ', err,
        '\nTextStatus = ', textStatus, '\nError Throuwn : ', errThrown, '\nstatusCode = ', '', '\nprogress = ', '', '\nerror number : ');
        // test a GET request to the potential ZIP file location from the batchdownload-
        // on error --> stop timer
        var error_message = 'Failed to Delete Images';
        if(err.responseJSON){
          var error = err.responseJSON;
          error_message += '\n' + error.error;
        }
        error_message += '\nPlease refresh the page'
        xhr.abort();
        alert(error_message);
      return true;
    }
  });
  setMultiSelect(false); //multiSelect = true;
}

removeThumbnails = function(thumbnails){
  var numFinished = 0;
  thumbnails.forEach((thum)=>{
    numFinished++;
    console.log('batch images # ', numFinished);
    removeThumb(thum);

    // try{thum.parentNode.parentNode.parentNode.removeChild(thum.parentNode.parentNode);}catch(e){console.log('Batch Delete Images COUNT LABEL ERROR : \n',e);}
    if(numFinished === thumbnails.length-1 || thumbnails.length === 1){
      console.log('Batch images completed: ', thumbnails.length-1);
      showMultiOptions(false);
      displayResize();
      if(thumbnails.length != 1) numFinished ++;
      var gcount = Number(getImageCount()) - numFinished;
      setImageCount(gcount);
      console.log('\n\n\nGET GAL COUNT - numFinished = \n', getImageCount(), ' - ', numFinished);
      setImageCountLabel({count: gcount, gallery: currentGallery.replace('_tab', '').toLowerCase()});

      var subcount = getSubPeriod() + '_count';
      var fiC = getFilteredCount().count;
      if(!fiC || fiC === NaN) fiC = 0;
      // console.log('\n\nSub Period Attached to Successful upload : ', filterCount,
      //   '\n\n COUNT = fiC: ', fiC);
      // setFilteredCountLabel({sub_folder: subcount, count: fiC});

      if(getSubPeriod() && getUserType() != "Contractor"){
        var filObj = getFilteredCount();
        console.log('\n\nBatch Delete SubFolder : ', filObj, '\nnumFinished: ', numFinished);
        setFilteredCountLabel({gal: currentGallery.substring(0,1).toUpperCase() + currentGallery.substring(1).replace('_tab', ''), count: gcount});
        setFilteredCountLabel({count: filObj.count - numFinished, gal: filObj.sub_folder.replace('_count','')});
      }
      else setFilteredCountLabel({gal: currentGallery.substring(0,1).toUpperCase() + currentGallery.substring(1).replace('_tab', ''), count: gcount});
    };
  });
}

removeThumb = function(thum){
  var t = thum.parentNode.parentNode;
  if(t.className.indexOf('thumbnail')=== -1) t = thum.parentNode.parentNode.parentNode;
  if(t.className.indexOf('thumbnail')>-1 -1){
    try{t.parentNode.removeChild(t);}catch(e){console.log('Batch Delete Images COUNT LABEL ERROR : \n',e);}
  }
}

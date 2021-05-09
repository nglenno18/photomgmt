var socket = io();
var user_width = 450;
var prevBoxID = 0;
var index = 0;
const previewID = 'photoPreviewContainer';
var addToGallery = function(){};
var destinationChecked = false;
var folderID = false;
var currentFolder= false;

socket.on('connect', function(){
  //GET THE ASPECT RATIO
  var h;
  var w;

  checkDestination = function(callback){
	// if(destinationChecked === false){
		destinationChecked = true;
			// THIS IS WHERE THERE NEEDS TO BE one call to the GDrive direct to verify the destination Folders
			var gal=false;
      var woItem = currentWorkOrder.work_order;
			if(getGalleryTag()) gal = getGalleryTag().replace('_tab','');
      var folder = getFolderTag();
      if(folder && !woItem){
        woItem = folder;
        // gal = null;
      }
		socket.emit('verifyDestination', {propertyID: propID, workOrder: woItem, gallery:gal}, function(ret){
			  console.log('Checked for VALID DESTINATIONS!:', ret);
			  destinationChecked = true;
			  folderID = ret.id;
			  return callback(ret.id);
		});
	// }
  }
});

createNewImageContainer = function(container, name){
  console.log('\n\n\n\n\n\n\nCREATING NEW CONTAINER : ', container);
  var clone = document.getElementById(previewID).cloneNode(true);
  clone.id = name;
  // console.log('Clone Node : ', clone);
  return document.getElementById('imageP').appendChild(clone);
}

// scaleAndDisplay = function(evt, container){
//   // console.log('Scale to Container: ', evt, container);
//   var files = evt.currentTarget.files;
//   var length = event.currentTarget.files.length;
//   var selectedBox = event.currentTarget;
//   // console.log('SELECTED BOX : ', selectedBox);
//
//   // console.log('Files to upload: ', files);
//   for(x = 0; x <= length-1; x++){
//     prevBoxID ++;
//     var i = event.currentTarget.files[x];
//
//     var i = URL.createObjectURL(i);
//     var extraParams = {box: prevBoxID};
//     index++;
//
//     //GET THE ASPECT RATIO
//     var h;
//     var w;
//     var previewBox = document.getElementById(container);
//     var id = ''+index-1;
//     id = previewBox.id;
//     try {
//       previewBox.title = event.currentTarget.files[x].name;
//     }catch(e){
//       createNewImageContainer(document.getElementById(id).parentElement, container);
//       previewBox = document.getElementById(container);
//     }finally{
//       previewBox.title = event.currentTarget.files[x].name;
//     }
//
//     /*
//       UPDATE THE PREVIEW IMAGE DISPLAY
//           *previewBox id = "imageC"*
//       changes the clickable preview file upload box to the correct image source
//     */
//     console.log('UPDATE PREVIEW IMAGE : ', previewBox);
//     $('#'+previewBox.id).html(
//       // "<a class=\"imageC\" id=\"imageC\" title=\"" + event.currentTarget.files[x].name +"\">"+
//       "<img class=\"uploads\" id=\""+ event.currentTarget.files[x].name + "\" class=\"img\" src=\""+ i + "\" border=\'1\' object-fit=\"contain\"></img>"
//       // "<img class=\"img\" src=\""+ i + "\" align=\"center\" width=\"300px\" height=\"300px\" object-fit=\"contain\"></img>"
//       // + "</a>"
//     );
//
//     var im = document.getElementById(event.currentTarget.files[x].name);
//     im.onload = function(evt){
//       // console.log(evt);
//       console.log(evt.target.naturalHeight);
//       console.log(evt.target.naturalWidth);
//       var sh = evt.target.naturalHeight;
//       var sw = evt.target.naturalWidth;
//       var scale= Math.min((user_width/sw),(user_width/sh));
//       var iwScaled=sw*scale;
//       var ihScaled=sh*scale;
//       // console.log('\n\nSCALING: ', evt.target);
//       evt.target.width = iwScaled;
//       evt.target.height = ihScaled;
//       console.log('\n\nScaled: ', evt.target);
//       /*
//         when the image is loaded, re-initialize the fileDialog listener on the image
//         (make the NEW image clickable again)
//       */
//       // console.log('Initi FileChange Listener for Preview Box [im.onload()] : ', evt.target);
//       initFileChangeListeners(evt.target);
//     };
//     console.log(im);
//     var iw= im.src.width;
//     console.log(im.src.naturalHeight);
//     console.log(iw);
//
//     ///
//     var array = [];
//     // console.log(evt);
//     /*
//       ADD THE IMAGE to the "gallery" or collection
//     */
//     var newImageID = 'newImage' + index;
//     var newCanvasID = 'newCanvas' + index;
//     $("body").append("<img id='" + newImageID + "' src='"+i+"' />");
//     var width = $('#'+newImageID).width();
//     var height = $('#'+newImageID).height();
//     $("body").append("<canvas id='" + newCanvasID + "'/>");
//
//     var canvas = document.getElementById(newCanvasID).getContext('2d');
//     var cimg = new Image();
//     cimg.onload= function(){
//       // console.log('Drawing Canvas: ', cimg);
//       console.log(width, height);
//       console.log(cimg.height, cimg.width);
//       // canvas.drawImage(cimg, 0, 0, cimg.width, cimg.width*(cimg.height/cimg.width));
//       canvas.drawImage(cimg, 0, 0, cimg.width, cimg.height);
//       initFileChangeListeners(document.getElementById(newImageID));
//     }
//     cimg.src = i;
//     if(window.location.href.indexOf('batch.html') === -1){
//       console.log('NewImage - ', x);
//       $('#'+newImageID).remove();
//       $('#'+newCanvasID).remove();
//     }
//     console.log(width, height);
//
//
//     // CALCULATE height
//     // console.log('\n\nWindow HEIGHT: ', $(window).height());
//     // console.log('\n\nDocument HEIGHT: ',$(document).height());
//     // console.log('\n\Container HEIGHT: ',$('#page-container').height());
//     var height = $(document).height();
//     console.log(height/.8);
//     $('#page-container').height(height-200);
//   }
// }

/*
  previewImages should
*/
var lazyInd = 1;
// previewImages = function(files, container, batch, callback){
// 		  var file = files[0];
//   	  'BATCH REQUEST :!'
//   	  var dbArray = [];
//   	  console.log('prev Img: ', callback);
// 	  if(!files.name){
//       lazyInd = files.length;
//   		Array.from(files).forEach((file)=>{
//   		  previewImages(file, container, true, callback);
//   		});
// 		  adjustGallery();
//       displayResize();
// 	  }else{
//   		console.log('\n...Previewing Images: ', files);
//   		var img = document.createElement("img");
//   		img.classList.add('obj');
//   		img.file = file;
//   		var filename = '';
//   		var fileBox = document.getElementById("filename");
//   		var imageC = document.getElementById(container);
//   		var imageCImg = imageC.getElementsByTagName("img")[0];
//   		var reader = new FileReader();
//   		reader.onload = (function(image){
//   		  return function(e){
//           console.log('loading Previewed Image...\nFiles.Name', files.name, '\nfiles.ID: ',files.id);
//   			imageCImg.style.marginLeft = 'var(--standard_Padding)';
//   			imageCImg.style.marginRight = 'var(--standard_Padding)';
//   			imageCImg.src = e.target.result;
//   			imageCImg.title = files.name || files.id;
//   			imageCImg.style.objectFit = 'cover';
//   			filename.value = files.name;
//   			  console.log('BOX: ', e.target);
//
//   			  addToGallery(e.target.result, imageCImg, batch, callback);
//
//   			  setTimeout(()=>{
//     				displayResize(e);
//     				// adjustGallery();
//   			  }, 100);
//   		  };
//   		})(img);
//
//   		try {
//   		  reader.readAsDataURL(files);
//   		} catch (e) {
//   		  console.log(e);
//   		}
// 	  }
// }

	addToGallery = function(imageData, containerImg, batch, callback){
	  // console.log('\n\nAdd Image to Gallery : ', '\n\n', containerImg, '\n\n', dimensions);
	  console.log('Prep for\n\n\nCONTAINER : ', containerImg, batch, callback);

    addThumbnail(imageData, {name: containerImg.title, id:null, timestamp:containerImg.timestamp}, true);
    lazyInd = lazyInd-1;
    console.log('L-El lazyInd : ',lazyInd);
    if(lazyInd === 0){
      refresh = true;
      setTimeout(function(){
        $(function() {
          console.log('L-Element Loading ! \n', $('.lazy'));
              $('.lazy').Lazy({
                scrollDirection: 'vertical',
                effect: 'fadeIn',
                visibleOnly: true,
                appendScroll: document.getElementById('dropdown_gallery'),
                onError: function(element) {
                    console.log('L-Element error loading ' + element.data('src'));
                  },
                beforeLoad: function(element) {
                  // called before an elements gets handled
                  console.log('L-Element Will Load : ', element);
                },
                afterLoad: function(element){
                  console.log('L-Element Loaded! ', element);
                },
                onLoad: function(element){
                  console.log('ELEMENT could not be loaded! ');
                },
                onFinishedAll: function() {
                    if( !this.config("autoDestroy") )
                        this.destroy();
                }
              });
          });
      }, 5000);
      displayResize();
    }
	  var callbackFunc = addToDB;
	  if(batch) {
		  callbackFunc = batchToDB;
	  }
	  console.log('PROPERTY/WO combo : ', propID, folderID);
	   // if(!callbackFunc) throw Error;
	  addToGDrive(imageData, containerImg.title, {propertyID:propID, folderID: folderID}, callbackFunc);
	}

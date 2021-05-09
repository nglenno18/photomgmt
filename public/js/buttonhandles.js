const PUBLIC_IMAGES = 'images';

var addButtonMovements = function(eleList){
  console.log('\n\nAddButton listener movements');
  var list = document.getElementsByClassName('photoButtons');
  console.log('LIST: ', list);
    Array.from(list).forEach((element)=>{
      element.addEventListener('mouseover', buttonMovements);
      element.addEventListener('mouseup', buttonMovements);
      element.addEventListener('mouseout', buttonMovements);
      element.addEventListener('mousedown', buttonMovements);
      element.addEventListener('touchstart', buttonMovements);
      element.addEventListener('touchend', buttonMovements);
    });
}

var buttonMovements = function(e){
  console.log(e);
  console.log('TARGET SRC', e.target.src);
  var ei = e.target;
  var tSrc = srcPathDetails(e.target.src);
  console.log('srcPathDetails(e.target.src) : ', tSrc);
  var fileType = tSrc.fileType;
  var publicSub = tSrc.publicSub;
  tSrc = tSrc.tSrc;

  if(e.type === 'mouseover' || e.type === 'mouseup'){
    tSrc = tSrc + '_' + 'highlighted' + fileType;
    console.log('Calced tSrc : ', tSrc);
  }else if(e.type === 'mouseout' || e.type === 'touchend'){
    tSrc = tSrc + '_' + 'enabled' + fileType;
    console.log('Calced tSrc : ', tSrc);
  }else if(e.type === 'mousedown' || e.type === 'touchstart'){
    tSrc = tSrc + '_' + 'pressed' + fileType;
  }
  tSrc = publicSub + tSrc;
  console.log('Full tSrc : ', tSrc);
  try {
    if(ei.className.indexOf('inactive') === -1){
      ei.src = '../' + tSrc;
    }
  }catch(e){}
}

srcPathDetails = function(source){
  var tSrc = source.substring(source.lastIndexOf('/'));
  // var tSrc = tSrc.substring()
  var fileType = source.substring(source.lastIndexOf('.'));
  // var publicSub = source.substring(source.lastIndexOf('/'));
  // publicSub = publicSub.substring(0, publicSub.lastIndexOf('/'));
  var publicSub = PUBLIC_IMAGES;
  if(tSrc.indexOf('_')>-1) tSrc = tSrc.substring(0, tSrc.indexOf('_'));
  console.log('tSrc : ', tSrc);
  return {
    tSrc, fileType, publicSub
  }
}

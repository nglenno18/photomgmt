
function setPopup(stringText, position, element){
  console.log('Set Pop Alert! \n',stringText);
  var position = 'fixed';
  var margin = '15px auto';

  var div = document.createElement('div');
  div.style.minWidth = '300px';
  div.style.width = '70%';
  div.style.minHeight = '50px';
  div.style.marginLeft = '12%';
  div.style.marginRight = '12%';
  div.style.top = '30%';
  try {
    div.style.top = document.getElementById('search').offsetTop + document.getElementById('search').offsetHeight + 6;
  } catch (e) {
    console.log('Error fetching location of search bar element:\n', e)
  }
  div.style.zIndex = 101;
  div.style.position = position;
  div.style.borderRadius = '5px';
  div.style.backgroundColor = 'whitesmoke';
  // div.style.margin = margin || '15px auto';
  div.style.boxShadow = 'grey -1px -1px 4px 2px inset, white 9px 8px 20px 2px inset, lightgrey -1px -1px 14px 10px inset';
  var backDiv = div.cloneNode(true);
  backDiv.style.opacity = 0.5;
  backDiv.style.zIndex = 100;
  backDiv.style.boxShadow = 'black 6px 14px 15px 0px';

  div.style.border = 'var(--standard_border)';
  div.style.borderColor = 'grey';
  div.style.borderWidth = '0px';

  div.innerHTML = '<p style="margin: 10px auto; width: inherit; position:relative; top:7px">' + stringText + '</p>';

  div.style.textAlign = 'middle;'
  var opac = 1;
  document.body.appendChild(div);
  document.body.appendChild(backDiv);
  var anim = setInterval(function(){
    console.log('adjust opacity : ', opac);
    opac = opac -0.02;
    if(opac < 0.5) backDiv.style.opacity = opac;
    if(opac>0.02) div.style.opacity = opac;
    else{
      try{
        div.style.display = "none";
        backDiv.style.display = "none";
        // document.body.removeChild(div);
        // document.body.removeChild(backDiv);
        div.parentNode.removeChild(div);
        backDiv.parentNode.removeChild(backDiv);
      }catch(e){
        console.log(e);
      }
      clearInterval(anim);
    }

  }, 50)
}

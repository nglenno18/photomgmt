var isUploading = false;
var alertTimer = false;

getSentStatus = function(){
  return this.isUploading;
}

alertSent = function(truefalse){
  if(truefalse != true){
    this.isUploading = false;
    this.alertTimer = false;
    return false;
  };
  this.isUploading = true;
  this.alertTimer = setTimeout(function(){
    this.isUploading = false;
  }, (120 * 1000));  // 20 seconds
}

uploadAlert = function (params){
  console.log('Send email alert to property specialist!\nContractor has uploaded images to this property : \n', params);
  var thisjx = $.ajax({
    type:'POST',
    dataType: "json",
    // contentType: "application/json",
    url: '/workflow-upload/',
    data: {
      params
    },
    success: function(successresult){
      console.log('\nemail alert SUCCESS RESULT : ', successresult);
      console.log('\n\nemail alert SUCCESS: ', this.data);
      thisjx.abort();
    },
    error: function(errResult){
      console.log('POST REQUEST FAILED\n\tError : \n', errResult);
      thisjx.abort();
    }
  });
  alertSent(true);
}

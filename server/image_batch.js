var request_list = {fill: null}

initializeRequestList = function(){
  this.request_list = {};
  return this.request_list;
}
getRequestList = function(){
  return this.request_list;
}
addRequest = function(requ){
  console.log('\n\nAdd Request : ', requ.batchID, '\nindex: ', requ.index);
  var rl = getRequestList();
  if(!rl){
    rl = initializeRequestList();
    rl[requ.batchID] = requ;
  }else{
    var isNew = (rl[requ.batchID]);
    console.log('requestList exists, check for requ : ', requ.batchID);
    if(!isNew) rl[requ.batchID] = requ;
    else{
      rl[requ.batchID].index++;
    }
  }
  rl[requ.batchID].res = requ.res;
  return rl[requ.batchID];
}
removeRequest = function(id){
  console.log('removing batch request from current list : ', id);
  delete getRequestList()[id];
  return true;
}

completeRequest =function(err, noti_ID, folderDirectory){
  console.log('\nall files rotated from request...\nerr : ', err, '\nnotification_id: ', noti_ID, '\nfolderDirectory : ', folderDirectory);
  var currentRes = getRequestList()[noti_ID].res;
  console.log('\n\nRequest Number : ', getRequestList()[noti_ID].index);

  // check to make sure this connection is active
  getRequestList()[noti_ID].complete = true;

  try {
    var deleted = deleteDirectory(folderDirectory)
  } catch (e) {
    console.log('\nerror deleting batchrotation temp directory : ', deleted);
  }

  if(err) {
    console.log('\n********************ERROR THROWN DURING batchRotate : ', err);
    var sta = 500;
    if(err.status) sta = err.status
    return currentRes.status(500).send(err);
  }else{
    return currentRes.status(200).send({noti_ID});
  }
}

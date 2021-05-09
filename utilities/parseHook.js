const BIDREPAIRS = process.env.BIDREPAIRS;
const INSPECTIONS = process.env.INSPECTIONS;
const BILLING = process.env.BILLING;

parseForPayload = function(request){
  var body = request.body;
  var payload = body;
  if(body.Payload) payload = JSON.parse(body.Payload);
  return payload;
}

updateFlag = function(payload){
  console.log('\n\nUPDATE FLAG ??\n', payload);
  if(payload.UpdateFlag === "true") return true;
  return false;
}

parseFor = function(field, payload){
  if(payload[field]) return payload[field];
  else{
    if(payload.Data[field]) return payload.Data[field];
  }
  return false;
}

parseForTable = function(payload){
  var table;
  if(payload.TableName) table = payload.TableName;
  else return false;
  table = table.toLowerCase().trim();
  if(table.indexOf('inspection')>-1){
    return INSPECTIONS;
  }else if(table.indexOf('repairs')>-1){
    return BIDREPAIRS;
  }else if(table.indexOf('billing')>-1){
    return BILLING;
  }else if(table.indexOf('vendor')>-1){
    return 'vendor';
  }
  return table;
}

parseForKey = function(t){
  var table = t.toLowerCase();
  var key = 'UniqueID';
  if(t.indexOf('vendor')>-1){
    return 'User_key';
  }else if(t.indexOf('billing')>-1){
    return 'Key';
  }
  return key;
}

var timerList = {};

/*
  BASIC timer function to increment a timer by the second.
  @param {notifObj} : notification Object where want the timerdata display
  @return {interval()} : return an interval function to increment time by seconds

  If object is passed as parameter, call an update method on the object inside the interval
*/
timerFunction = function(notifObj){
  var second = 0;
  var minute = 0;
  var id = Math.random().toString().substring(2,10);
  var timeID = new Date();

  var timeObj = {
    second, minute, id, timeID
  }

  var ele = notifObj;
  if(notifObj) if(!notifObj.id) notifObj = document.getElementById(notifObj);

  console.log('\n\nTIMER FUNCTION : ', timeObj.id);

  return setInterval(function(){
    second ++;
    var newTime = shiftTime({minute, second});
    second = newTime.second;
    minute = newTime.minute;
    if(notifObj) updateNotifTime({ele: notifObj, minute:newTime.minutetxt, second: newTime.secondtxt});
  }, 1000);
}

shiftTime = function(timeObj){
  var second = timeObj.second;
  var minute = timeObj.minute;
  if(second === 60){
    second = 0;
    minute ++;
  }
  var secondtxt = ''+second;
  var minutetxt = ''+minute;
  if(minute < 10) minutetxt = '0' + minute;
  if(second < 10) secondtxt = '0' + second;
  return {
    minutetxt, secondtxt, minute, second
  }
}

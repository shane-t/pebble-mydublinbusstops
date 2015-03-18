/*jslint multistr: true */

var UI = require('ui'),
    ajax = require('ajax'),
    items = [{
      title: 'Bird Avenue',
      subtitle: 'Roebuck Road',
      stopNumber : '00861'
    },{
      title : 'Corrig Road',
      subtitle : 'Blackthorn Road',
      stopNumber : '00449'
    }
],
    
menu = new UI.Menu({
  sections: [{
    title: 'My Dublin Bus stops',
    items : items  
  }]
});

menu.on('select', function (e) {
  var stopNumber = items[e.itemIndex].stopNumber,
      requestBody = '<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope"> \
    <Body> \
        <GetRealTimeStopData xmlns="http://dublinbus.ie/"> \
            <stopId>'+stopNumber + '</stopId> \
            <forceRefresh>true</forceRefresh> \
        </GetRealTimeStopData> \
    </Body> \
</Envelope>';
  
  console.log('getting RT data for ' + stopNumber);

  
  ajax({
    url : 'http://rtpi.dublinbus.ie/DublinBusRTPIService.asmx',
    method : 'post',
    type : 'text',
    cache : false,
    data :requestBody,
    headers : {
      'Content-Type' : 'application/soap+xml; charset="UTF-8"'
    },
  }, function (data, status, request) {
    var matches = getMatches(data),
        menuStructure = [], i, stopMenu;
    
    for (i=0;i<matches.length;i++) {
      menuStructure.push({
        title : matches[i].route + ' ' + matches[i].destinationName,
        subtitle : matches[i].when
      });
    }
        
    stopMenu = new UI.Menu({
      sections : [
        { 
          title : stopNumber,
          items : menuStructure
        }
      ]
    });
    
    stopMenu.show();
    
  }, function (error, status, request) {
    console.log("Error: " + status + ":" + error);
  });
    
});

function getMatches (data) {
  var routes = data.match(/<MonitoredVehicleJourney_PublishedLineName>(.*?)<\/MonitoredVehicleJourney_PublishedLineName>/g),
      destinationNames = data.match(/<MonitoredVehicleJourney_DestinationName>(.*?)<\/MonitoredVehicleJourney_DestinationName>/g),
      expectedTimes = data.match(/<MonitoredCall_ExpectedArrivalTime>(.*?)<\/MonitoredCall_ExpectedArrivalTime>/g),
      //aimedTimes = data.match(/<MonitoredCall_AimedArrivalTime>(.*)?<\/MonitoredCall_AimedArrivalTime>/g),
      i = 0, results = [],
      
      route = "",
      destinationName = "",
      expectedTime = null,
      //aimedTime = null,
      diffmillis = 0,
      minutes = 0,
      secs = 0;
  
  for (i=0;i<routes.length;i++) {
    
    route = routes[i].replace(/<[^>]*>/g, '');
    
    destinationName = destinationNames[i].replace(/<[^>]*>/g, '');
   
    expectedTime = new Date(expectedTimes[i].replace(/<[^>]*>/g, ''));

    //aimedTime = new Date(aimedTimes[i].replace(/<[^>]*>/g, ''));
    
    diffmillis = expectedTime - new Date();
    
    secs = parseInt((diffmillis % 60000) / 1000);
    
    minutes = parseInt(diffmillis / 60000);    
    
    results.push({
      route : route,
      destinationName : destinationName,
      when : minutes + "m " + secs + "s"
    });
    
  }
  
  return results;
}

menu.show();
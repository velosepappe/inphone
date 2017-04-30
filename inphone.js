function someCallback (data) {
	console.log(data);
};

var endpoints;
function getEndpointStatus(){
	var demoEndpoints = [
	  {
		"technology": "SIP",
		"resource": "sam",
		"state": "online",
		"channel_ids": []
	  },
	  {
		"technology": "SIP",
		"resource": "webrtc",
		"state": "unknown",
		"channel_ids": []
	  },
	  {
		"technology": "SIP",
		"resource": "tlspc",
		"state": "unknown",
		"channel_ids": []
	  },
	  {
		"technology": "IAX2",
		"resource": "demo",
		"state": "unknown",
		"channel_ids": []
	  },
	  {
		"technology": "SIP",
		"resource": "tlsandroid",
		"state": "online",
		"channel_ids": []
	  }
	];
	return demoEndpoints;
}

function updateStatus(){
	endpoints = getEndpointStatus();
	  var items = [];
	$.each( endpoints, function( key, val ) {
		items.push( "<div id='" + val.resource + "' class='endpoint endpoint_state_" + val.state + "'>" + val.resource + " : " + val.state + "</div>" );
	});
 
  $( "<div/>", {
    "id": "endpointList",
    html: items.join( "" )
  }).appendTo( "div#main" );
}

$(document).ready(function(){
	console.log("Work allready!");

	$.ajax({
	  url: "http://vanloocke.synology.me:8088/ari/endpoints",
		data: {
			'api_key': 'samme:demo'
		},
	  dataType: 'json',
	  result:someCallback,
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
	
	updateStatus();
});
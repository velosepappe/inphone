function someCallback (data) {
	console.log(data);
};

var endpoints;
function getDemoEndpointStatus(){
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

function getEndpointStatus(){
	var endpointStatus = null;
	$.getJSON({
		url: "http://vanloocke.synology.me:8088/ari/endpoints",
		data: {
			'api_key': 'samme:demo'
		},
		success: function(data){
			endpoints = data;
			render();
		},
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
	
	return endpointStatus;
}

function updateStatus(){
	getEndpointStatus();
}
function render(){
	var items = [];
	$.each( endpoints, function( key, val ) {
		var endpointActive = val.channel_ids.length > 0?"active":"inactive";
		var endpointHtml = "<div id='" + val.resource + "' class='endpoint'>" + val.resource + " :  (" + val.channel_ids.length + ")<div class='endpoint_state " + val.state + "'>" + val.state + "</div><div class='endpoint_activitystatus " + endpointActive + "'>" + val.channel_ids.length + "</div><div class='volumemeter'><img src='volume.png' height='60'></img></div><div class='button mute'>mute</div></div>" ;
		items.push(endpointHtml);
	});
  $("#endpointList").remove();
  $( "<div/>", {
    "id": "endpointList",
    html: items.join( "" )
  }).appendTo( "div#main" );
}

$(document).ready(function(){
	updateStatus();
	window.setInterval(function(){updateStatus()}, 5000);
});
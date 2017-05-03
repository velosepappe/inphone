$(document).ready(function(){
	updateStatus();
	silenceTresholdExcededEvent("sam");
	window.setInterval(function(){updateStatus()}, 5000);
	window.setInterval(function(){silenceTresholdExcededEvent("sam")}, 12000);
});

var endpoints;
var endpointModifiers = [];

function updateStatus(){
	getEndpointStatus();
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
			refresh();
		},
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
	
	return endpointStatus;
}

function applyMutableModifier(resource, mute){
	if(mute){
		$("div.endpoint#"+resource).addClass("mutable");
	}
	else{
		$("div.endpoint#"+resource).removeClass("mutable");
	}
}

function refresh(){
	$("#endpointList").empty();
	$.each( endpoints, function(index, endpoint ) {
		var endpointElement = createEndpointElement(endpoint);
		endpointElement.appendTo("#endpointList");
	});
	
	$.each( endpointModifiers, function(index, endpointModifierList){
		if(endpointModifierList.silenceTresholdExceded != null){
			applyMutableModifier(endpointModifierList.resource, endpointModifierList.silenceTresholdExceded);
		}
	});
}

function createEndpointElement(endpoint){
	var endpointElement = $( "<div/>",{"id":endpoint.resource,"class":"endpoint"});
	createEndpointHeaderElement(endpoint).appendTo(endpointElement);
	createEndpointStateElement(endpoint).appendTo(endpointElement);
	createEndpointActivityStatusElement(endpoint).appendTo(endpointElement);
	createEndpointVolumeMeterElement(endpoint).appendTo(endpointElement);
	createEndpointMuteButtonElement(endpoint).appendTo(endpointElement);
	return endpointElement;
}

function createEndpointHeaderElement(endpoint){
	return $( "<div/>",{"class":"header",html:endpoint.resource + " :  (" + endpoint.channel_ids.length + ")"});
}

function createEndpointStateElement(endpoint){
	return $( "<div/>",{"class":"endpoint_state " + endpoint.state ,html:endpoint.state});
}

function createEndpointActivityStatusElement(endpoint){
	var endpointActive = endpoint.channel_ids.length > 0?"active":"inactive";
	return $( "<div/>",{"class":"endpoint_activitystatus " + endpointActive ,html:endpoint.channel_ids.length});
}

function createEndpointVolumeMeterElement(endpoint){
	var el = $( "<div/>",{"class":"volumemeter"});
	$("<img/>",{src:"volume.png",height:"60"}).appendTo(el);
	return el;
}

function createEndpointMuteButtonElement(endpoint){
	var buttonElement = $( "<div/>",{"class":"button mute",html:"mute"}).click(function(){setMuteModifier(endpoint.resource, false)});
	return buttonElement;
}

function silenceTresholdExcededEvent(endpointResource){
	setMuteModifier(endpointResource, true);
}

function setMuteModifier(endpointResource, mute){
	var endpoints = $.grep(endpointModifiers, function(e){ return e.resource == endpointResource; });
	if(endpoints.length == 0){
		var newEndpoint = {"silenceTresholdExceded":mute,"resource":endpointResource};
		endpointModifiers.push(newEndpoint);
	}
	else if(endpoints.length == 1) {
		endpoints[0].silenceTresholdExceded=mute;
	}
	applyMutableModifier(endpointResource, mute);
}
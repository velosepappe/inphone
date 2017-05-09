$(document).ready(function(){
	updateStatus();
	window.setInterval(function(){updateStatus()}, 5000);
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
	
	$.get({
		url: "http://localhost:3000/",
		success: function(data){
			var endpointsOverTreshold = JSON.parse(data);
			$.each( endpoints, function(index, endpoint ) {
				var endpointTresholdStatus = endpointsOverTreshold[endpoint.resource];
				if(endpointTresholdStatus != null && endpointTresholdStatus.state != null){
					endpoint.talkState = endpointTresholdStatus.state;
					endpoint.timestamp = endpointTresholdStatus.timestamp;
					setMuteModifier(endpoint.resource,endpointTresholdStatus.state);
					setTimestampModifier(endpoint.resource,endpointTresholdStatus.timestamp);
				}
			});
			refresh();
		},
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
	
	return endpointStatus;
}

function refresh(){
	$("#endpointList").empty();
	createEndpointTable().appendTo("#endpointList");
	processModifiers();
}

function createEndpointTable(){
	var endpointTable = $("<table/>",{"class":"table"});
	createTableHead().appendTo(endpointTable);createTableBody().appendTo(endpointTable);
	return endpointTable;
}

function createTableHead(){
	return $("<thead/>").append(createHeadRow());
}

function createHeadRow(){
	var tr = $("<tr/>");
	tr.append($("<th/>",{html:"Naam"}));
	tr.append($("<th/>",{html:"Status"}));
	tr.append($("<th/>",{html:"Activiteit"}));
	tr.append($("<th/>",{html:"Bevestig"}));
	tr.append($("<th/>",{html:"Laatst actief"}));
	return tr;
}

function createTableBody(){
	var tbody = $("<tbody/>");
	$.each( endpoints, function(index, endpoint ) {
		var endpointRow = createEndpointRow(endpoint);
		tbody.append(endpointRow);
	});
	return tbody;
}

function createEndpointRow(endpoint){
	var tr = $("<tr/>",{id:endpoint.resource});
	tr.append(createEndpointIdentifierColumn(endpoint));
	tr.append(createEndpointStateColumn(endpoint));
	tr.append(createEndpointActivityStatusColumn(endpoint));
	tr.append(createEndpointMuteButtonColumn(endpoint));
	tr.append(createTimestampColumn(endpoint));
	if(endpoint.state == "online" && endpoint.channel_ids > 0){
		tr.addClass("active");
	}
	return tr;
}

function createEndpointIdentifierColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_name",html:endpoint.resource});
}

function createEndpointStateColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_state",html:endpoint.state});
}

function createEndpointActivityStatusColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_activitystatus" ,html:endpoint.channel_ids.length});
}

function createEndpointMuteButtonColumn(endpoint){
	var buttonElement = $( "<td/>",{"class":"endpoint_acknowledge"});
	buttonElement.append($("<button/>",{"class":"btn",html:"OK"}));
	return buttonElement;
}

function createTimestampColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_timestamp"});
}

function setMuteModifier(endpointResource, mute){
	var endpoints = $.grep(endpointModifiers, function(e){ return e.resource == endpointResource; });
	if(endpoints.length == 0){
		var newEndpoint = {"silenceThresholdExceded":mute,"resource":endpointResource};
		endpointModifiers.push(newEndpoint);
	}
	else if(endpoints.length == 1) {
		endpoints[0].silenceThresholdExceded=mute;
	}
}

function setTimestampModifier(endpointResource, timestamp){
	var endpoints = $.grep(endpointModifiers, function(e){ return e.resource == endpointResource; });
	if(endpoints.length == 0){
		var newEndpoint = {"timestamp":timestamp,"resource":endpointResource};
		endpointModifiers.push(newEndpoint);
	}
	else if(endpoints.length == 1) {
		endpoints[0].timestamp=timestamp;
	}
}

function processModifiers(){
	$.each( endpointModifiers, function(index, endpointModifierList){
		if(endpointModifierList.silenceThresholdExceded != null && endpointModifierList.silenceThresholdExceded){
			$("tr#"+endpointModifierList.resource + " .btn").addClass("btn-primary");
			$("tr#"+endpointModifierList.resource + " .btn").click(function(){
				setMuteModifier(endpointModifierList.resource, false);
				$.post( "http://localhost:3000/"+ endpointModifierList.resource +"/acknowledge", function( data ) {
					refresh();
				});
			});
			$("tr#"+endpointModifierList.resource).removeClass("active").addClass("danger");
		}
		if(endpointModifierList.timestamp != null){
			$("tr#"+endpointModifierList.resource+" .endpoint_timestamp").html(parseTime(endpointModifierList.timestamp));
		}
	});
}

function parseTime(timestamp){
	return timestamp.split("T")[1].split(".")[0];
}
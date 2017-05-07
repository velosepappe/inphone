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
			console.log(endpointsOverTreshold);
			$.each( endpoints, function(index, endpoint ) {
				var endpointTresholdStatus = endpointsOverTreshold[endpoint.resource];
				if(endpointTresholdStatus != null){
					setMuteModifier(endpoint.resource,endpointTresholdStatus);
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
//	$.each( endpoints, function(index, endpoint ) {
//		var endpointElement = createEndpointElement(endpoint);
//		endpointElement.appendTo("#endpointList");
//	});
	
//	$.each( endpointModifiers, function(index, endpointModifierList){
//		if(endpointModifierList.silenceThresholdExceded != null){
//			applyMutableModifier(endpointModifierList.resource, endpointModifierList.silenceThresholdExceded);
//		}
//	});
}

function createEndpointTable(){
	var endpointTable = $("<table/>",{"class":"table"});
	createTableHead().appendTo(endpointTable);
	var body = createTableBody();
	body.appendTo(endpointTable);
	
	
	return endpointTable;
}

function processModifiers(){
	$.each( endpointModifiers, function(index, endpointModifierList){
		if(endpointModifierList.silenceThresholdExceded != null){
			var endpointStatus = "success";
			if(endpointModifierList.silenceThresholdExceded){
				endpointStatus = "danger";
				$("tr#"+endpointModifierList.resource + " .btn").addClass("btn-primary");
			}
			$("tr#"+endpointModifierList.resource).addClass(endpointStatus);
		}
	});
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
	tr.append(createEndpointHeaderColumn(endpoint));
	tr.append(createEndpointStateColumn(endpoint));
	tr.append(createEndpointActivityStatusColumn(endpoint));
	tr.append(createEndpointMuteButtonColumn(endpoint));
	return tr;
}

function createEndpointHeaderColumn(endpoint){
	return $( "<td/>",{"class":"header",html:endpoint.resource});
}

function createEndpointStateColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_state " + endpoint.state ,html:endpoint.state});
}

function createEndpointActivityStatusColumn(endpoint){
	var endpointActive = endpoint.channel_ids.length > 0?"active":"inactive";
	return $( "<td/>",{"class":"endpoint_activitystatus " + endpointActive ,html:endpoint.channel_ids.length});
}

function createEndpointMuteButtonColumn(endpoint){
	var buttonElement = $( "<td/>");
	buttonElement.append($("<button/>",{"class":"btn",html:"OK"}).click(function(){
		setMuteModifier(endpoint.resource, false);
		$.post( "http://localhost:3000/"+endpoint.resource+"/acknowledge", function( data ) {
			refresh();
		});
	}));
	return buttonElement;
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
var serverUrl = config.server.url;

var notificationSound = new Audio("gentle-alarm.mp3");

var endpoints;

$(document).ready(function(){
	updateStatus();
	window.setInterval(function(){updateStatus()}, 5000);
});

function updateStatus(){
	getEndpointStatus();
}

function getEndpointStatus(){
	$.get({
		url: serverUrl,
		success: function(data){
			endpoints = JSON.parse(data);
			refresh();
		},
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
}

function refresh(){
	$("#endpointList").empty();
	createEndpointTable().appendTo("#endpointList");
	notifyIfNecessary();
}

function notifyIfNecessary(){
	if(config.webapp.notificationSoundEnabled && $("tr.danger").length > 0){
		notificationSound.play();
	}
}

function createEndpointTable(){
	var endpointTable = $("<table/>",{"class":"table"});
	createTableHead().appendTo(endpointTable);
	createTableBody().appendTo(endpointTable);
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
	for (var name in endpoints) {
		if (endpoints.hasOwnProperty(name)) {
			tbody.append(createEndpointRow(endpoints[name]));
		}
	}
	
	return tbody;
}

function createEndpointRow(endpoint){
	var tr = $("<tr/>",{id:endpoint.name});
	tr.append(createEndpointIdentifierColumn(endpoint));
	tr.append(createEndpointListeningStateColumn(endpoint));
	tr.append(createEndpointActivityStatusColumn(endpoint));
	tr.append(createEndpointMuteButtonColumn(endpoint));
	tr.append(createTimestampColumn(endpoint));
	if(endpoint.state){
		tr.addClass("danger");
	}
	else if(endpoint.listening){
		tr.addClass("success");
	}
	return tr;
}

function createEndpointIdentifierColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_name",html:endpoint.name});
}

function createEndpointListeningStateColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_listeningstatus",html:endpoint.listening?"online":"offline"});
}

function createEndpointActivityStatusColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_activitystatus" ,html:endpoint.listening?1:0});
}

function createEndpointMuteButtonColumn(endpoint){
	var tdButton = $( "<td/>",{"class":"endpoint_acknowledge"});
	var button = $("<button/>",{"class":"btn",html:"OK"}).appendTo(tdButton);
	
	if(endpoint.state){
		button.addClass("btn-primary");
		button.click(function(){
			endpoints[endpoint.name].state=false;
			$.post( serverUrl + endpoint.name +"/acknowledge", function( data ) {
				refresh();
			});
		});
	}
	return tdButton;
}

function createTimestampColumn(endpoint){
	return $( "<td/>",{"class":"endpoint_timestamp",html:endpoint.timestamp?parseTime(endpoint.timestamp):""});
}

function parseTime(timestamp){
	return timestamp.split("T")[1].split(".")[0];
}
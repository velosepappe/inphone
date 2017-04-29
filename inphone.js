function someCallback (data) {
			console.log(data);
	};

$(document).ready(function(){
	console.log("Work allready!");

	$.ajax({
	  url: "http://vanloocke.synology.me:8088/ari/endpoints",
		data: {
			'api_key': 'samme:demo'
		},
	  dataType: 'json',
	  Origin:'ari.asterisk.org',
	  result:someCallback,
		error: function(xhr, status, error) {
			console.log(status + '; ' + error);
		}
	});
});
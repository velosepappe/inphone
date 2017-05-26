const config = require('./config.js');
const ari = require('ari-client');
const util = require('util');
const http = require('http') ;
const port = config.server.port;

var ConfBridge = require ('./node-confbridge/lib/confbridge.js') 
var endpointsThreshold = {};

function registerNewEndpoint(name){
	endpointsThreshold[name]={};
	if(config.audience.prefix && name.startsWith(config.audience.prefix)){
		endpointsThreshold[name].audience=true;
	}
	endpointsThreshold[name].name=name;
}

function registerNewEndpointIfNeeded(name){
	if(!endpointsThreshold[name]){
		registerNewEndpoint(name);
		endpointsThreshold[name].state = false;
		endpointsThreshold[name].listening = false;
		endpointsThreshold[name].talking = true;
	}
}
 
const requestHandler = (request, response) => {
	var fragments = request.url.split("/");
	var success  =false;
	if(request.method == 'GET'){
		success = true;
	}
	
	// /{resource}/acknowledge
	else if(fragments[2]!= null && fragments[2] == "acknowledge" && request.method == 'POST'){
		console.log("Acknowledge endpoint " + fragments[1]);
		var endpoint = fragments[1];
		endpointsThreshold[endpoint].state = false;
		
		success  = true;
	}
	
	// /{resource}/mute
	else if(fragments[2]!= null && fragments[2] == "mute"){
		var endpoint = fragments[1];
		if(request.method == 'POST'){
			endpointsThreshold[endpoint].talking = false;
		}
		console.log("Set endpoint " + fragments[1] + " talking status " + endpointsThreshold[endpoint].talking);
		success = true;
	}
	
	// /{resource}/talk
	else if(fragments[2]!= null && fragments[2] == "talk"){
		var endpoint = fragments[1];
		if(request.method == 'POST'){
			endpointsThreshold[endpoint].talking = true;
		}
		console.log("Set endpoint " + fragments[1] + " talking status " + endpointsThreshold[endpoint].talking);
		success = true;
	}
	
	if(success){
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Request-Method', '*');
		response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET,POST');
		response.setHeader('Access-Control-Allow-Headers', '*');
		response.setHeader('Content-Type', 'text/html');
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(JSON.stringify(endpointsThreshold));
	}
	else{
		response.end();
	}
}
const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
 
ari.connect(config.asterisk.url, config.asterisk.username, config.asterisk.password, clientLoaded);

function clientLoaded (err, client) {
  if (err) {
    throw err;
  }

  console.log('initializing confbridge');

  var confbridge = new ConfBridge(client);
  
  client.endpoints.list(function(err,ep){
	  if(ep.length){
		  ep.forEach(function(endpoint){
			registerNewEndpointIfNeeded(endpoint.resource);
			console.log('Endpoint registered: ' + endpoint.resource);
		  });
	  }
  });
  client.channels.list(function(err, channels) {
    if (channels.length) {
		channels.forEach(function(channel) {
			var name = channel.caller.name;
			if(name || name === ""){
				name = channel.caller.number;
			}
			registerNewEndpointIfNeeded(name);
			endpointsThreshold[name].state = false;
			endpointsThreshold[name].listening = true;
			console.log('Channel online: ' + name);
		});
    }
  });
  
    // handler for ChannelTalkingStarted event
  function channeltalkingstarted(event, channel) {
	registerNewEndpointIfNeeded(channel.caller.name);
	endpointsThreshold[channel.caller.name].state = true;
	endpointsThreshold[channel.caller.name].timestamp = event.timestamp;
    console.log(util.format(
        'Channel talking started', channel.caller.name));
 
  }
  
  function channeltalkingfinished(event, channel) {
	endpointsThreshold[channel.caller.name].timestamp = event.timestamp;
	console.log(util.format(
        'Channel talking finished', channel.caller.name));
 
  }
  
  function channelStateChanged(event, channel) {
	console.log(util.format(
        'Channel state changed %s:%s', channel.caller.name,event));
 
  }
 
  function stasisStart(event, channel) {
    console.log(util.format(
        'Channel %s has entered the application', channel.name));
	
	registerNewEndpointIfNeeded(channel.caller.name);
	endpointsThreshold[channel.caller.name].listening = true;
    // use keys on event since channel will also contain channel operations
    Object.keys(event.channel).forEach(function(key) {
      console.log(util.format('%s: %s', key, JSON.stringify(channel[key])));
    });
  }

  //when this happens, would the channel even come up on channels.list afterward?
  function stasisEnd(event, channel) {
    console.log(util.format(
        'Channel %s has left the application', channel.name));
	//?why register if not listening anymore?
	registerNewEndpointIfNeeded(channel.caller.name);
	endpointsThreshold[channel.caller.name].listening = false;
  }
  
  client.on('ChannelTalkingStarted', channeltalkingstarted)
  client.on('ChannelTalkingStarted', channeltalkingfinished)
  client.on('ChannelStateChange', channelStateChanged)
  client.on('StasisStart', stasisStart);
  client.on('StasisEnd', stasisEnd);
  
  client.start('confbridge');

}

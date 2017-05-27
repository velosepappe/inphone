const config = require('./config.js');
const ari = require('ari-client');
const util = require('util');
const http = require('http') ;
const port = config.server.port;

const ConfBridge = require ('./node-confbridge/lib/confbridge.js') 
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
		endpointsThreshold[name].speaker = true;
		endpointsThreshold[name].talking = false;
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
			endpointsThreshold[endpoint].speaker = false;
		}
		console.log("Set endpoint " + fragments[1] + " talking status " + endpointsThreshold[endpoint].speaker);
		success = true;
	}
	
	// /{resource}/talk
	else if(fragments[2]!= null && fragments[2] == "talk"){
		var endpoint = fragments[1];
		if(request.method == 'POST'){
			endpointsThreshold[endpoint].speaker = true;
		}
		console.log("Set endpoint " + fragments[1] + " talking status " + endpointsThreshold[endpoint].speaker);
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
			var name = channel.caller.number;
			registerNewEndpointIfNeeded(name);
			endpointsThreshold[name].state = false;
			endpointsThreshold[name].listening = true;
			console.log('Channel online: ' + name);
		});
    }
  });
  
    // handler for ChannelTalkingStarted event
  function channeltalkingstarted(event, channel) {
	registerNewEndpointIfNeeded(channel.caller.number);
	endpointsThreshold[channel.caller.number].state = true;
	endpointsThreshold[channel.caller.number].timestamp = event.timestamp;
	endpointsThreshold[channel.caller.number].talking = true;
    console.log(util.format(
        'Channel talking started', channel.caller.number));
 
  }
  
  function channeltalkingfinished(event, channel) {
	endpointsThreshold[channel.caller.number].timestamp = event.timestamp;
	endpointsThreshold[channel.caller.number].talking = false;
	console.log(util.format(
        'Channel talking finished', channel.caller.number));
 
  }
  
  function channelStateChanged(event, channel) {
	console.log(util.format(
        'Channel state changed %s:%s', channel.caller.number,event));
 
  }
 
  function stasisStart(event, channel) {
    console.log(util.format(
        'Channel %s has entered the application', channel.caller.number));
	
	registerNewEndpointIfNeeded(channel.caller.number);
	endpointsThreshold[channel.caller.number].listening = true;
    // use keys on event since channel will also contain channel operations
    Object.keys(event.channel).forEach(function(key) {
      console.log(util.format('%s: %s', key, JSON.stringify(channel[key])));
    });
  }

  //when this happens, would the channel even come up on channels.list afterward?
  function stasisEnd(event, channel) {
    console.log(util.format(
        'Channel %s has left the application', channel.caller.number));
	//?why register if not listening anymore?
	registerNewEndpointIfNeeded(channel.caller.number);
	endpointsThreshold[channel.caller.number].listening = false;
  }
  
  client.on('ChannelTalkingStarted', channeltalkingstarted)
  client.on('ChannelTalkingFinished', channeltalkingfinished)
  client.on('ChannelStateChange', channelStateChanged)
  client.on('StasisStart', stasisStart);
  client.on('StasisEnd', stasisEnd);
  
  client.start('confbridge');

}

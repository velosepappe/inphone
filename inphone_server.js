/*jshint node:true*/
'use strict';
 
var ari = require('ari-client');
var util = require('util');

var endpointsThreshold = {};
 
ari.connect('http://vanloocke.synology.me:8088', 'asterisk', 'asterisk', clientLoaded);

// content of index.js
const http = require('http')  
const port = 3000

const requestHandler = (request, response) => {
	var fragments = request.url.split("/");
	if(request.method == 'GET'){
		console.log('Get Endpoint Status: ' + JSON.stringify(endpointsThreshold));
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Request-Method', '*');
		response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET,POST');
		response.setHeader('Access-Control-Allow-Headers', '*');
		response.setHeader('Content-Type', 'text/html');
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(JSON.stringify(endpointsThreshold));
	}
	else if(request.method == 'POST' && fragments[2]!= null && fragments[2] == "acknowledge"){
		console.log("Reset Endpoint Status " + fragments[1]);
		var endpoint = fragments[1];
		endpointsThreshold[endpoint] = false;
		
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Request-Method', '*');
		response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET,POST');
		response.setHeader('Access-Control-Allow-Headers', '*');
		response.setHeader('Content-Type', 'text/html');
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end();
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

// Asterisk stuff
// handler for client being loaded
function clientLoaded (err, client) {
  if (err) {
    throw err;
  }
 
  client.channels.list(function(err, channels) {
    if (!channels.length) {
      console.log('No channels currently :-(');
    } else {
      console.log('Current channels:');
      channels.forEach(function(channel) {
        console.log(channel.name);
      });
    }
  });
  
    // handler for ChannelTalkingStarted event
  function channeltalkingstarted(event, channel) {
	  endpointsThreshold[channel.caller.name] = true;
    console.log(util.format(
        'Channel talking started', channel.caller.name));
 
  }
  
  // handler for ChannelTalkingFinished event
  function channeltalkingfinished(event, channel) {
    console.log(util.format(
        'Channel talking finished', channel.caller.name));
 
  }
 
  // handler for StasisStart event
  function stasisStart(event, channel) {
    console.log(util.format(
        'Channel %s has entered the application', channel.name));
 
    // use keys on event since channel will also contain channel operations
    Object.keys(event.channel).forEach(function(key) {
      console.log(util.format('%s: %s', key, JSON.stringify(channel[key])));
    });
  }
 
  // handler for StasisEnd event
  function stasisEnd(event, channel) {
    console.log(util.format(
        'Channel %s has left the application', channel.name));
  }
  
  client.on('ChannelTalkingStarted', channeltalkingstarted)
  client.on('ChannelTalkingStarted', channeltalkingfinished)
  client.on('StasisStart', stasisStart);
  client.on('StasisEnd', stasisEnd);
 
  client.start('channel-dump');
}

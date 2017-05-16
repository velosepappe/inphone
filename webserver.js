var connect = require('connect');
var serveStatic = require('serve-static');
var config = require('./config.js');
connect().use(serveStatic(__dirname)).listen(config.webserver.port, function(){
    console.log('Server running on ' + config.webserver.port + '...');
});
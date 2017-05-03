var client = require('ari-client');

var url = "http://vanloocke.synology.me:8088/ari/";
var username = "samme";
var password="demo";
client.connect(url, username, password, function (err, ari) {console.log("Gelukt!")})
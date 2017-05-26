var config = {
	"asterisk" : {
		"url" : "http://vanloocke.synology.me:8088",
		"username" : "asterisk",
		"password" : "asterisk"
	},
	"server" : {
		"port" : "3000",
		"url" : "http://vanloocke.synology.me:3000/"
	},
	"webserver" : {
		"port" : "8080"
	},
	"webapp": {
		"notificationSoundEnabled":false
	},
	"audience": {
		"prefix":"AUD_"
	}
}

module.exports = config

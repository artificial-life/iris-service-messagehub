'use strict'

let Service = require("./messagehub");
let request = require("request");

describe.only('HTTP REST LOGIN', function() {
	this.timeout(10000);
	let service;
	let cfg = {
		"default_options": {
			"websocket": {
				"port": 3001
			},
			"http": {
				"port": 8081
			},
			"https": {
				"port": 443
			}
		},
		"connectors": {
			"http": {
				"9000": {
					// "SocketAPI": {
					// 	"model": "ws-rest",
					// 	"options": {}
					// },
					"RESTAPI": {
						"model": "http-rest",
						"options": {}
					}
				}
			}
		}
	};
	before(() => {
		service = new Service();
		service.init(cfg);
	})
	describe("login", () => {
		it("should login", (done) => {
			request
				.post('http://127.0.0.1:9000/login', {
					form: {
						user: "vasyoQ",
						password: "123456"
					}
				}, function(err, response, body) {
					console.log(body);
					done();
				});
		});
	});
});
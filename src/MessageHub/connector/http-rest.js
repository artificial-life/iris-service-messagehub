'use strict'

let AbstractConnector = require("./abstract");
let router = require("express").Router();
let bodyParse = require("body-parser");
let auth = require('iris-auth-util');

var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
}

class HttpRest extends AbstractConnector {
	constructor() {
		super();
	}

	create(app, options) {
		router.use(bodyParse.json());
		router.use(bodyParse.urlencoded({
			extended: true
		}));
		router.use(allowCrossDomain);

		router.route("/login")
			.post(function(req, res, next) {
				let user = req.body.user;
				let pass = req.body.password;
				let origin = req.body.origin || "unknown";

				auth.authorize({
						user: user,
						password_hash: pass,
						origin: origin,
						expiry: false
					})
					.then((success_result) => {
						res.send(success_result);
						next();
					})
					.catch((err) => {
						res.send({
							value: false,
							reason: "Internal error."
						});
						next();
					});
			});

		app.use(router);
	}
	on_message(handler) {
		if(handler instanceof Function) {
			this.messageHandler = handler;
		}
	}
}

module.exports = HttpRest;
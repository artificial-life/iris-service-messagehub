'use strict'

let AbstractConnector = require("./abstract");
let router = require("express").Router();
let bodyParse = require("body-parser");
let auth = require('iris-auth-util');

class HttpRest extends AbstractConnector {
	constructor() {
		super();
	}

	create(options) {
		this.on_disconnect(() => {
			console.log("CLIENT DISCONNECTED");
			return Promise.resolve(true);
		});
		router.use(bodyParse.json());
		router.use(bodyParse.urlencoded({
			extended: true
		}));
		router.post("/login", function(req, res, next) {
			let user = req.body.user;
			let pass = req.body.password;
			let origin = req.body.origin || "unknown";
			auth.authorize({
					user: user,
					password_hash: pass,
					origin: origin
				})
				.then((result) => {
					res.send(result);
				})
				.catch((err) => {
					res.send({
						value: false,
						reason: "Internal error."
					});
				});
		});
		return router;
	}

	on_connection(callback) {
		if(_.isFunction(callback))
			this.connectionHandler = callback;
	}

	on_disconnect(callback) {
		if(_.isFunction(callback))
			this.diconnectHandler = callback;
	}

}

module.exports = HttpRest;
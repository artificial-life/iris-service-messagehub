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
		router.use(bodyParse.json());
		router.use(bodyParse.urlencoded({
			extended: true
		}));
		router.route("/login")
			.post(function(req, res, next) {
				let user = req.body.user;
				let pass = req.body.password;
				let origin = req.body.origin || "unknown";
				auth.authorize({
						user: user,
						password_hash: pass,
						origin: origin
					})
					.then((result) => {
						res.send(result.token);
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
		return router;
	}
}

module.exports = HttpRest;
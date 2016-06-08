'use strict'

let AbstractConnector = require("./abstract");
let router = require("express")
	.Router();
let bodyParse = require("body-parser");
let auth = require('iris-auth-util');

var allowCrossDomain = function (req, res, next) {
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
			.post(function (req, res, next) {
				let user = req.body.user;
				let pass = req.body.password;
				let origin = req.body.origin || "unknown";
				let expiry = req.body.expiry || false;
				console.log("LOGIN");

				auth.authorize({
						user: user,
						password_hash: pass,
						origin: origin,
						expiry: expiry
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

		router.route("/:module/:action")
			.post(function (req, res, next) {
				let token = req.body.token;

				auth.check({
					token: token
				}).then((d) => {
					if (d.state) return next();

					res.send({
						success: false,
						reason: d.reason
					});
				}).catch((d) => {
					res.send({
						success: false,
						reason: 'auth error'
					});
				});

			}, function (req, res, next) {
				console.log('success');
				let action = req.params.action;
				let module = req.params.module;
				let user_id = false;
				let user_type = false;
				console.log(action, module);
				console.log(req.body);

				let params = _.defaults({
					_action: action,
					user_id: user_id,
					user_type: user_type
				}, req.body);

				this.messageHandler(module, params)
					.then((result) => {
						res.send(result);
					})
					.catch((err) => {
						console.log("ERR!", err.stack);
						global.logger && logger.error(
							err, {
								module: module,
								acion: action
							}, 'Unhandled error caught in MessageHub');

						res.send({
							state: false,
							reason: 'Internal error: ' + err.message
						});
					});
			});

		router.route("/connection/test")
			.post(function (req, res, next) {
				res.send({
					success: true
				});
				next();
			});
		// router.route("/logout")
		// 	.post(function(req, res, next) {
		// 		console.log("LOGOUT");
		// 		res.send({
		// 			value: true,
		// 			reason: "External error."
		// 		});
		// 		next();
		// 	});

		app.use(router);
	}
	on_message(handler) {
		if (handler instanceof Function) {
			this.messageHandler = handler;
		}
	}
}

module.exports = HttpRest;

'use strict'

let ServerHolder = require("./connector/holder");
let auth = require('iris-auth-util');
let emitter = require("global-queue");

let performTask = function (destination, data) {
	return emitter.addTask(destination, data)
		.then((result) => {
			return {
				state: true,
				value: result
			}
		})
		.catch((err) => {
			console.log("MH ERR!", err.stack);
			return Promise.reject({
				state: false,
				reason: "Internal error: " + err.message
			});
		});
};

class MessageHub {
	constructor() {}
	init(options) {
		this.connectors = new ServerHolder(options.default_options);
		this.connectors.init(options.connectors);
		this.connectors.listen();

		this.connectors.on_message(performTask);
	}
}

module.exports = MessageHub;

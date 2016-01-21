'use strict'

class AbstractConnector {
	constructor() {}

	set name(pre) {
		this.conn_name = pre || '';
	}

	create(data) {
		throw new Error("AbstractConnector method.");
	}

	on_message(callback) {
		throw new Error("AbstractConnector method.");
	}

	on_connection(callback) {
		throw new Error("AbstractConnector method.");
	}

	on_disconnect(callback) {
		throw new Error("AbstractConnector method.");
	}

}

module.exports = AbstractConnector;
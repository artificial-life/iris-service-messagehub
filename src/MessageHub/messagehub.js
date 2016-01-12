'use strict'

let ServerHolder = require("./connector/holder");
let auth = require('iris-auth-util');
let emitter = require("global-queue");

let performTask = function(destination, data) {
  return emitter.addTask(destination, data).then((result) => {
      state: true,
      value: result
    })
    .catch((err) => {
      state: false,
      reason: "Internal error."
    });
};

class MessageHub {
  constructor() {}
  init(options) {
    this.connectors.init(options.connectors);
    this.connectors.listen();

    this.connectors.on_message(performTask);
  }
}

module.exports = MessageHub;
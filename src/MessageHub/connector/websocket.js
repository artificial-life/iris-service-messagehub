'use strict'

let crossroads = require('crossroads');

let Server = require("socket.io");
let AbstractConnector = require("./abstract");
let auth = require('iris-auth-util');

const DEFAULT_WS_TIMEOUT = 5000;

class WebsocketConnector extends AbstractConnector {
  constructor() {
    super();
  }
  create(app, options) {
    this.router = crossroads.create();

    this.router.addRoute('/auth', (socket, data) => {
      auth.check(data).then((result) => {
          socket.token = token;
          return result;
        })
        .catch((err) => {
          value: false,
          reason: "Internal error."
        })
        .then(result => {
          return result.value ? socket.authorized.resolve(result) : socket.authorized.reject(result.reason);
        });
    });

    this.router.addRoute('/{module}/{action}', (socket, data, module, action) => {
      let request_id = data.request_id;

      if (!socket.authorized.promise.isFulfilled()) {
        let denied = {
          state: false,
          reason: 'Auth required',
          request_id: request_id
        };

        socket.emit('message', denied);
        return;
      }

      data._action = action;

      this.messageHandler(module, data)
        .then((result) => {
          result.request_id = request_id;
          socket.emit('message', result);
        });
    });
  }
  listen(server) {
    this.io = require('socket.io')(server);

    this.io.on('connection', (socket) => {
      console.log('Connected!');
      let resolve, reject;
      let authorized = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });

      socket.authorized = {
        promise: authorized,
        resolve: resolve,
        reject: reject
      };

      authorized.timeout(DEFAULT_WS_TIMEOUT).then((result) => {
        socket.emit('auth-accepted', result)
      }).catch((result) => socket.disconnect(result))

      socket.on('message', (data) => {
        this.router.parse(data.uri, [socket, data]);
      });

    });
  }

  on_message(handler) {
    if (handler instanceof Function) {
      this.messageHandler = handler;
    }
  }
}

module.exports = WebsocketConnector;
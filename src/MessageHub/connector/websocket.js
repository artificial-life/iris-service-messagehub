'use strict'

let crossroads = require('crossroads');

let Server = require("socket.io");
let AbstractConnector = require("./abstract");
let auth = require('iris-auth-util');
let io = require('socket.io');

//@FIXIT : move to MessageHub
let queue = require('global-queue');

const DEFAULT_WS_TIMEOUT = 5000;

class WebsocketConnector extends AbstractConnector {
  constructor() {
    super();
  }
  create(app, options) {
    this.router = crossroads.create();

    this.router.addRoute('/auth', (socket, data) => {
      auth.check(data).then((result) => {
          socket.token = data.token;
          socket.user_id = result.data.user_id;
          return result;
        })
        .catch((err) => ({
          value: false,
          reason: "Internal error."
        }))
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
      data.user_id = socket.user_id;

      this.messageHandler(module, data)
        .then((result) => {
          result.request_id = request_id;
          socket.emit('message', result);
        });
    });

    this.router.addRoute('/subscribe/{module}/{event}', (socket, data, module, event) => {
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

      let room = this.getRoom(module, event);
      let result = {
        room: room,
        request_id: request_id
      };

      socket.join(room);
      socket.emit('message', result);
    });
  }
  getRoom(module, event) {
    return `${module}.${event}`
  }
  listen(server) {
    this.io = io(server);

    queue.on('broadcast', ({
      data, event, module
    }) => {
      data.room = this.getRoom(module, event);

      this.io
        .to(room)
        .emit('event', data):
    });

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

      authorized
        .timeout(DEFAULT_WS_TIMEOUT)
        .then((result) => {
          socket.emit('auth-accepted', result)
        })
        .catch((result) => socket.disconnect(result))

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
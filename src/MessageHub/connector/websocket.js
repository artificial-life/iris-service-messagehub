'use strict'

let Server = require("socket.io");
let AbstractConnector = require("./abstract");

const DEFAULT_WS_TIMEOUT = 5000;

class WebsocketConnector extends AbstractConnector {
  constructor() {
    super();
  }
  create(options) {
    this.port = options.port;
    this.auth_timeout = options.auth_timeout || DEFAULT_WS_TIMEOUT;
    console.log("WS ON PORT", options.port);

    this.routes = options.routes || ["/"];
    this.io = new Server();

    this.on_message((data) => {
      console.log("WS received: ", data);
      return Promise.resolve({
        Default: "response"
      });
    });

    this.on_connection((socket) => {
      console.log("CONNECTION TO WS");
      return new Promise((resolve, reject) => {
        console.log("LOGIN", socket.token);
        if (socket.token) {
          return resolve({
            value: true,
            reason: "Welcome"
          });
        }
        socket.on('login', ({
          login: user,
          password: password,
          origin: origin,
          request_id: req_id
        }) => {
          console.log("ONLOGIN", user, password, origin);
          let p = this.loginHandler({
              username: user,
              password_hash: password,
              origin: origin
            })
            .then((res) => {
              let data = res;
              data.request_id = req_id;
              return data;
            });

          resolve(p);
        });
      })
    });
    this.on_disconnect(() => {
      console.log("CLIENT DISCONNECTED");
      return Promise.resolve(true);
    });
    return this;
  }

  listen() {
    this.io.listen(this.port);
    _.map(this.routes, (uri) => {
      this.io.of(uri).on('connection', (socket) => {
        this.connectionHandler(socket)
          .then((valid) => {
            if (valid.value === true) {
              console.log("AUTHORIZED WS", valid);
              socket.token = valid.token;
              socket.user_data = valid.data;

              socket.emit('message', {
                data: "Authentication success.",
                token: valid.token,
                request_id: valid.request_id
              });

              socket.on('message', (data) => {

                if (data.uri == 'ws://subscribe') {
                  let rooms = _.isArray(data.data.room) ? data.data.room : [data.data.room];
                  _.map(rooms, (room) => {
                    socket.join(room);
                    socket.emit('room-message', `Now joined ${room}`)
                  });
                }

                data.destination = uri;
                data.token = socket.token;
                data.session = socket.user_data;

                this.messageHandler(data)
                  .then((response) => {
                    socket.emit('message', response);
                  });
              });

              socket.on('disconnect', this.diconnectHandler);
            } else {
              socket.disconnect(valid.reason);
            }
          })
          .catch((err) => {
            socket.disconnect('Auth error.');
          });
      });
    });
  }



  close() {
    this.io.close();
  }

  broadcast(data) {
    this.io.emit(data.event_name, data.event_data);
  }

  on_message(resolver) {
    if (_.isFunction(resolver))
      this.messageHandler = resolver;
  }

  on_login(callback) {
    if (_.isFunction(callback))
      this.loginHandler = callback;
  }

  on_connection(callback) {
    if (_.isFunction(callback))
      this.connectionHandler = callback;
  }

  on_disconnect(callback) {
    if (_.isFunction(callback))
      this.diconnectHandler = callback;
  }

}

module.exports = WebsocketConnector;
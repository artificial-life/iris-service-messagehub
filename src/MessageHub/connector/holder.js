'use strict'

let AbstractConnector = require("./abstract");
let express = require("express");

let getModel = function(name) {
  if (_.isString(name)) {
    try {
      return require(`./${name}`);
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
}

class ServerHolder {
  constructor(default_options = {}) {
    this.default_options = default_options;
    this.handlers = {};
    this.servers = {};
    this.connectors = {};
  }

  init(conn_map) {
    _.map(conn_map, (server_data, server_key) => {
      _.map(server_data, (conn_data, server_port) => {
        let connector = {
          protocol: server_key,
          port: server_port,
          connector: conn_data
        };
        return this.initConnectors(connector);
      });
    });
  }

  initConnectors({
    protocol: server_key,
    port: server_port,
    connector: conn_data
  }) {
    let app = this.handlers[server_key + ":" + server_port];
    if (!app) {
      app = express();
    }
    _.map(conn_data, (connector, conn_name) => {
      let ConnModel = getModel(connector.model);
      let conn = new ConnModel();
      conn.name = conn_name;
      conn.create(app, connector.options);

      this.connectors[server_key + ':' + server_port] = this.connectors[server_key + ':' + server_port] || {};
      this.connectors[server_key + ':' + server_port][conn_name] = conn;
    });

    this.handlers[server_key + ":" + server_port] = app;
    console.log(this.connectors);
  }

  server(key) {
    return this.servers[key] || false;
  }

  listen() {
    return _.map(this.handlers, (app, key) => {
      let [protocol, port] = key.split(":");
      this.servers[key] = this.handlers[key].listen(port);

      _.map(this.connectors[key], (conn) => {
        if (conn.listen) conn.listen(this.servers[key])
      })
    });
  }

  close() {
    return _.map(this.servers, (server, key) => this.server(key).close());
  }

  on_message(resolver) {
    this.every((conn) => conn.on_message((data) => resolver(data)));
  }
}

module.exports = ServerHolder;
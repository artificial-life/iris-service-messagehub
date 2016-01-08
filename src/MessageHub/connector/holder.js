'use strict'

let AbstractConnector = require("./abstract");

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

class ConnectorHolder {
  constructor(default_options = {}) {
    this.default_options = default_options;
    this.connectors = {};
  }

  addMulti(conn_map) {
    return _.mapValues(conn_map, (conn_data, conn_key) => {
      let conntector = {
        model: conn_data.model,
        key: (conn_data.key || conn_key)
      };
      let options = conn_data.options || this.default_options[connector.model];

      return this.add(conntector, options);
    });
  }

  add(connector, options) {
    let Model = getModel(connector.model);

    if (_.isUndefined(Model)) return false;

    let n_connector = new Model();
    n_connector.create(options);

    this.connectors[connector.key] = n_connector;
    return true;
  }

  remove(conn_key) {
    try {
      if (this.connectors[conn_key]) {
        this.connectors[conn_key].close();
        delete this.connectors[conn_key];
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  every(callback) {
    return _.map(this.connectors, (conn) => callback(conn));
  }

  connector(conn_key) {
    return this.connectors[conn_key] || false;
  }

  listen() {
    return this.every((conn) => conn.listen());
  }

  close() {
    return this.every((conn) => conn.close());
  }

  on_message(resolver) {
    this.every((conn) => conn.on_message((data) => resolver(data)));
  }

  on_login(resolver) {
    this.every((conn) => conn.on_login((data) => resolver(data)));
  }
}

module.exports = ConnectorHolder;
'use strict'

global._ = require('lodash');
global.Promise = require('bluebird');

let config = {
  "name": "main",
  "couchbird": {
    "server_ip": "127.0.0.1",
    "n1ql": "127.0.0.1:8093"
  },
  "buckets": {
    "main": "rdf",
    "auth": "ss",
    "history": "rdf"
  },
  "vocabulary": {
    "basic": "iris://vocabulary/basic",
    "domain": "iris://vocabulary/domain",
    "fs": false
  }
};

let Auth = require('iris-auth-util');
let Couchbird = require('Couchbird')(config.couchbird); //singletone inits here

Auth.configure({
  data: config.buckets.main,
  session: config.buckets.auth
});

let Service = require("./MessageHub/messagehub.js");
let cfg = {
  "default_options": {
    "websocket": {
      "port": 3001
    },
    "http": {
      "port": 8081
    },
    "https": {
      "port": 443
    }
  },
  "connectors": {
    "http": {
      "9000": {
        // "SocketAPI": {
        // 	"model": "ws-rest",
        // 	"options": {}
        // },
        "RESTAPI": {
          "model": "http-rest",
          "options": {}
        }
      }
    }
  }
};

let service = new Service();
service.init(cfg);
'use strict'

global.expect = require('chai').expect;
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

var gulp = require("gulp");
var mocha = require('gulp-mocha');

gulp.src('build/**/*.test.js', {
		read: false
	})
	.pipe(mocha());
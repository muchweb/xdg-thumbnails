(function () {
	'use strict';

	var dbus = require('dbus-native'),
		crypto = require('crypto'),
		fs = require('fs'),
		util = require('util'),
		mime = require('mime'),
		EventEmitter = require('events').EventEmitter,
		path = require('path');

	module.exports.Thumbnailer = function () {
		this.sessionbus = dbus.sessionBus();
		this.service = null;
		this.jobs = {};
		this.wait_connection = false;
	};

	util.inherits(module.exports.Thumbnailer, EventEmitter);

	module.exports.Thumbnailer.prototype.GetThumbDir = function () {
		if (typeof process.env.XDG_CACHE_HOME !== 'undefined')
			return process.env.XDG_CACHE_HOME + '/thumbnails';

		return process.env.HOME + '/.cache/thumbnails';
	};

	module.exports.Thumbnailer.prototype.Connect = function (callback) {
		if (this.service !== null)
			return callback(this.service);

		if (this.wait_connection)
			return setTimeout(function () {
				this.Connect(function (data) {
					callback(data);
				});
			}.bind(this), 1000);

		this.wait_connection = true;

		this.sessionbus.getService('org.freedesktop.thumbnails.Thumbnailer1').getInterface(
			'/org/freedesktop/thumbnails/Thumbnailer1',
			'org.freedesktop.thumbnails.Thumbnailer1',
			function (err, service_new) {
				this.service = service_new;

				this.service.on('Finished', function (data) {
					this.jobs[data].callback(null, this.jobs[data].thumb);
					// this.emit('finished', this.jobs[data].thumb);
				}.bind(this));

				this.service.on('Ready', function (data) {
					// this.emit('ready', this.jobs[data]);
				}.bind(this));

				this.service.on('Started', function (data) {
					// this.emit('started', this.jobs[data]);
				}.bind(this));

				this.service.on('Error', function (data, path, id, message) {
					this.jobs[data].callback(new Error(message));
					// this.emit('error', new Error(message));
				}.bind(this));

				// this.service.GetSupported(function (error, items, mimes) {
				// 	if (error)
				// 		return this.emit('error', error);
				// 	this.emit('GetSupported', items, mimes);
				// }.bind(this));
				//
				// this.service.GetSchedulers(function (error, items) {
				// 	if (error)
				// 		return this.emit('error', error);
				// 	this.emit('GetSchedulers', items);
				// }.bind(this));
				//
				// this.service.GetFlavors(function () {
				// 	this.emit('GetFlavors', arguments);
				// }.bind(this));

				return callback(this.service);

			}.bind(this)
		);
	};

	module.exports.Thumbnailer.prototype.Request = function (file_path, callback, options) {
		if (typeof callback === 'undefined')
			callback = null;

		if (typeof options === 'undefined')
			options = {};

		if (typeof options.size === 'undefined')
			options.size = 'normal';

		var path_absolute = path.resolve(file_path),
			mimetype = mime.lookup(path_absolute),
			uri = 'file://' + path_absolute,
			thumb_dir = this.GetThumbDir(),
			hash = crypto
				.createHash('md5')
				.update(uri)
				.digest('hex');

		this.Connect(function (service) {
			service.Queue(

				// URI
				[uri],

				// MIME type
				[mimetype],

				// Flavor
				options.size,

				// Urgent
				'default',

				// Handle
				'',

				function (error, new_handle) {
					this.jobs[new_handle] = {
						source: path_absolute,
						thumb: path.join(thumb_dir, options.size, hash + '.png'),
						callback: callback,
					};
				}.bind(this)
			);
		}.bind(this));
	};

})();

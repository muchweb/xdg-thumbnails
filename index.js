// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict';
const crypto = require('crypto');
const dbus   = require('dbus-native');
const debug  = require('debug');
const mime   = require('mime');
const path   = require('path');
const log    = debug('xdg-thumbnails');

class Thumbnailer {
	/**
	* @static
	* @method getThumbDir
	*/
	static getThumbDir () {
		if (process.env.XDG_CACHE_HOME)
			return `${process.env.XDG_CACHE_HOME}/thumbnails`;
		return `${process.env.HOME}/.cache/thumbnails`;
	}

	/**
	* <signal name="Started">
	*   <arg type="u" name="handle" />
	* </signal>
	* @constructor
	* @param {Object} options
	*/
	constructor (options={}) {
		if (!options.service)   options.service   = 'org.freedesktop.thumbnails.Thumbnailer1';
		if (!options.thumb_dir) options.thumb_dir = Thumbnailer.getThumbDir();
		this.thumb_dir = options.thumb_dir;
		this.bus = dbus.sessionBus();
		this.service = this.bus.getService(options.service);
		this.interface = null;
		this.jobs = {};
	}

	/**
	* <signal name="Started">
	*   <arg type="u" name="handle" />
	* </signal>
	* @method connect
	* @param {Function} callback
	* @param {Object} options
	*/
	connect (callback, options={}) {
		if (!options.node)      options.node      = '/org/freedesktop/thumbnails/Thumbnailer1';
		if (!options.interface) options.interface = 'org.freedesktop.thumbnails.Thumbnailer1';
		this.service.getInterface(
			options.node,
			options.interface,
			this.gotInterface.bind(this, callback)
		);
	}

	/**
	* @method disconnect
	*/
	disconnect () {
		console.log('Shall disconnect');
	}

	/**
	* <signal name="Started">
	*   <arg type="u" name="handle" />
	* </signal>
	* @method gotInterface
	* @param {Function} callback
	* @param {string} error
	* @param {Object} result
	*/
	gotInterface (callback, error, result) {
		if (error) return callback(error);
		this.interface = result;
		this.interface.on('Started',  this.eventStarted.bind(this));
		this.interface.on('Finished', this.eventFinished.bind(this));
		this.interface.on('Ready',    this.eventReady.bind(this));
		this.interface.on('Error',    this.eventError.bind(this));
		callback(null, result)
	}

	/**
	* <signal name="Started">
	*   <arg type="u" name="handle" />
	* </signal>
	* @method eventStarted
	* @param {number} handle
	*/
	eventStarted (handle) {
		log('[Interface][Started]', `handle=${handle}`);
	}

	/**
	* <signal name="Finished">
	*   <arg type="u" name="handle" />
	* </signal>
	* @method eventFinished
	* @param {number} handle
	*/
	eventFinished (handle) {
		log('[Interface][Finished]', `handle=${handle}`);
		if (!this.jobs[handle]) return;
		const job = this.jobs[handle];
		job.callback(null, job.thumb);
		delete this.jobs[handle];
	}

	/**
	* <signal name="Ready">
	*   <arg type="u" name="handle" />
	*   <arg type="as" name="uris" />
	* </signal>
	* @method eventReady
	* @param {number} handle
	* @param {Array<string>} uris
	*/
	eventReady (handle, uris) {
		log('[Interface][Ready]', `handle=${handle}`, `uris=${uris}`);
	}

	/**
	* <signal name="Error">
	*   <arg type="u" name="handle" />
	*   <arg type="as" name="failed_uris" />
	*   <arg type="i" name="error_code" />
	*   <arg type="s" name="message" />
	* </signal>
	* @method eventError
	* @param {number} handle
	* @param {Array<string>} failed_uris
	* @param {number} error_code
	* @param {string} message
	*/
	eventError (handle, failed_uris, error_code, message) {
		log('[Interface][Error]', `handle=${handle}`, `failed_uris=${failed_uris}`, `error_code=${error_code}`, `message=${message}`);
		if (!this.jobs[handle]) return;
		const job = this.jobs[handle];
		job.callback(new Error(message));
		delete this.jobs[handle];
	}

	/**
	* @method queueFile
	* @param {string|Object} options
	* @param {Function} callback
	*/
	queueFile (options, callback) {
		if (typeof options === 'string')
			options = {
				file_path: options,
			};
		if (!options.path_absolute)     options.path_absolute     = path.resolve(options.file_path);
		if (!options.mimetype)          options.mimetype          = mime.getType(options.path_absolute);
		if (!options.uri)               options.uri               = `file://${options.path_absolute}`;
		if (!options.flavor)            options.flavor            = 'normal';
		if (!options.scheduler)         options.scheduler         = 'default';
		if (!options.handle_to_unqueue) options.handle_to_unqueue = 0;

		this.methodQueue(
			[options.uri],
			[options.mimetype],
			options.flavor,
			options.scheduler,
			options.handle_to_unqueue,
			(error, handle) => {
				const hash = crypto.createHash('md5').update(options.uri).digest('hex');
				const thumb = path.join(this.thumb_dir, options.flavor, `${hash}.png`);
				this.jobs[handle] = {callback, thumb};
			}
		);
	}

	/**
	* <method name="Queue">
	*   <annotation name="org.freedesktop.DBus.GLib.Async" value="true"/>
	*   <arg type="as" name="uris" direction="in" />
	*   <arg type="as" name="mime_types" direction="in" />
	*   <arg type="s" name="flavor" direction="in" />
	*   <arg type="s" name="scheduler" direction="in" />
	*   <arg type="u" name="handle_to_unqueue" direction="in" />
	*   <arg type="u" name="handle" direction="out" />
	* </method>
	* @method methodDequeue
	* @param {Array<string>} uris
	* @param {Array<string>} mime_types
	* @param {string} flavor
	* @param {string} scheduler
	* @param {number} handle_to_unqueue
	* @param {Function} callback
	*/
	methodQueue (uris, mime_types, flavor, scheduler, handle_to_unqueue, callback) {
		this.interface.Queue(
			uris,
			mime_types,
			flavor,
			scheduler,
			handle_to_unqueue,
			callback // (error, handle)
		);
	}

	/**
	* <method name="Dequeue">
	*   <annotation name="org.freedesktop.DBus.GLib.Async" value="true"/>
	*   <arg type="u" name="handle" direction="in" />
	* </method>
	* @method methodDequeue
	* @param {number} handle
	* @param {Function} callback
	*/
	methodDequeue (handle, callback) {
		this.interface.Dequeue(
			handle,
			callback // (error)
		);
	}

	/**
	* <method name="GetSupported">
	*   <annotation name="org.freedesktop.DBus.GLib.Async" value="true" />
	*   <arg type="as" name="uri_schemes" direction="out" />
	*   <arg type="as" name="mime_types" direction="out" />
	* </method>
	* @method methodGetSupported
	* @param {Function} callback
	*/
	methodGetSupported (callback) {
		this.interface.GetSupported(
			callback // (error, uri_schemes, mime_types)
		);
	}

	/**
	* <method name="GetSchedulers">
	*   <annotation name="org.freedesktop.DBus.GLib.Async" value="true" />
	*   <arg type="as" name="schedulers" direction="out" />
	* </method>
	* @method methodGetFlavors
	* @param {Function} callback
	*/
	methodGetSchedulers (callback) {
		this.interface.GetSchedulers(
			callback // (error, schedulers)
		);
	}


	/**
	* <method name="GetFlavors">
	*   <annotation name="org.freedesktop.DBus.GLib.Async" value="true" />
	*   <arg type="as" name="flavors" direction="out" />
	* </method>
	* @method methodGetFlavors
	* @param {Function} callback
	*/
	methodGetFlavors (callback) {
		this.interface.GetFlavors(
			callback // (error, flavors)
		);
	}
}

module.exports = {Thumbnailer};

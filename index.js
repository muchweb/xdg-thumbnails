var dbus = require('dbus-native'),
	sessionbus = dbus.sessionBus(),
	crypto = require('crypto'),
	fs = require('fs'),
	service = null;

function GetThumbDir () {
	if (typeof process.env.XDG_CACHE_HOME !== 'undefined')
		return process.env.XDG_CACHE_HOME + '/thumbnails';
	return process.env.HOME + '/.cache/thumbnails';
}

function Connect (callback) {
	sessionbus.getService('org.freedesktop.thumbnails.Thumbnailer1').getInterface(
		'/org/freedesktop/thumbnails/Thumbnailer1',
		'org.freedesktop.thumbnails.Thumbnailer1',
		function (err, service_new) {
			if (service !== null)
				return callback(service);

			service = service_new;
			service.on('Finished', function () {
				console.log('Finished', arguments);
			});
			service.on('Ready', function () {
				console.log('Ready', arguments);
			});
			service.on('Started', function () {
				console.log('Started', arguments);
			});
			service.on('Error', function () {
				console.log('Error', arguments);
			});
			service.GetSupported(function () {
				console.log('GetSupported', arguments);
			});
			service.GetSchedulers(function () {
				console.log('GetSchedulers', arguments);
			});
			service.GetFlavors(function () {
				console.log('GetFlavors', arguments);
			});
			return callback(service);

		}
	);
}

function Request (file) {
	Connect(function (service) {
		var uri = 'file://' + file,
			thumb_dir = GetThumbDir(),
			hash = crypto.createHash('md5').update(uri).digest('hex');

		service.Queue(
			// uri
			[uri],

			// mime_type
			['image/jpeg'],

			// flavor
			'normal',

			// urgent
			'default',

			// handle
			'',

			function (error, new_handle) {
				console.log(arguments);
			}
		);
	});
}

Request('test.jpg');

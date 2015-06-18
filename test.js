(function () {
	'use strict';

	var Thumbnailer = require('./index.js').Thumbnailer,
		thumbnailer = new Thumbnailer();

	// thumbnailer.on('finished', function (file) {
	// 	console.log('finished', file);
	// });
	// thumbnailer.on('ready', function (file) {
	// 	console.log('ready', file);
	// });
	// thumbnailer.on('started', function (file) {
	// 	console.log('started', file);
	// });
	thumbnailer.on('error', function (file) {
		// console.log('error', file);
	});

	//
	// thumbnailer.on('GetSupported', function () {
	// 	console.log('GetSupported', arguments);
	// });
	//
	// thumbnailer.on('GetSchedulers', function () {
	// 	console.log('GetSchedulers', arguments);
	// });
	//
	// thumbnailer.on('GetFlavors', function () {
	// 	console.log('GetFlavors', arguments);
	// });
	//

	thumbnailer.Request('cat.jpg', function (error, thumb) {
		if (error)
			console.log(error.message);
		console.log('Created', thumb);
	});
	thumbnailer.Request('wrong.js', function (error, thumb) {
		if (error)
			console.log(error.message);
		console.log('Created', thumb);
	});
	thumbnailer.Request('./keyboard-cat.gif', function (error, thumb) {
		if (error)
			console.log(error.message);
		console.log('Created', thumb);
	});

})();

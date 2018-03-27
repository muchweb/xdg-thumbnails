#!/usr/bin/env node
'use strict';
process.env.DEBUG = '*'
const fs = require('fs');
const assert = require('assert');
const Thumbnailer = require('./index.js').Thumbnailer;
const thumbnailer = new Thumbnailer();

thumbnailer.connect(connected);

function connected (error) {
	if (error) return console.error(error);

	// Image downloaded from https://commons.wikimedia.org/wiki/File:Cat_November_2010-1a.jpg
	// License: Creative Commons Attribution-Share Alike 3.0 Unported license.
	// Author:  Alvesgaspar (https://commons.wikimedia.org/wiki/User:Alvesgaspar)
	thumbnailer.queueFile('cat.jpg',          (error, path) => {
		assert.ok(!error, 'There shall be no error');
		assert.ok(path, 'There shall be path');
		assert.ok(fs.existsSync(path), 'File shall exist');
		console.log(`Thumbnail created at ${path}`);

		thumbnailer.queueFile('what.jpg',         (error, path) => {
			assert.ok(error, 'There shall be error');
			assert.ok(!path, 'There shall be no path');

			thumbnailer.methodGetSupported((error, uri_schemes, mime_types) => {
				assert.ok(!error, 'There shall be no error');
				console.log('Available mime_types are:', Array.from(new Set((mime_types))).sort());
				console.log('Available uri_schemes are:', Array.from(new Set((uri_schemes))).sort());

				thumbnailer.methodGetSchedulers((error, schedulers) => {
					assert.ok(!error, 'There shall be no error');
					console.log('Available schedulers are:', Array.from(new Set((schedulers))).sort());

					thumbnailer.methodGetFlavors((error, flavors) => {
						assert.ok(!error, 'There shall be no error');
						console.log('Available flavors are:', Array.from(new Set((flavors))).sort());

						process.exit();
					});
				});
			});
		});
	});
}

# xdg-thumbnails

Generate thumbnails with system workers using freedesktop dbus specification

## Installation

```bash
npm install xdg-thumbnails
```

## Usage

```js
var Thumbnailer = require('xdg-thumbnails').Thumbnailer,
	thumbnailer = new Thumbnailer();

thumbnailer.Request('cat.jpg', function (error, path) {
	if (error)
		return console.log(error.message);

	console.log('Generated thumbnail: ', path);
});
```

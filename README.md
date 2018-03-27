# xdg-thumbnails

Generate file thumbnails (image previews) with system workers using freedesktop.org DBus specification

## Installation

```bash
npm install xdg-thumbnails
```

## Usage

```js
const thumbnailer = new require('xdg-thumbnails').Thumbnailer;

thumbnailer.connect((error) => {
	if (error)
		return console.error(error);

	thumbnailer.queueFile('image.jpg', (error, path) => {
		if (error)
			return console.error(error);

		console.log(`Newly generated thumbnail: ${path}`);
	});

	// or, with options

	thumbnailer.queueFile({
		file_path: 'image.jpg'
		scheduler: 'default',  // Options: 'background', 'default', 'foreground'
		flavor:    'normal',   // Options: 'large', 'normal'
	}, (error, path) => {
		if (error)
			return console.error(error);

		console.log(`Newly generated thumbnail: ${path}`);
	});
});
```

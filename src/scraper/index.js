const Wire = require('./wire');
const buildRecord = require('./buildRecord');
const clean = require('./clean');
const config = require('./../../config');
const filterTorrent = require('./filterTorrent');
const net = require('net');

const onMetadata = (metadata, infohash) => {
	try {
		const { info = {} } = clean(metadata);
		const { files = [], length, name } = info;
		const names = files.map(({ path }) => (Array.isArray(path) ? path.join('/') : path)).concat(name);
		const invalid = filterTorrent(names);
		const filesWithOriginal = name && length ? [{ length, path: name }, ...files] : files;

		if (!invalid.length > 0) {
			buildRecord(invalid, { files: filesWithOriginal, infohash, name });
		}
	} catch (error) {
		console.log(error);
	}
};

const scraper = (infohash, rinfo) => {
	const socket = new net.Socket();

	socket.setTimeout(config.timeout || 5000);
	socket.connect(rinfo.port, rinfo.address, () => {
		const wire = new Wire(infohash);

		socket.pipe(wire).pipe(socket);

		wire.on('metadata', (metadata, hash) => {
			onMetadata(metadata, hash);
			socket.destroy();
		});

		wire.on('fail', () => {
			socket.destroy();
		});

		wire.sendHandshake();
	});

	socket.on('error', () => {
		socket.destroy();
	});

	socket.on('timeout', () => {
		socket.destroy();
	});
};

module.exports = scraper;

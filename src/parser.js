const Wire = require('./wire');
const config = require('./../config');
const net = require('net');

const clean = (data) => {
	if (Buffer.isBuffer(data)) {
		return data.toString();
	} else if (Array.isArray(data)) {
		return data.map(clean);
	} else if (typeof data === 'object') {
		return Object.keys(data).reduce((result, key) => Object.assign(result, { [key]: clean(data[key]) }), {});
	}

	return data;
};

const filterTorrent = (names) => names.find((name) => config.filters.indexOf(name.toLowerCase()) > -1);
const getType = (names) => {
	const weights = names.reduce(
		(result, name) =>
			Object.keys(config.formats)
				.filter((key) => {
					const ext = name.split('.').pop();

					return config.formats[key].find((format) => format === ext);
				})
				.reduce(
					(weight, type) => Object.assign(weight, { [type]: weight[type] ? weight[type] + 1 : 1 }),
					result,
				),
		{},
	);

	return Object.keys(weights).reduce(
		(result, type) => (result && weights[result] > weights[type] ? result : type),
		'',
	);
};
const getTags = (names, type) =>
	names.reduce((result, name) => {
		const tags = config.tags
			.filter((tag) => {
				if (tag.type !== type) {
					return false;
				} else if (tag.includes && name.indexOf(tag.includes) > -1) {
					return true;
				} else if (tag.match && name.match(tag.match)) {
					return true;
				}
				return false;
			})
			.map(({ tag }) => tag);

		return result.concat(tags);
	}, []);

const upsertTorrent = async (torrent, knex) => {
	try {
		const records = await knex('torrents').where({ infohash: torrent.infohash });

		if (config.debug) {
			console.log(`${torrent.infohash} - ${records.length > 0 ? 'Updated' : 'Inserted'}`);
		}
		if (records.length > 0) {
			await knex('torrents')
				.update(Object.assign(torrent, { updated: new Date() }))
				.where({ infohash: torrent.infohash });
		} else {
			await knex('torrents')
				.insert(Object.assign(torrent, { created: new Date(), updated: new Date() }))
				.where({ infohash: torrent.infohash });
		}
	} catch (error) {
		if (config.debug) {
			console.log(error);
		}
	}
};

const onMetadata = (metadata, infohash, knex) => {
	const { info = {} } = clean(metadata);
	const { files = [], length, name } = info;
	const names = files.map(({ path }) => (Array.isArray(path) ? path.join('/') : path)).concat(name);
	const invalid = filterTorrent(names);

	if (!invalid) {
		const type = getType(names);
		const tags = getTags(names, type);

		const record = {
			files: JSON.stringify(files),
			infohash: infohash.toString('hex'),
			length: length || files.reduce((result, { length: fileLength }) => result + fileLength, 0),
			name,
			tags: tags.join(','),
			type,
		};

		upsertTorrent(record, knex);
	}
};

const getMetadata = (infohash, rinfo, knex) => {
	const socket = new net.Socket();

	socket.setTimeout(config.timeout || 5000);
	socket.connect(
		rinfo.port,
		rinfo.address,
		() => {
			const wire = new Wire(infohash);

			socket.pipe(wire).pipe(socket);

			wire.on('metadata', (metadata, hash) => {
				onMetadata(metadata, hash, knex);
				socket.destroy();
			});

			wire.on('fail', () => {
				socket.destroy();
			});

			wire.sendHandshake();
		},
	);

	socket.on('error', () => {
		socket.destroy();
	});

	socket.on('timeout', () => {
		socket.destroy();
	});
};

module.exports = getMetadata;

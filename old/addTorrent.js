const config = require('./../config');
const torrents = {};

const searchName = (name) =>
	name
		.toString()
		.replace(/\./gu, ' ')
		.replace(/_/gu, ' ');

const getFiles = (torrent) => {
	if (!torrent.info.files) {
		return [
			{
				length: torrent.info.length ? torrent.info.length.toString() : '',
				path: torrent.info.name.toString(),
			},
		];
	}

	return torrent.info.files.map((file) => ({
		length: file.length,
		path: file.path.toString(),
	}));
};

const hasBadFilter = (torrent) =>
	torrent.files.find((file) =>
		config.filters.find((filter) => (file.path ? file.path.indexOf(filter) > -1 : file.indexOf(filter) > -1)),
	);
const getType = (torrent) => {
	const types = torrent.files.reduce(
		(result, file) => {
			const ext = file.path ? file.path.split('.').pop() : file.split('.').pop();

			return {
				audio: config.formats.audio.indexOf(ext) > -1 ? result.audio + 1 : result.audio,
				document: config.formats.document.indexOf(ext) > -1 ? result.document + 1 : result.document,
				software: config.formats.software.indexOf(ext) > -1 ? result.software + 1 : result.software,
				video: config.formats.video.indexOf(ext) > -1 ? result.video + 1 : result.video,
			};
		},
		{
			audio: 0,
			document: 0,
			software: 0,
			video: 0,
		},
	);

	if (types.audio > types.document && types.audio > types.software && types.audio > types.video) {
		return 'audio';
	} else if (types.document > types.software && types.document > types.video) {
		return 'document';
	} else if (types.software > types.video) {
		return 'software';
	} else if (types.video > 0) {
		return 'video';
	}

	return '';
};

const addTorrent = (torrent, knex) => {
	if (!torrent.info || !torrent.info.name || !torrent.infohash) {
		return;
	}

	try {
		const record = {
			files: getFiles(torrent),
			infohash: torrent.infohash,
			name: torrent.info.name.toString(),
			search: searchName(torrent.info.name),
			updated: Date.now(),
		};
		const data = Object.assign(record, { type: getType(record) });

		if (hasBadFilter(data)) {
			return;
		}

		torrents[data.infohash] = true;
		console.log(`${Object.keys(torrents).length} | added torrent: ${data.infohash}`);
	} catch (error) {
		// Do nothing
	}
};

module.exports = addTorrent;

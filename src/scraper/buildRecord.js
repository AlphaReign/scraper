const getTags = require('./getTags');
const getType = require('./getType');
const upsertTorrent = require('./upsertTorrent');

module.exports = (names, { files, infohash, name }) => {
	try {
		const type = getType(names);
		const tags = [...new Set(getTags(names, type))];

		const record = {
			files: JSON.stringify(files),
			infohash: infohash.toString('hex'),
			length: files.reduce((result, { length: fileLength }) => result + fileLength, 0),
			name,
			tags: tags.join(','),
			type,
		};

		upsertTorrent(record);
	} catch (error) {
		console.log(error);
	}
};

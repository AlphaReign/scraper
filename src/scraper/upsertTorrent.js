const config = require('./../../config');
const knex = require('./../knex');

module.exports = async (torrent) => {
	try {
		const record = await knex('torrents')
			.where({ infohash: torrent.infohash })
			.first();

		if (config.debug) {
			console.log(`${torrent.infohash} - ${record ? 'Updated' : 'Inserted'}`);
		}
		if (record) {
			await knex('torrents')
				.update({ ...torrent, updated: new Date() })
				.where({ infohash: torrent.infohash });
		} else {
			await knex('torrents')
				.insert({ ...torrent, created: new Date(), updated: new Date() })
				.where({ infohash: torrent.infohash });
		}
	} catch (error) {
		if (config.debug) {
			console.log(error);
		}
	}
};

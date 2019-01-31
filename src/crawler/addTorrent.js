const config = require('./../../config');
const knex = require('./../knex');
const scraper = require('./../scraper');
// const upsertPeer = require('./upsertPeer');

module.exports = async (infohash, rinfo) => {
	try {
		// await upsertPeer(infohash, rinfo);

		const torrent = await knex('torrents')
			.where({ infohash: infohash.toString('hex') })
			.first();

		if (!torrent || !torrent.name) {
			scraper(infohash, rinfo);
		}
	} catch (error) {
		if (config.debug) {
			console.log(error);
		}
	}
};

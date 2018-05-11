import config from './../config';

const knex = require('knex')(config.sqlite);

export const upsert = async (torrent) => {
	const records = await knex('torrents').where({ infohash: torrent.infohash });

	if (records.length > 0) {
		await knex('torrents').update({
			data: JSON.stringify(torrent),
			updated: Date.now(),
		}).where({ infohash: torrent.infohash });
	} else {
		await knex('torrents').insert({
			created: Date.now(),
			data: JSON.stringify(torrent),
			infohash: torrent.infohash,
			updated: Date.now(),
		});
	}
};

export const count = async () => {
	const counts = await knex('torrents').count('* as count');
	const total = counts.length > 0 ? counts[0].count : 0;

	return total;
};

export default {
	count,
	upsert,
};
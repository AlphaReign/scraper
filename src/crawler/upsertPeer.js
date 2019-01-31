const knex = require('./../knex');

module.exports = async (infohash, rinfo) => {
	const peer = {
		address: rinfo.address,
		infohash: infohash.toString('hex'),
		port: rinfo.port,
	};

	const peerRecord = await knex('peers')
		.where(peer)
		.first();

	if (peerRecord) {
		await knex('peers')
			.where(peer)
			.update({ updated: new Date() });
	} else {
		await knex('peers').insert({ ...peer, created: new Date(), updated: new Date() });
	}
};

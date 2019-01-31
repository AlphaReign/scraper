const config = require('./../../config');
const knex = require('./../knex');

module.exports = async () => {
	const newRecords = await knex('torrents')
		.whereNull('trackerUpdated')
		.limit(config.tracker.limit);

	if (newRecords.length > 0) {
		return newRecords;
	}

	const age = new Date(Date.now() - 1000 * 60 * config.tracker.age);
	const outdatedRecords = await knex('torrents')
		.where('trackerUpdated', '<', age)
		.limit(config.tracker.limit);

	return outdatedRecords;
};

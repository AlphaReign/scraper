const Client = require('bittorrent-tracker');
const config = require('./../../config');
const updateRecord = require('./updateRecord');

module.exports = async (records) => {
	const options = {
		announce: [config.tracker.host],
		infoHash: records.map(({ infohash }) => infohash),
	};

	try {
		const results = await new Promise((resolve, reject) => {
			Client.scrape(options, (error, data) => (error ? reject(error) : resolve(data)));
		});

		if (results.infoHash) {
			await updateRecord(results);
		} else {
			const hashes = Object.keys(results);

			for (let i = 0; i < hashes.length; i += 1) {
				await updateRecord(results[hashes[i]]); // eslint-disable-line no-await-in-loop
			}
		}
	} catch (error) {
		// Do nothing
	}
};

const config = require('./../../config');
const scrape = require('./scrape');
const getRecords = require('./getRecords');

const tracker = async () => {
	const records = await getRecords();

	if (records.length > 0) {
		try {
			await scrape(records);
		} catch (error) {
			// Do nothing
		}
	}

	setTimeout(tracker, config.tracker.frequency * 1000);
};

module.exports = tracker;

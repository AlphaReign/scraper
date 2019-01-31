const knex = require('./../knex');

const getCount = async () => {
	const [count] = await knex('torrents').count('infohash');
	const [count2] = await knex('torrents')
		.count('infohash')
		.whereNull('trackerUpdated');
	const [count3] = await knex('torrents')
		.count('infohash')
		.whereNull('searchUpdated');

	console.log(`Total Torrents: ${count['count(`infohash`)']}`);
	console.log(`Torrents without Tracker: ${count2['count(`infohash`)']}`);
	console.log(`Torrents not in Search: ${count3['count(`infohash`)']}`);
	setTimeout(() => getCount(), 10000);
};

getCount();

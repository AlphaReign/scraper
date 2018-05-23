import config from './../config';

const redis = require("redis");
const client = redis.createClient(config.redis.port, config.redis.host);

client.on("error", (error) => {
	throw new Error(error);
});

const redisCMD = (cmd, ...args) => (
	new Promise((resolve, reject) => {
		client[cmd](...args, (error, response) => (error ? reject(error) : resolve(response)));
	})
);

export const upsert = async (torrent) => {
	let record = {};

	try {
		const output = await redisCMD('get', torrent.infohash);

		record = JSON.parse(output);
	} catch (error) {
		// Don't do anything
	}

	record = record || {};
	record.created = record.created || Date.now();
	record.update = Date.now();
	record.infohash = torrent.infohash;
	record.data = torrent;

	await redisCMD('set', torrent.infohash, JSON.stringify(record));
};

export const count = async () => {
	const output = await redisCMD('info', 'keyspace');
	const countLine = output.split(`\n`).find((line) => line.indexOf('db0:') > -1);
	const total = countLine.split(',')[0].replace('db0:keys=', '');

	// console.log(output);

	return total;
};

export default {
	count,
	upsert,
};
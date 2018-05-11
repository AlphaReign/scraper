import DHT from './dht';
import cleaner from './utils/cleaner';
import config from './config';

const dht = new DHT(config.dht);
const store = require(`./store/${config.store}.js`);

dht.ignore((infohash, rinfo, callback) => {
	// false => always to download the metadata even though the metadata might exists.
	callback(false);
});

dht.on('metadata', (torrent) => {
	try {
		store.upsert(cleaner(torrent));
	} catch (error) {
		console.log(error);
	}
});

dht.listen(6881, '0.0.0.0');

setInterval(async () => {
	const count = await store.count();

	console.log(`Total torrents: `, count);
}, 10000);
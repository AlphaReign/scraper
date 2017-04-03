import Indexer from './indexer';
import Scraper from './scraper';
import config from '../config';
import dhtCrawler from './lib';

const indexer = new Indexer(config);
const scraper = new Scraper(config);

const dht = dhtCrawler(config.dht);

dht.ignore((infohash, rinfo, callback) => {
	// false => always to download the metadata even though the metadata might exists.
	callback(false);
});
dht.on('metadata', indexer.addTorrent.bind(indexer));
dht.listen(6881, '0.0.0.0');

scraper.run();
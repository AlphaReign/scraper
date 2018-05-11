import BTClient from './btclient';
import Crawler from './crawler';
import EventEmitter from 'events';

export class DHT extends EventEmitter {
	ignoreFN = undefined;

	constructor (options) {
		super();
		this.options = options || {};
	}

	ignore (ignore) {
		this.ignoreFN = ignore;
	}

	listen (port, address) {
		this.port = port || 6881;
		this.address = address || '0.0.0.0';

		const btclient = new BTClient({
			ignore: this.ignoreFN,
			maxConnections: this.options.maxConnections,
			timeout: this.options.timeout || 1000 * 10,
		});

		btclient.on('complete', (metadata, infohash, rinfo) => {
			const torrentData = metadata;

			torrentData.address = rinfo.address;
			torrentData.port = rinfo.port;
			torrentData.infohash = infohash.toString('hex');
			torrentData.magnet = `magnet:?xt=urn:btih:${torrentData.infohash}`;
			this.emit('metadata', torrentData);
		});

		const crawler = new Crawler({
			address: this.address,
			btclient,
			nodesMaxSize: this.options.nodesMaxSize || 4000,
			port: this.port,
		});

		crawler.start();
	}

}

export default DHT;
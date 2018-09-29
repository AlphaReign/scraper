const EventEmitter = require('events');
const DHTCrawler = require('./dhtcrawler');
const BTClient = require('./btclient');

class Spider extends EventEmitter {
	constructor(options) {
		super();
		this.options = options || {};
		this.ignoreFn = undefined;
	}

	ignore(ignore) {
		this.ignoreFn = ignore;
	}

	listen(port, address) {
		this.port = port || 6881;
		this.address = address || '0.0.0.0';

		const btclient = new BTClient({
			ignore: this.ignoreFn,
			maxConnections: this.options.maxConnections,
			timeout: this.options.timeout || 1000 * 10,
		});

		btclient.on('complete', (metadata, infohash, rinfo) => {
			const meta = metadata;

			meta.address = rinfo.address;
			meta.port = rinfo.port;
			meta.infohash = infohash.toString('hex');
			this.emit('metadata', meta);
		});

		const dhtCrawler = new DHTCrawler({
			address: this.address,
			btclient,
			nodesMaxSize: this.options.nodesMaxSize || 4000,
			port: this.port,
		});

		dhtCrawler.start();
	}
}

module.exports = Spider;

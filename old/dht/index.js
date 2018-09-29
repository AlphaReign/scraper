const EventEmitter = require('events');
const Crawler = require('./crawler');
const BTClient = require('./btclient');

const defaultOptions = {
	address: '0.0.0.0',
	maxConnections: 1000,
	nodesMaxSize: 4000,
	port: 6881,
	timeout: 10000,
};

class scraper extends EventEmitter {
	constructor(options) {
		super();

		this.options = Object.assign(defaultOptions, options);
		this.ignoreFn = undefined;
	}

	ignore(fn) {
		this.ignoreFn = fn;
	}

	listen() {
		const btClient = new BTClient({
			ignore: this.ignoreFn,
			maxConnections: this.options.maxConnections,
			timeout: this.options.timeout,
		});

		btClient.on('complete', (metadata, infohash, rinfo) => {
			const data = Object.assign(metadata, {
				address: rinfo.address,
				infohash: infohash.toString('hex'),
				port: rinfo.port,
			});

			this.emit('metadata', data);
		});

		const crawler = new Crawler({
			address: this.options.address,
			btclient: btClient,
			nodesMaxSize: this.options.nodesMaxSize,
			port: this.options.port,
		});

		crawler.start();
	}
}

module.exports = scraper;

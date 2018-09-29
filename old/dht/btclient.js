const EventEmitter = require('events');
const net = require('net');

const PeerQueue = require('./peer-queue');
const Wire = require('./wire');

const defaultOptions = {
	maxConnections: 200,
	timeout: 5000,
};

class BTClient extends EventEmitter {
	constructor(options) {
		super();

		this.options = Object.assign(defaultOptions, options);
		this.activeConnections = 0;
		this.peers = new PeerQueue(this.options.maxConnections);
		this.on('download', this.downloadMetadata);

		if (this.options.ignore) {
			this.ignore = this.options.ignore;
		} else {
			this.ignore = (infohash, rinfo, ignore) => ignore(false);
		}
	}

	nextTorrent(infohash, successful) {
		const req = this.peers.shift(infohash, successful);

		if (req) {
			this.ignore(req.infohash.toString('hex'), req.rinfo, (drop) => {
				if (!drop) {
					this.emit('download', req.rinfo, req.infohash);
				}
			});
		}
	}

	downloadMetadata(rinfo, infohash) {
		this.activeConnections += 1;
		let successful = false;
		const socket = new net.Socket();

		socket.setTimeout(this.options.timeout);
		socket.connect(
			rinfo.port,
			rinfo.address,
			() => {
				const wire = new Wire(infohash);

				socket.pipe(wire).pipe(socket);
				wire.on('metadata', (metadata, torrentInfohash) => {
					successful = true;
					this.emit('complete', metadata, torrentInfohash, rinfo);
					socket.destroy();
				});

				wire.on('fail', () => {
					socket.destroy();
				});
				wire.sendHandshake();
			},
		);

		socket.on('error', () => {
			socket.destroy();
		});
		socket.on('timeout', () => {
			socket.destroy();
		});
		socket.on('close', () => {
			this.activeConnections -= 1;
			this.nextTorrent(infohash, successful);
		});
	}

	add(rinfo, infohash) {
		this.peers.push({ infohash, rinfo });
		if (this.activeConnections < this.options.maxConnections && this.peers.length() > 0) {
			this.nextTorrent();
		}
	}

	isIdle() {
		return this.peers.length() === 0;
	}
}

module.exports = BTClient;

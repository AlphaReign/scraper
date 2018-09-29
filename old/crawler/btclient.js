const EventEmitter = require('events');
const net = require('net');
const PeerQueue = require('./peer-queue');
const Wire = require('./wire');

class BTClient extends EventEmitter {
	constructor(options) {
		super();

		this.timeout = options.timeout || 5000;
		this.maxConnections = options.maxConnections || 200;
		this.activeConnections = 0;
		this.peers = new PeerQueue(this.maxConnections);
		this.on('download', this.downloadTorrent);

		if (typeof options.ignore === 'function') {
			this.ignore = options.ignore;
		} else {
			this.ignore = (infohash, rinfo, ignore) => {
				ignore(false);
			};
		}
	}

	nextDownload(infohash, successful) {
		const req = this.peers.shift(infohash, successful);

		if (req) {
			this.ignore(req.infohash.toString('hex'), req.rinfo, (drop) => {
				if (!drop) {
					this.emit('download', req.rinfo, req.infohash);
				}
			});
		}
	}

	socketCreate() {
		const socket = new net.Socket();

		this.activeConnections += 1;
		socket.setTimeout(this.timeout);

		return socket;
	}

	socketError(socket) {
		socket.destroy();
	}

	socketClosed(socket, infohash, successful) {
		this.activeConnections -= 1;
		this.nextDownload(infohash, successful);
	}

	socketDestroy(socket) {
		socket.destroy();
	}

	downloadTorrent(rinfo, infohash) {
		const socket = this.socketCreate();

		let successful = false;

		socket.connect(
			rinfo.port,
			rinfo.address,
			() => {
				const wire = new Wire(infohash);

				socket.pipe(wire).pipe(socket);
				wire.on('metadata', (metadata, infoHash) => {
					successful = true;
					this.emit('complete', metadata, infoHash, rinfo);
					socket.destroy();
				});
				wire.on('fail', () => this.socketDestroy(socket));
				wire.sendHandshake();
			},
		);

		socket.on('error', (error) => this.socketError(socket, error));
		socket.on('timeout', (error) => this.socketError(socket, error));
		socket.once('close', () => this.socketClosed(socket, infohash, successful));
	}

	add(rinfo, infohash) {
		this.peers.push({ infohash, rinfo });
		if (this.activeConnections < this.maxConnections && this.peers.length() > 0) {
			this.nextDownload();
		}
	}

	isIdle() {
		return this.peers.length() === 0;
	}
}

module.exports = BTClient;

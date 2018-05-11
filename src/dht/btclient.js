import EventEmitter from 'events';
import PeerQueue from './peer-queue';
import { Socket } from 'net';
import Wire from './wire';

export class BTClient extends EventEmitter {
	activeConnections = 0;

	constructor (options) {
		super();

		this.timeout = options.timeout;
		this.maxConnections = options.maxConnections || 200;
		this.peers = new PeerQueue(this.maxConnections);
		this.on('download', this.download);

		if (typeof options.ignore === 'function') {
			this.ignore = options.ignore;
		} else {
			this.ignore = (infohash, rinfo, ignore) => {
				ignore(false);
			};
		}
	}


	next (infohash, successful) {
		const req = this.peers.shift(infohash, successful);

		if (req) {
			this.ignore(req.infohash.toString('hex'), req.rinfo, (drop) => {
				if (!drop) {
					this.emit('download', req.rinfo, req.infohash);
				}
			});
		}
	}

	download (rinfo, infohash) {
		this.activeConnections += 1;

		let successful = false;
		const socket = new Socket();

		socket.setTimeout(this.timeout || 5000);
		socket.connect(rinfo.port, rinfo.address, () => {
			const wire = new Wire(infohash);

			socket.pipe(wire).pipe(socket);

			wire.on('metadata', (metadata, infoHash) => {
				successful = true;
				this.emit('complete', metadata, infoHash, rinfo);
				socket.destroy();
			});

			wire.on('fail', () => {
				socket.destroy();
			});

			wire.sendHandshake();
		});

		socket.on('error', () => {
			socket.destroy();
		});

		socket.on('timeout', () => {
			socket.destroy();
		});

		socket.once('close', () => {
			this.activeConnections -= 1;
			this.next(infohash, successful);
		});
	}

	add (rinfo, infohash) {
		this.peers.push({
			infohash,
			rinfo,
		});

		if (this.activeConnections < this.maxConnections && this.peers.length() > 0) {
			this.next();
		}
	}

	isIdle () {
		return this.peers.length() === 0;
	}

}


export default BTClient;
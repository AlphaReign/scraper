class PeerQueue {
	constructor(maxSize, perLimit) {
		this.maxSize = maxSize || 200;
		this.perLimit = perLimit || 10;
		this.peers = {};
		this.reqs = [];
	}

	shiftPeers() {
		if (this.length() > 0) {
			const req = this.reqs.shift();

			this.peers[req.infohash.toString('hex')] = [];

			return req;
		}

		return undefined;
	}

	push(peer) {
		const infohashHex = peer.infohash.toString('hex');
		const peers = this.peers[infohashHex];

		if (peers && peers.length < this.perLimit) {
			peers.push(peer);
		} else if (this.length() < this.maxSize) {
			this.reqs.push(peer);
		}
	}

	shift(infohash, successful) {
		if (infohash) {
			const infohashHex = infohash.toString('hex');

			if (successful === true) {
				delete this.peers[infohashHex];
			} else {
				const peers = this.peers[infohashHex];

				if (peers) {
					if (peers.length > 0) {
						return peers.shift();
					}
					delete this.peers[infohashHex];
				}
			}
		}

		return this.shiftPeers();
	}

	length() {
		return this.reqs.length;
	}
}

module.exports = PeerQueue;

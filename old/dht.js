/* eslint camelcase:off */
const EventEmitter = require('events');
const bencode = require('bencode');
const crypto = require('crypto');
const dgram = require('dgram');

const compactAddress = (address) => Buffer.from(address.split('.').map((value) => parseInt(value)));
const compactPort = (port) => Buffer.from(parseInt(port).toString(16), 'hex');
const compactNode = ({ address, port }) => Buffer.concat([compactAddress(address), compactPort(port)]);
const compactNodes = (nodes) => nodes.map(compactNode);

const depactAddress = (buf, offset = 0) =>
	[0, 1, 2, 3].map((index) => buf.slice(index + offset, index + offset + 1).readUInt8()).join('.');
const depactPort = (buf, offset = 0) => buf.slice(4 + offset).readUInt16BE();
const depactNode = (buf) => ({ address: depactAddress(buf), port: depactPort(buf) });
const depactNodes = (data) => {
	const nodes = [];

	for (let i = 0; i + 26 <= data.length; i += 26) {
		nodes.push({
			address: depactAddress(data, i + 20),
			id: data.slice(i, i + 20),
			port: depactPort(data, i + 20),
		});
	}

	return nodes;
};

const getRandomID = () =>
	crypto
		.createHash('sha1')
		.update(crypto.randomBytes(20))
		.digest();
const getTransactionID = (TID_LENGTH = 4) => getRandomID().slice(0, TID_LENGTH);
const getToken = (id) => {
	const date = new Date();
	const minute = Math.floor(date.getMinutes() / 10) * 10;
	const token = `${id}${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${minute}`;

	return crypto
		.createHash('sha1')
		.update(token)
		.digest();
};

class DHT extends EventEmitter {
	constructor(address = '0.0.0.0', port = 6881) {
		super();

		this.setupSocket(port, address);
		this.setup();
	}

	setupSocket(port, address) {
		this.socket = dgram.createSocket('udp4');
		this.socket.bind(port, address);
		this.socket.on('listening', () => this.onListening(address, port));
		this.socket.on('message', this.onMessage);
		this.socket.on('error', this.onError);
	}

	setup() {
		this.id = getRandomID();
		this.nodes = {};
		this.torrents = {};
		this.pings = [];
		this.announces = [];
	}

	onListening(address, port) {
		console.log(`Now Listening on ${address}:${port}`);
		this.emit('listening', address, port);
	}

	onError(error) {
		this.emit('error', error);
		console.log(error);
	}

	onMessage(message, rinfo) {
		this.emit('message', message, rinfo);
		try {
			const decoded = bencode.decode(message, 'utf8');

			if (decoded.q) {
				this.onQuery(decoded, rinfo);
			} else if (decoded.r) {
				this.onResponse(decoded, rinfo);
			} else {
				this.onError(new Error('unknown dht message', message, rinfo));
			}
		} catch (error) {
			this.onError(error);
		}
	}

	// --- queries ---

	onQuery(message, rinfo) {
		this.emit('query', message, rinfo);

		if (message.q === 'ping') {
			this.onPingQuery(message, rinfo);
		} else if (message.q === 'find_node') {
			this.onFindNodeQuery(message, rinfo);
		} else if (message.q === 'get_peers') {
			this.onGetPeersQuery(message, rinfo);
		} else if (message.q === 'announce_peer') {
			this.onAnnouncePeerQuery(message, rinfo);
		} else {
			this.onError(new Error('unknown dht query', message, rinfo));
		}
	}

	// DHT Queries
	onPingQuery(message, rinfo) {
		this.emit('pingQuery', message, rinfo);
		this.addNode(message.a.id, rinfo, 'query');
		this.sendMessage({ r: { id: this.id }, t: getTransactionID(), y: 'r' }, rinfo);
	}

	onFindNodeQuery(message, rinfo) {
		this.emit('findNodeQuery', message, rinfo);
		this.addNode(message.a.id, rinfo, 'query');

		const { target } = message.a;
		const nodes = this.nodes[target] ? compactNode(this.nodes[target]) : compactNodes(this.getGoodNodes(8));

		this.sendMessage({ r: { id: this.id, nodes }, t: getTransactionID(), y: 'r' }, rinfo);
	}

	onGetPeersQuery(message, rinfo) {
		this.emit('getPeersQuery', message, rinfo);
		this.addNode(message.a.id, rinfo, 'query');

		const { info_hash: infohash } = message.a;

		if (this.torrents[infohash]) {
			this.sendMessage(
				{
					r: { id: this.id, token: getToken(this.id), values: compactNodes(this.torrents[infohash]) },
					t: getTransactionID(),
					y: 'r',
				},
				rinfo,
			);
		} else {
			this.sendMessage(
				{
					r: { id: this.id, nodes: compactNodes(this.getGoodNodes(8)), token: getToken(this.id) },
					t: getTransactionID(),
					y: 'r',
				},
				rinfo,
			);
		}
	}

	onAnnouncePeerQuery(message, rinfo) {
		this.emit('announcePeerQuery', message, rinfo);
		this.addNode(message.a.id, rinfo, 'query');

		const { info_hash: infohash, token } = message.a;

		if (this.torrents[infohash] && token === getToken()) {
			this.sendMessage({ r: { id: this.id }, t: getTransactionID(), y: 'r' }, rinfo);
		}
	}

	// --- responses ---

	onResponse(message, rinfo) {
		this.emit('response', message, rinfo);

		if (Object.keys(message.r).length === 1 && message.r.id) {
			if (this.pings.indexOf(message.r.id) > -1) {
				this.onPingResponse(message, rinfo);
			} else if (this.announces.indexOf(message.r.id) > -1) {
				this.onAnnouncePeerResponse(message, rinfo);
			}
		} else if (message.r.nodes && !message.r.token) {
			this.onFindNodeResponse(message, rinfo);
		} else if ((message.r.nodes || message.r.values) && message.r.token) {
			this.onGetPeersResponse(message, rinfo);
		} else {
			this.onError(new Error('unknown dht response', message, rinfo));
		}
	}

	// DHT Responses
	onPingResponse(message, rinfo) {
		this.emit('pingResponse', message, rinfo);
		this.addNode(message.r.id, rinfo, 'response');
		this.pings = this.pings.filter((id) => id !== message.r.id);
	}

	onFindNodeResponse(message, rinfo) {
		this.emit('findNodeResponse', message, rinfo);
		this.addNode(message.r.id, rinfo, 'response');

		console.log(message, 'onFindNodeResponse');
	}

	onGetPeersResponse(message, rinfo) {
		this.emit('getPeersResponse', message, rinfo);
		this.addNode(message.r.id, rinfo, 'response');

		console.log(message, 'onGetPeersResponse');
	}

	onAnnouncePeerResponse(message, rinfo) {
		this.emit('announcePeerResponse', message, rinfo);
		this.addNode(message.r.id, rinfo, 'response');
		this.announces = this.announces.filter((id) => id !== message.r.id);
	}

	// --- actions ---

	sendMessage(message, rinfo) {
		try {
			const buf = bencode.encode(message);

			this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
		} catch (error) {
			this.onError(error);
		}
	}

	addNode(id, rinfo, action) {
		const node = this.nodes[id] || {};

		this.nodes[id] = Object.assign(node, { address: rinfo.address, port: rinfo.port, updated: new Date() });
		this.nodes[id].added = this.nodes[id].added || new Date();

		if (action === 'query') {
			this.nodes[id].lastQuery = new Date();
		} else if (action === 'response') {
			this.nodes[id].lastResponse = new Date();
		}
	}

	isGoodNode(node) {
		const fifteenMinutesAgo = new Date(Date.now() - 1000 * 60 * 15);

		if (node.lastResponse > fifteenMinutesAgo) {
			return true;
		}

		return false;
	}

	getGoodNodes(limit) {
		const nodes = [];
		const ids = Object.keys(this.nodes);

		while (nodes.length < limit && ids.length > 0) {
			const id = ids.pop();

			if (this.isGoodNode(this.nodes[id])) {
				nodes.push(this.nodes[id]);
			}
		}

		return nodes;
	}

	// DHT Queries
	ping(address, port) {
		this.sendMessage({ a: { id: this.id }, q: 'ping', t: getTransactionID(), y: 'q' }, { address, port });
	}

	findNode(address, port, id) {
		const target = id || getRandomID();

		this.sendMessage(
			{ a: { id: this.id, target }, q: 'find_node', t: getTransactionID(), y: 'q' },
			{ address, port },
		);
	}

	getPeers(address, port, infohash) {
		this.sendMessage(
			{ a: { id: this.id, info_hash: infohash }, q: 'find_node', t: getTransactionID(), y: 'q' },
			{ address, port },
		);
	}

	announcePeer(address, port, infohash) {
		this.sendMessage(
			{
				a: { id: this.id, implied_port: 1, info_hash: infohash, token: getToken(this.id) },
				q: 'find_node',
				t: getTransactionID(),
				y: 'q',
			},
			{ address, port },
		);
	}

	addPeer(address, port, infohash) {
		this.torrents[infohash] = this.torrents[infohash] || [];

		const match = this.torrents[infohash].find((peer) => peer.address === address && peer.port === port);

		if (!match) {
			this.torrents[infohash].push({ address, port });
		}
	}

	removePeer(address, port, infohash) {
		this.torrents[infohash] = this.torrents[infohash].filter(
			(peer) => peer.address !== address || peer.port !== port,
		);
	}
}

module.exports = DHT;

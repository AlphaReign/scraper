/* eslint max-statements: off */
const dgram = require('dgram');
const bencode = require('bencode');

const utils = require('./utils');
const KTable = require('./ktable');

const BOOTSTRAP_NODES = [['router.bittorrent.com', 6881], ['dht.transmissionbt.com', 6881]];
const TID_LENGTH = 4;
const NODES_MAX_SIZE = 200;
const TOKEN_LENGTH = 2;

class Crawler {
	constructor(options) {
		this.btclient = options.btclient;
		this.address = options.address;
		this.port = options.port;
		this.udp = dgram.createSocket('udp4');
		this.ktable = new KTable(options.nodesMaxSize || NODES_MAX_SIZE);
	}

	sendKRPC(msg, rinfo) {
		try {
			const buf = bencode.encode(msg);

			this.udp.send(buf, 0, buf.length, rinfo.port, rinfo.address);
		} catch (error) {
			// Do nothing
		}
	}

	onFindNodeResponse(nodes) {
		const decodedNodes = utils.decodeNodes(nodes);

		decodedNodes.forEach((node) => {
			if (node.address !== this.address && node.nid !== this.ktable.nid && node.port < 65536 && node.port > 0) {
				this.ktable.push(node);
			}
		});
	}

	sendFindNodeRequest(rinfo, nid) {
		const currentNid = nid ? utils.genNeighborID(nid, this.ktable.nid) : this.ktable.nid;
		const msg = {
			a: {
				id: currentNid,
				target: utils.randomID(),
			},
			q: 'find_node',
			t: utils.randomID().slice(0, TID_LENGTH),
			y: 'q',
		};

		this.sendKRPC(msg, rinfo);
	}

	joinDHTNetwork() {
		BOOTSTRAP_NODES.forEach((node) => {
			this.sendFindNodeRequest({ address: node[0], port: node[1] });
		});
	}

	makeNeighbours() {
		this.ktable.nodes.forEach((node) => {
			this.sendFindNodeRequest(
				{
					address: node.address,
					port: node.port,
				},
				node.nid,
			);
		});
		this.ktable.nodes = [];
	}

	onGetPeersRequest(msg, rinfo) {
		try {
			const infohash = msg.a.info_hash;
			const tid = msg.t;
			const nid = msg.a.id;
			const token = infohash.slice(0, TOKEN_LENGTH);

			if (tid === undefined || infohash.length !== 20 || nid.length !== 20) {
				throw new Error('No tid or nid or bad infohash');
			}
			this.sendKRPC(
				{
					r: {
						id: utils.genNeighborID(infohash, this.ktable.nid),
						nodes: '',
						token,
					},
					t: tid,
					y: 'r',
				},
				rinfo,
			);
		} catch (error) {
			// Do nothing;
		}
	}

	onAnnouncePeerRequest(msg, rinfo) {
		try {
			let port;
			const infohash = msg.a.info_hash;
			const { token } = msg.a;
			const nid = msg.a.id;
			const tid = msg.t;

			if (!tid) {
				throw new Error('No tid');
			}

			if (infohash.slice(0, TOKEN_LENGTH).toString() !== token.toString()) {
				throw new Error('invalid infohash length');
			}

			if (msg.a.implied_port) {
				({ port } = rinfo);
			} else {
				port = msg.a.port || 0;
			}

			if (port >= 65536 || port <= 0) {
				throw new Error('no port', port);
			}

			this.sendKRPC(
				{
					r: {
						id: utils.genNeighborID(nid, this.ktable.nid),
					},
					t: tid,
					y: 'r',
				},
				rinfo,
			);

			this.btclient.add({ address: rinfo.address, port }, infohash);
		} catch (error) {
			// Do nothing
		}
	}

	onMessage(msg, rinfo) {
		try {
			const message = bencode.decode(msg);

			message.y = Buffer.isBuffer(message.y) ? message.y.toString() : message.y;
			message.q = Buffer.isBuffer(message.q) ? message.q.toString() : message.q;

			if (message.y === 'r' && message.r.nodes) {
				this.onFindNodeResponse(message.r.nodes);
			} else if (message.y === 'q' && message.q === 'get_peers') {
				this.onGetPeersRequest(message, rinfo);
			} else if (message.y === 'q' && message.q === 'announce_peer') {
				this.onAnnouncePeerRequest(message, rinfo);
			}
		} catch (error) {
			// Do nothing
		}
	}

	start() {
		this.udp.bind(this.port, this.address);

		this.udp.on('listening', () => {
			console.log('UDP Server listening on %s:%s', this.address, this.port);
		});

		this.udp.on('message', (msg, rinfo) => {
			this.onMessage(msg, rinfo);
		});

		this.udp.on('error', () => {
			// Do nothing
		});

		setInterval(() => {
			if (this.btclient.isIdle()) {
				this.joinDHTNetwork();
				this.makeNeighbours();
			}
		}, 1000);
	}
}

module.exports = Crawler;

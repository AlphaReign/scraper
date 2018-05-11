import KTable from './ktable';
import bencode from 'bencode';
import dgram from 'dgram';
import utils from './utils';

const BOOTSTRAP_NODES = [
	{
		address: 'router.bittorrent.com',
		port: 6881,
	},
	{
		address: 'dht.transmissionbt.com',
		port: 6881,
	},
];
const TID_LENGTH = 4;
const NODES_MAX_SIZE = 200;
const TOKEN_LENGTH = 2;

export class Crawler {
	constructor (options) {
		this.btclient = options.btclient;
		this.address = options.address;
		this.port = options.port;
		this.udp = dgram.createSocket('udp4');
		this.ktable = new KTable(options.nodesMaxSize || NODES_MAX_SIZE);
	}


	sendKRPC (msg, rinfo) {
		try {
			const buf = bencode.encode(msg);

			this.udp.send(buf, 0, buf.length, rinfo.port, rinfo.address);
		} catch (error) {
			// Do nothing
		}
	}

	onFindNodeResponse (nodes) {
		const decodedNodes = utils.decodeNodes(nodes);

		decodedNodes.forEach((node) => {
			if (node.address !== this.address && node.nid !== this.ktable.nid && node.port < 65536 && node.port > 0) {
				this.ktable.push(node);
			}
		});
	}

	sendFindNodeRequest (rinfo, nid) {
		const newID = nid ? utils.genNeighborID(nid, this.ktable.nid) : this.ktable.nid;
		const msg = {
			a: {
				id: newID,
				target: utils.randomID(),
			},
			q: 'find_node',
			t: utils.randomID().slice(0, TID_LENGTH),
			y: 'q',
		};

		this.sendKRPC(msg, rinfo);
	}

	joinDHTNetwork () {
		BOOTSTRAP_NODES.forEach((node) => {
			this.sendFindNodeRequest(node);
		});
	}

	makeNeighbours () {
		this.ktable.nodes.forEach((node) => {
			this.sendFindNodeRequest({
				address: node.address,
				port: node.port,
			}, node.nid);
		});
		this.ktable.nodes = [];
	}

	onGetPeersRequest (msg, rinfo) {
		let infohash, tid, token;

		try {
			infohash = msg.a.info_hash;
			tid = msg.t;
			token = infohash.slice(0, TOKEN_LENGTH);
			const nid = msg.a.id;

			if (tid === undefined || infohash.length !== 20 || nid.length !== 20) {
				throw new Error('no tid, valid hash or valid nid');
			}
		} catch (error) {
			return;
		}

		this.sendKRPC({
			r: {
				id: utils.genNeighborID(infohash, this.ktable.nid),
				nodes: '',
				token,
			},
			t: tid,
			y: 'r',
		}, rinfo);
	}

	onAnnouncePeerRequest (msg, rinfo) { // eslint-disable-line max-statements
		let infohash, nid, port, tid, token;

		try {
			infohash = msg.a.info_hash;
			nid = msg.a.id;
			({ token } = msg.a);
			tid = msg.t;

			if (!tid) {
				throw new Error('invalid tid');
			}
		} catch (error) {
			return;
		}

		if (infohash.slice(0, TOKEN_LENGTH).toString() !== token.toString()) {
			return;
		}

		if (msg.a.implied_port !== undefined && msg.a.implied_port !== 0) {
			({ port } = rinfo);
		} else {
			port = msg.a.port || 0;
		}

		if (port >= 65536 || port <= 0) {
			return;
		}

		this.sendKRPC({
			r: { id: utils.genNeighborID(nid, this.ktable.nid) },
			t: tid,
			y: 'r',
		}, rinfo);

		this.btclient.add({
			address: rinfo.address,
			port,
		}, infohash);
	}

	onMessage (msg, rinfo) {
		try {
			const message = bencode.decode(msg);

			if (message.y == 'r' && message.r.nodes) {
				this.onFindNodeResponse(message.r.nodes);
			} else if (message.y == 'q' && message.q == 'get_peers') {
				this.onGetPeersRequest(message, rinfo);
			} else if (message.y == 'q' && message.q == 'announce_peer') {
				this.onAnnouncePeerRequest(message, rinfo);
			}
		} catch (err) {
			// Do nothing
		}
	}

	start () {
		this.udp.bind(this.port, this.address);

		this.udp.on('listening', () => {
			console.log('UDP Server listening on %s:%s', this.address, this.port);
		});

		this.udp.on('message', (msg, rinfo) => {
			this.onMessage(msg, rinfo);
		});

		this.udp.on('error', () => {
			// do nothing
		});

		setInterval(() => {
			if (this.btclient.isIdle()) {
				this.joinDHTNetwork();
				this.makeNeighbours();
			}
		}, 1000);
	}
}


export default Crawler;

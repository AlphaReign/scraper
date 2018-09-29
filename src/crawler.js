const bencode = require('bencode');
const config = require('./../config');
const crypto = require('crypto');
const dgram = require('dgram');

const decodeNodes = (data) => {
	const nodes = [];

	for (let i = 0; i + 26 <= data.length; i += 26) {
		nodes.push({
			address: `${data[i + 20]}.${data[i + 21]}.${data[i + 22]}.${data[i + 23]}`,
			nid: data.slice(i, i + 20),
			port: data.readUInt16BE(i + 24),
		});
	}
	return nodes;
};
const getNeighborID = (target, nid) => Buffer.concat([target.slice(0, 10), nid.slice(10)]);
const getRandomID = () =>
	crypto
		.createHash('sha1')
		.update(crypto.randomBytes(20))
		.digest();

const handleError = () => {
	// Do nothing
};

const safe = (fn) => (...params) => {
	try {
		const response = fn(...params);

		return response;
	} catch (error) {
		handleError(error);
	}

	return undefined;
};

const TID_LENGTH = 4;
const TOKEN_LENGTH = 2;
const clientID = getRandomID();
const serverSocket = dgram.createSocket('udp4');
let nodes = [];
let onTorrent = (torrent) => console.log(torrent);

const sendMessage = safe((message, rinfo) => {
	const buf = bencode.encode(message);

	serverSocket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
});

const onFindNodeResponse = safe((responseNodes) => {
	const decodedNodes = decodeNodes(responseNodes);

	decodedNodes.forEach((node) => {
		if (node.address !== '0.0.0.0' && node.nid !== clientID && node.port < 65536 && node.port > 0) {
			if (nodes.length < 2000) {
				nodes.push(node);
			}
		}
	});
});

const onGetPeersRequest = safe((msg, rinfo) => {
	const {
		a: { id: nid, info_hash: infohash },
		t: tid,
	} = msg;
	const token = infohash.slice(0, TOKEN_LENGTH);

	if (!tid || infohash.length !== 20 || nid.length !== 20) {
		throw new Error('No tid or nid or bad infohash');
	}

	sendMessage({ r: { id: getNeighborID(infohash, clientID), nodes: '', token }, t: tid, y: 'r' }, rinfo);
});

const onAnnouncePeerRequest = safe((msg, rinfo) => {
	const {
		a: { id: nid, info_hash: infohash, implied_port: impliedPort, port, token },
		t: tid,
	} = msg;
	const peerPort = impliedPort ? rinfo.port : port;

	if (!tid) {
		throw new Error('No tid');
	} else if (infohash.slice(0, TOKEN_LENGTH).toString() !== token.toString()) {
		throw new Error('invalid infohash length');
	} else if (!peerPort || peerPort >= 65536 || peerPort <= 0) {
		throw new Error('no port', peerPort);
	}

	sendMessage({ r: { id: getNeighborID(nid, clientID) }, t: tid, y: 'r' }, rinfo);
	// downloadTorrent({ address: rinfo.address, port }, infohash);
	onTorrent(infohash, { address: rinfo.address, port });
});

const onMessage = safe((message, rinfo) => {
	const msg = bencode.decode(message);
	const type = msg.y && Buffer.isBuffer(msg.y) ? msg.y.toString() : msg.y;
	const query = msg.q && Buffer.isBuffer(msg.q) ? msg.q.toString() : msg.q;

	if (type === 'r' && msg.r.nodes) {
		onFindNodeResponse(msg.r.nodes);
	} else if (type === 'q' && query === 'get_peers') {
		onGetPeersRequest(msg, rinfo);
	} else if (type === 'q' && query === 'announce_peer') {
		onAnnouncePeerRequest(msg, rinfo);
	}
});

const sendFindNodeRequest = ({ address, port }, nid) => {
	const t = getRandomID().slice(0, TID_LENGTH);
	const id = nid ? getNeighborID(nid, clientID) : clientID;

	sendMessage({ a: { id, target: getRandomID() }, q: 'find_node', t, y: 'q' }, { address, port });
};

const makeNeighbours = () => {
	nodes.forEach((node) => {
		sendFindNodeRequest(node, node.nid);
	});
	nodes = [];
};

const start = () => {
	nodes = nodes.concat(config.bootstrapNodes);
	makeNeighbours();

	setTimeout(() => start(), 1000);
};

const onListening = () => {
	console.log(`Crawler listening on ${config.crawler.address}:${config.crawler.port}`);

	start();
};

const crawler = (fn) => {
	serverSocket.bind(config.crawler.port, config.crawler.address);
	serverSocket.on('listening', onListening);
	serverSocket.on('message', onMessage);
	serverSocket.on('error', handleError);

	if (typeof fn === 'function') {
		onTorrent = fn;
	}
};

module.exports = crawler;

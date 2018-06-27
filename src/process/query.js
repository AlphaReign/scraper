import { compactNodes, encode, errorLogger } from './../utils';
import log from 'fancy-log';
import responses from './../packets/responses';

const get_peers = ({ decoded, id, rinfo }, socket, data) => {
	const info_hash = decoded.a.info_hash.toString('hex');
	const safeID = decoded.a.id.toString('hex');
	const clients = data.torrents[info_hash] && data.torrents[info_hash].clients ? data.torrents[info_hash].clients : {};

	data.torrents[info_hash] = {
		...data.torrents[info_hash],
		clients: {
			...clients,
			[safeID]: {
				...clients[safeID],
				address: rinfo.address,
				created: clients[safeID] && clients[safeID].created ? clients[safeID].created : Date.now(),
				id: decoded.a.id,
				port: rinfo.port,
				updated: Date.now(),
			},
		},
		created: data.torrents[info_hash] && data.torrents[info_hash].created ? data.torrents[info_hash].created : Date.now(),
		info_hash,
		updated: Date.now(),
	};

	const nodes = Object.keys(data.nodes)
		.filter((node, index) => index < 8)
		.map((nodeID) => data.nodes[nodeID]);
	const response =
		Object.keys(clients).length > 0
			? encode(responses.get_peers(id, compactNodes(Object.keys(clients).map((nodeID) => clients[nodeID]))))
			: encode(responses.get_peers(id, undefined, Buffer.concat(compactNodes(nodes))));

	socket.send(response, parseInt(rinfo.port), rinfo.address, errorLogger);
};

const query = ({ decoded, id, message, rinfo }, socket, data) => {
	const queryType = decoded.q.toString('utf8');

	log(`Process query type: ${queryType}`);

	if (queryType === 'find_node') {
		// Soon
	} else if (queryType === 'get_peers') {
		get_peers({ decoded, id, message, rinfo }, socket, data);
	} else if (queryType === 'ping') {
		socket.send(encode(responses.ping(id)), parseInt(rinfo.port), rinfo.address, errorLogger);
	} else {
		log(`Failed to handle query type: ${queryType}`);
	}
};

export default query;

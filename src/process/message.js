import bencode from 'bencode';
import log from 'fancy-log';
import query from './query';
import response from './response';

const addNode = ({ decoded, rinfo }, socket, data) => {
	let safeID;
	let clientID;

	if (decoded.r && decoded.r.id) {
		safeID = decoded.r.id.toString('hex');
		clientID = decoded.r.id;
	} else if (decoded.a && decoded.a.id) {
		safeID = decoded.a.id.toString('hex');
		clientID = decoded.a.id;
	}

	if (safeID) {
		data.nodes[safeID] = {
			...data.nodes[safeID],
			address: rinfo.address,
			created: data.nodes[safeID] && data.nodes[safeID].created ? data.nodes[safeID].created : Date.now(),
			id: clientID,
			port: rinfo.port,
			updated: Date.now(),
		};
	}
};

export const processMessage = ({ id, message, rinfo }, socket, data) => {
	try {
		const decoded = bencode.decode(message);
		const type = decoded.y ? decoded.y.toString('utf8') : undefined;

		addNode({ decoded, id, rinfo }, socket, data);

		if (type === 'q') {
			query({ decoded, id, message, rinfo }, socket, data);
		} else if (type === 'r') {
			response({ decoded, id, message, rinfo }, socket, data);
		} else if (type === 'e') {
			log(decoded.e[0], decoded.e[1].toString('utf8'));
		} else {
			log(`Failed to handle type: ${type}`);
			// console.log(decoded);
		}
	} catch (error) {
		log(error);
	}
};

export default processMessage;

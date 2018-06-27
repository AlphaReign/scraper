import bencode from 'bencode';
import { log } from './../utils';
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
		// log(`added node ${safeID} from ${rinfo.address}:${rinfo.port}`);

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

const handleUndefinedType = ({ decoded, type }) => {
	if (decoded.v) {
		log(`Failed to handle message with version: ${decoded.v.toString('utf8')} || ${JSON.stringify(decoded)}`, true);
	} else {
		log(`Failed to handle type: ${type} || ${JSON.stringify(decoded)}`, true);
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
			log(`Received an error message : ${decoded.e[0]} : ${decoded.e[1].toString('utf8')}`);
		} else {
			handleUndefinedType({ decoded, id, message, rinfo, type }, socket, data);
		}
	} catch (error) {
		log(error, true);
	}
};

export default processMessage;

/* eslint no-unused-vars:off */
import bencode from 'bencode';
import log from 'fancy-log';

/*
 * rinfo: { address: '67.215.246.10', family: 'IPv4', port: 6881, size: 61 }
 * decoded: { ip: <Buffer ad c5 10 3e 14 41>,
 *   r: { id: <Buffer 32 f5 4e 69 73 51 ff 4a ec 29 cd ba ab f2 fb e3 46 7c c2 67> },
 *   t: <Buffer 31 33 38 61>,
 *   y: <Buffer 72>
 * }
 * cleaned: { ip: '��\u0010>\u0014A',
 *   r: { id: '2�NisQ�J�)ͺ����F|�g' },
 *   t: '138a',
 *   y: 'r'
 * }
 */

const query = ({ decoded, id, message, rinfo }, socket, data) => {
	const queryType = decoded.q.toString('utf8');

	if (queryType === 'find_node') {
		log(`Process query type: ${queryType}`);
	} else if (queryType === 'get_peers') {
		log(`Process query type: ${queryType}`);
	} else if (queryType === 'ping') {
		log(`Process query type: ${queryType}`);
	} else {
		log(`Failed to handle query type: ${queryType}`);
	}
};

const response = ({ decoded, id, message, rinfo }, socket, data) => {
	const responseType = decoded.r.toString('utf8');

	if (responseType === 'find_node') {
		log(`Process response type: ${responseType}`);
	} else if (responseType === 'get_peers') {
		log(`Process response type: ${responseType}`);
	} else if (responseType === 'ping') {
		log(`Process response type: ${responseType}`);
	} else {
		log(`Failed to handle response type: ${responseType}`);
	}
};

export const processMessage = ({ id, message, rinfo }, socket, data) => {
	const decoded = bencode.decode(message);
	const safeID = decoded.r.id.toString('hex');
	const type = decoded.y.toString('utf8');

	data.nodes[safeID] = {
		...data.nodes[safeID],
		address: rinfo.address,
		created: data.nodes[safeID] && data.nodes[safeID].created ? data.nodes[safeID].created : Date.now(),
		id: decoded.r.id,
		lastQueried: data.nodes[safeID] && data.nodes[safeID].lastQueried ? data.nodes[safeID].lastQueried : Date.now(),
		port: rinfo.port,
		updated: Date.now(),
	};

	if (type === 'q') {
		query({ decoded, id, message, rinfo }, socket, data);
	} else if (type === 'r') {
		response({ decoded, id, message, rinfo }, socket, data);
	} else {
		log(`Failed to handle type: ${type}`);
	}
};

export default processMessage;

import { depactNodes } from './../utils';
import log from 'fancy-log';

const find_nodes = ({ decoded }, socket, data) => {
	const nodes = depactNodes(decoded.r.nodes);

	nodes.forEach((node) => {
		const safeID = node.id.toString('hex');

		data.nodes[safeID] = {
			...data.nodes[safeID],
			address: node.address,
			created: data.nodes[safeID] && data.nodes[safeID].created ? data.nodes[safeID].created : Date.now(),
			id: decoded.r.id,
			port: node.port,
			updated: Date.now(),
		};
	});
};

const response = ({ decoded, id, message, rinfo }, socket, data) => {
	if (decoded.r.nodes) {
		find_nodes({ decoded, id, message, rinfo }, socket, data);
	} else if (decoded.r.token) {
		log(`Process response type: get_peers`);
	} else if (decoded.r.info_hash) {
		log(`Process response type: announce_peer`);
	} else {
		log(`Processing response as ping`);
	}
};

export default response;

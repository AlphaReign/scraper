import { depactNodes, log } from './../utils';

const upsert = async ({ clientID, node, safeID }, knex) => {
	const nodes = await knex('node').where({ safeID });
	const defaultData = {
		created: Date.now(),
		lastQueried: 0,
		safeID,
	};
	const nodeData = {
		...(nodes.length > 0 ? nodes[0] : defaultData),
		address: node.address,
		id: clientID,
		port: parseInt(node.port),
		updated: Date.now(),
	};

	if (nodes.length > 0) {
		await knex('node')
			.where({ safeID })
			.update(nodeData);
	} else {
		await knex('node').insert(nodeData);
	}
};

const find_node = async ({ decoded }, socket, knex) => {
	const nodes = depactNodes(decoded.r.nodes);

	await Promise.all(
		nodes.map((node) => upsert({ clientID: decoded.r.id, node, safeID: node.id.toString('hex') }, knex)),
	);
};

const response = async ({ decoded, id, message, rinfo }, socket, knex) => {
	// log(`received a response message`);

	if (decoded.r.nodes) {
		await find_node({ decoded, id, message, rinfo }, socket, knex);
	} else if (decoded.r.token) {
		log(`Process response type: get_peers`);
	} else if (decoded.r.info_hash) {
		log(`Process response type: announce_peer`);
	} else {
		// log(`Processing response as ping`);
	}
};

export default response;

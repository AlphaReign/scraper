import { createID, encode, errorLogger } from './utils';
import queries from './packets/queries';

const queryNodes = (id, socket, data) => {
	Object.keys(data.nodes)
		.map((nodeID) => ({
			...data.nodes[nodeID],
			lastQueried: data.nodes[nodeID].lastQueried || 0,
		}))
		.sort((a, b) => a.lastQueried - b.lastQueried)
		.filter((node, index) => index < 100)
		.forEach((node) => {
			const payload = encode(queries.find_node(id, createID()));

			socket.send(payload, parseInt(node.port), node.address, errorLogger);
		});

	setTimeout(() => queryNodes(id, socket, data), 10000);
};

export const crawl = (id, socket, data) => {
	const find_nodes = encode(queries.find_node(id, createID()));

	socket.send(find_nodes, 6881, 'router.bittorrent.com', errorLogger);

	queryNodes(id, socket, data);
};

export default crawl;

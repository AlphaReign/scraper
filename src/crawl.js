import { createID, encode, errorLogger, log } from './utils';
import queries from './packets/queries';

const queryNodes = async (id, socket, knex) => {
	const nodes = await knex('node')
		.limit(100)
		.orderBy('lastQueried', 'ASC');

	nodes.forEach((node) => {
		const payload = encode(queries.find_node(id, createID()));

		socket.send(payload, node.port, node.address, errorLogger);
	});

	setTimeout(() => queryNodes(id, socket, knex), 10000);
};

const pingNodes = async (id, socket, knex) => {
	const nodes = await knex('node');

	log(`pinging nodes`);
	log(`Total Nodes: ${nodes.length}`);

	nodes.forEach((node) => {
		const ping = encode(queries.ping(id));

		socket.send(ping, node.port, node.address, errorLogger);
	});

	setTimeout(() => queryNodes(id, socket, knex), 60000);
};

export const crawl = (id, socket, knex) => {
	const find_node = encode(queries.find_node(id, createID()));

	socket.send(find_node, 6881, 'router.bittorrent.com', errorLogger);

	queryNodes(id, socket, knex);
	pingNodes(id, socket, knex);
};

export default crawl;

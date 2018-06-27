import { createToken, createTransactionID } from './../utils';

/*
 * t: transaction ID
 * y: type of message (q -> query [requires q,a], r -> response [requires r])
 * q: query type (ping, find_node, ...)
 * a: dictionary containing named arguments
 * r: dictionary containing named returned values
 */

export const announce_peer = (id) => ({
	r: {
		id,
	},
	t: createTransactionID(),
	y: 'r',
});

export const find_node = (id, nodes) => ({
	r: {
		id,
		nodes,
	},
	t: createTransactionID(),
	y: 'r',
});

export const get_peers = (id, values, nodes) => ({
	r: {
		id,
		nodes,
		token: createToken(),
		values,
	},
	t: createTransactionID(),
	y: 'r',
});

export const ping = (id) => ({
	r: { id },
	t: createTransactionID(),
	y: 'r',
});

export default {
	find_node,
	get_peers,
	ping,
};

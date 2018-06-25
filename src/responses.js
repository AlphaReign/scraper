import { createTransactionID } from './../utils/dht';

/*
 * t: transaction ID
 * y: type of message (q -> query [requires q,a], r -> response [requires r])
 * q: query type (ping, find_node, ...)
 * a: dictionary containing named arguments
 * r: dictionary containing named returned values
 */

export const ping = (id) => ({
	r: { id },
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

export default {
	find_node,
	ping,
};

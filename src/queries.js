import { createTransactionID } from './utils';

/*
 * t: transaction ID
 * y: type of message (q -> query [requires q,a], r -> response [requires r])
 * q: query type (ping, find_node, ...)
 * a: dictionary containing named arguments
 * r: dictionary containing named returned values
 */

export const ping = (id) => ({
	a: { id },
	q: 'ping',
	t: createTransactionID(),
	y: 'q',
});

export const find_node = (id, target) => ({
	a: {
		id,
		target,
	},
	q: 'find_node',
	t: createTransactionID(),
	y: 'q',
});

export default {
	find_node,
	ping,
};

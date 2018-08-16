import bencode from 'bencode';
import { log } from './../utils';
import query from './query';
import response from './response';

const upsert = async ({ clientID, rinfo, safeID }, knex) => {
	const nodes = await knex('node').where({ safeID });
	const defaultData = {
		created: Date.now(),
		lastQueried: 0,
		safeID,
	};
	const node = {
		...(nodes.length > 0 ? nodes[0] : defaultData),
		address: rinfo.address,
		id: clientID,
		port: parseInt(rinfo.port),
		updated: Date.now(),
	};

	if (nodes.length > 0) {
		await knex('node')
			.where({ safeID })
			.update(node);
	} else {
		await knex('node').insert(node);
	}
};

const addNode = async ({ decoded, rinfo }, socket, knex) => {
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
		await upsert({ clientID, rinfo, safeID }, knex);
	}
};

const handleUndefinedType = ({ decoded, type }) => {
	if (decoded.v) {
		log(`Failed to handle message with version: ${decoded.v.toString('utf8')} || ${JSON.stringify(decoded)}`, true);
	} else {
		log(`Failed to handle type: ${type} || ${JSON.stringify(decoded)}`, true);
	}
};

export const processMessage = async ({ id, message, rinfo }, socket, knex) => {
	try {
		const decoded = bencode.decode(message);
		const type = decoded.y ? decoded.y.toString('utf8') : undefined;

		await addNode({ decoded, id, rinfo }, socket, knex);

		if (type === 'q') {
			await query({ decoded, id, message, rinfo }, socket, knex);
		} else if (type === 'r') {
			await response({ decoded, id, message, rinfo }, socket, knex);
		} else if (type === 'e') {
			await log(`Received an error message : ${decoded.e[0]} : ${decoded.e[1].toString('utf8')}`);
		} else {
			await handleUndefinedType({ decoded, id, message, rinfo, type }, socket, knex);
		}
	} catch (error) {
		log(error, true);
	}
};

export default processMessage;

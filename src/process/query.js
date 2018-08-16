import { compact, compactNodes, encode, errorLogger, log } from './../utils';
import responses from './../packets/responses';

const addTorrent = async ({ infohash, safeID }, socket, knex) => {
	const clients = await knex('torrentNodeXref').where({ infohash, safeID });

	if (clients.length === 0) {
		await knex('torrentNodeXref').insert({ infohash, safeID });
	}

	const torrents = await knex('torrent').where({ infohash });

	if (torrents.length > 0) {
		await knex('torrent')
			.update({ updated: Date.now() })
			.where({ infohash });
	} else {
		await knex('torrent').insert({
			created: Date.now(),
			infohash,
			updated: Date.now(),
		});
	}

	const count = await knex('torrent').count();

	log(`Total: ${count[0]['count(*)']} || Added torrent: ${infohash}`);
};

const get_peers = async ({ decoded, id, rinfo }, socket, knex) => {
	const infohash = decoded.a.info_hash.toString('hex');
	const safeID = decoded.a.id.toString('hex');
	const matchingClients = await knex('torrentNodeXref').where({ infohash });

	await addTorrent({ decoded, id, infohash, rinfo, safeID }, socket, knex);

	const nodes =
		matchingClients.length > 0
			? await knex('node').whereIn('safeID', matchingClients.map((record) => record.safeID))
			: await knex('node').limit(8);
	const response =
		matchingClients.length > 0
			? encode(responses.get_peers(id, compactNodes(nodes)))
			: encode(responses.get_peers(id, undefined, Buffer.concat(compactNodes(nodes))));

	socket.send(response, rinfo.port, rinfo.address, errorLogger);
};

const find_node = async ({ decoded, id, rinfo }, socket, knex) => {
	const safeID = decoded.a.target.toString('hex');

	const matchingNodes = await knex('node').where({ safeID });

	if (matchingNodes.length > 0) {
		const response = encode(responses.find_node(id, compact(matchingNodes[0])));

		socket.send(response, parseInt(rinfo.port), rinfo.address, errorLogger);
	} else {
		const nodes = await knex('node')
			.limit(8)
			.orderBy('updated', 'DESC');
		const response = encode(responses.find_node(id, Buffer.concat(compactNodes(nodes))));

		socket.send(response, parseInt(rinfo.port), rinfo.address, errorLogger);
	}
};

const announce_peer = async ({ decoded, id, rinfo }, socket, knex) => {
	const info_hash = decoded.a.info_hash.toString('hex');
	const safeID = decoded.a.id.toString('hex');

	await addTorrent({ decoded, id, info_hash, rinfo, safeID }, socket, knex);
	socket.send(encode(responses.announce_peer(id)), parseInt(rinfo.port), rinfo.address, errorLogger);
};

const ping = ({ id, rinfo }, socket) => {
	socket.send(encode(responses.ping(id)), parseInt(rinfo.port), rinfo.address, errorLogger);
};

const query = async ({ decoded, id, message, rinfo }, socket, knex) => {
	const queryType = decoded.q.toString('utf8');

	if (queryType === 'find_node') {
		await find_node({ decoded, id, message, rinfo }, socket, knex);
	} else if (queryType === 'announce_peer') {
		await announce_peer({ decoded, id, message, rinfo }, socket, knex);
	} else if (queryType === 'get_peers') {
		await get_peers({ decoded, id, message, rinfo }, socket, knex);
	} else if (queryType === 'ping') {
		await ping({ decoded, id, message, rinfo }, socket, knex);
	} else {
		log(`Failed to handle query type: ${queryType}`);
	}
};

export default query;

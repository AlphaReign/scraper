import { MongoClient } from 'mongodb';
import config from './../config';

let client, db;

const getClient = () => (
	new Promise((resolve, reject) => MongoClient.connect(config.mongodb.url, (error, mongoClient) => {
		if (error) {
			reject(error);
		} else {
			resolve(mongoClient);
		}
	}))
);

export const upsert = async (torrent) => {
	if (!client) {
		client = await getClient();
	}
	if (!db) {
		db = client.db('alphareign');
	}
	const collection = db.collection('torrents');

	torrent.updated = new Date();

	await collection.update({ infohash: torrent.infohash }, torrent, { upsert: true });
	await collection.update({
		created: { $exists: false },
		infohash: torrent.infohash,
	}, { $set: { created: new Date() } });
};

export const count = async () => {
	if (!client) {
		client = await getClient();
	}
	if (!db) {
		db = client.db('alphareign');
	}
	const collection = db.collection('torrents');
	const response = await collection.count();

	return response;
};

export default {
	count,
	upsert,
};
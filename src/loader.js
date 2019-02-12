const bulkStore = require('./bulkStore');
const { createModel } = require('nativemodels');
const elasticsearch = require('elasticsearch');
const elasticsearchSchema = require('./models/elasticsearch');
const ms = require('ms');

const elasticsearchModel = createModel(elasticsearchSchema);

const defaultOptions = {
	bulkLimit: 1000,
	flushInterval: ms('15 sec'),
	host: '127.0.0.1:9200',
	index: {
		index: 'torrents',
		type: '_doc',
	},
};

class Loader {
	constructor(options) {
		this.records = [];
		this.options = { ...defaultOptions, options };
		this.client = new elasticsearch.Client({ host: this.options.host });
	}

	addRecord(record) {
		this.records.push(record);

		if (!this.timeout) {
			this.timeout = setTimeout(() => this.flushRecords(), this.options.flushInterval);
		}

		if (this.records.length < this.options.bulkLimit) {
			return;
		}

		this.flushRecords();
	}

	flushRecords() {
		const bulkRecords = this.records;

		this.records = [];
		bulkStore(bulkRecords, this.client);
		clearTimeout(this.timeout);
		this.timeout = false;
	}

	async getTorrent(infoHash) {
		try {
			const response = await elasticsearch.get({
				...this.options.index,
				id: infoHash,
			});

			console.log(response);

			return response;
		} catch (error) {
			return {};
		}
	}

	async addTorrent(infoHash, data = {}) {
		const torrent = await this.getTorrent(infoHash);
		const doc = { ...data, infoHash, updated: Date.now() };

		if (!torrent) {
			doc.created = Date.now();
		}

		const record = elasticsearchModel({ action: 'upsert', doc, id: infoHash, index: this.options.index.index });

		this.addRecord(record);
	}

	log(action, message, status) {
		const record = elasticsearchModel({
			action: 'index',
			doc: { action, created: Date.now(), message, status },
			index: 'logs',
		});

		this.addRecord(record);
	}
}

module.exports = Loader;

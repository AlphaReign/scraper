import Categorizer from './categorizer';
import _ from 'lodash';
import elasticsearch from 'elasticsearch';

export class Indexer {
	constructor (config) {
		this.config = config;

		this.es = new elasticsearch.Client({ ...this.config.elasticsearch });
		this.categorizer = new Categorizer();

		this.torrents = [];
		this.creations = [];

		this.inserted = false;
	}

	getFiles (record, torrentData) {
		const { files } = torrentData.info;
		const recordFiles = [];

		if (typeof files !== 'undefined' && files.length < 100) {
			files.forEach((element) => {
				try {
					recordFiles.push({
						length: element.length,
						path: element.path.toString()
					});
				} catch (error) {
					console.log(error);
				}
			});
		}

		return recordFiles;
	}

	addTorrent (torrentData) {
		if (typeof torrentData.info.name === 'undefined') {
			return;
		}

		let record = {
			categories: [],
			dht: 1,
			infohash: _.get(torrentData, 'infohash', ''),
			magnet: _.get(torrentData, 'magnet', ''),
			name: _.get(torrentData, 'info.name', '').toString(),
			peers_updated: 0,
			search: _.get(torrentData, 'info.name', '').toString()
				.replace(/\./g, ' ')
				.replace(/\_/g, ' '),
			tags: [],
			type: '',
			updated: Math.floor(new Date().getTime() / 1000)
		};

		if (typeof torrentData.info['file-duration'] !== 'undefined' && torrentData.info['file-duration'].length < 100) {
			record.file_duration = torrentData.info['file-duration'];
		}

		if (typeof torrentData.info['file-media'] !== 'undefined' && torrentData.info['file-media'].length < 100) {
			record.file_media = torrentData.info['file-media'];
		}

		record.files = this.getFiles(record, torrentData);

		record = this.categorizer.parse(record);

		this.queue(record);
	}

	queue (torrent) {
		console.log(`Queuing: ${torrent.infohash} | ${torrent.name}`);

		const update = {
			update: {
				_id: torrent.infohash,
				_index: 'torrents',
				_retry_on_conflict: 3,
				_type: 'hash'
			}
		};
		const doc = {
			doc: torrent,
			doc_as_upsert: true
		};

		const script = {
			lang: 'painless',
			script: 'if( !ctx._source.containsKey("created") ){ ctx._source.created = params.time; }',
			params: { time: Math.floor(Date.now() / 1000) },
		};

		this.torrents.push(update);
		this.torrents.push(doc);

		this.creations.push(update);
		this.creations.push(script);

		this.checkQueue();
	}

	checkQueue () {
		if (this.torrents.length / 2 < this.config.batchSize && this.inserted) {
			return;
		}

		const { torrents } = this;
		const { creations } = this;

		this.torrents = [];
		this.creations = [];

		this.es.bulk({ body: torrents }, (error) => {
			if (error) {
				console.log(error);
			} else {
				console.log('Queue Processed');
				this.es.bulk({ body: creations }, (error) => {
					if (error) {
						console.log(error);
					} else {
						console.log("Creation Times Added");
						this.inserted = true;
					}
				});
			}
		});
	}
}

export default Indexer;

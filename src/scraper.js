import Client from 'bittorrent-tracker';
import elasticsearch from 'elasticsearch';

export class Scraper {
	constructor (config) {
		this.config = config;

		this.es = new elasticsearch.Client({ ...this.config.elasticsearch });
	}

	run () {
		this.es.search({
			body: {
				query: {
					bool: {
						filter: {
							range: {
								peers_updated: {
									lt: ( Date.now() / 1000 ) - ( this.config.peerAge * 60 * 60 )
								}
							}
						}
					}
				},
				sort: {
					peers_updated: {
						missing: '_first',
						order: 'asc'
					}
				}
			},
			index: 'torrents',
			size: 75,
			type: 'hash'
		}, (error, response) => {
			if (error) {
				setTimeout(() => {
					this.run();
				}, this.config.scrapeFrequency * 1000 * 5);

				return;
			}
			if (response.hits.hits.length === 0) {
				console.log(`No torrents need to be scraped`);
				setTimeout(() => {
					this.run();
				}, this.config.scrapeFrequency * 1000 * 5);
			} else {
				const hashes = response.hits.hits.map((value) => value._id);

				this.scrape(hashes);
			}
		});

	}

	scrape (hashes) {
		const requiredOpts = {
			announce: [this.config.tracker],
			infoHash: hashes
		};

		Client.scrape(requiredOpts, (error, results) => {
			if (error) {
				console.log(error);
				setTimeout(() => {
					this.run();
				}, 5000);
			} else {
				console.log('Scrape Successful');
				this.update(results);
			}
		});

	}

	addRecord (records, record) {
		const update = {
			update: {
				_id: record.infoHash,
				_index: 'torrents',
				_retry_on_conflict: 3,
				_type: 'hash'
			}
		};

		const doc = {
			doc: {
				leechers: record.incomplete,
				peers_updated: Math.floor(Date.now() / 1000),
				seeders: record.complete
			},
			doc_as_upsert: true
		};

		records.push(update);
		records.push(doc);

		return records;
	}

	update (results) {
		let records = [];

		if (typeof results.infoHash === 'undefined') {
			for (const infoHash in results) {
				if (results[infoHash]) {
					records = this.addRecord(records, results[infoHash]);
				}
			}
		} else {
			records = this.addRecord(records, results);
		}

		this.store(records);
	}

	store (records) {
		if (records.length > 0) {
			this.es.bulk({ body: records }, (error) => {
				if (error) {
					console.log(error);
					setTimeout(() => {
						this.run();
					}, this.config.scrapeFrequency * 1000);
				} else {
					console.log('Peers Updated');
					setTimeout(() => {
						this.run();
					}, this.config.scrapeFrequency * 1000);
				}
			});
		}
	}

}

export default Scraper;
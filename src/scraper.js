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
				query: { match_all: {} },
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
				// console.log(error);
				setTimeout(() => {
					this.run();
				}, 5000);

				return;
			}
			if (response.hits.hits.length === 0) {
				setTimeout(() => {
					this.run();
				}, 5000);
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

	update (results) {
		const records = [];

		for (const infoHash in results) {
			if (results[infoHash]) {
				const update = {
					update: {
						_id: results[infoHash].infoHash,
						_index: 'torrents',
						_retry_on_conflict: 3,
						_type: 'hash'
					}
				};

				const doc = {
					doc: {
						leechers: results[infoHash].incomplete,
						peers_updated: Math.floor(Date.now() / 1000),
						seeders: results[infoHash].complete
					},
					doc_as_upsert: true
				};

				records.push(update);
				records.push(doc);

			}
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
					}, 5000);
				} else {
					console.log('Peers Updated');
					setTimeout(() => {
						this.run();
					}, 1000);
				}
			});
		}
	}

}

export default Scraper;
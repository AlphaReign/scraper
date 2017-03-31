'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Scraper = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bittorrentTracker = require('bittorrent-tracker');

var _bittorrentTracker2 = _interopRequireDefault(_bittorrentTracker);

var _elasticsearch = require('elasticsearch');

var _elasticsearch2 = _interopRequireDefault(_elasticsearch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scraper = exports.Scraper = function () {
	function Scraper(config) {
		_classCallCheck(this, Scraper);

		this.config = config;

		this.es = new _elasticsearch2.default.Client(_extends({}, this.config.elasticsearch));
	}

	_createClass(Scraper, [{
		key: 'run',
		value: function run() {
			var _this = this;

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
			}, function (error, response) {
				if (error) {
					// console.log(error);
					setTimeout(function () {
						_this.run();
					}, 5000);

					return;
				}
				if (response.hits.hits.length === 0) {
					setTimeout(function () {
						_this.run();
					}, 5000);
				} else {
					var hashes = response.hits.hits.map(function (value) {
						return value._id;
					});

					_this.scrape(hashes);
				}
			});
		}
	}, {
		key: 'scrape',
		value: function scrape(hashes) {
			var _this2 = this;

			var requiredOpts = {
				announce: [this.config.tracker],
				infoHash: hashes
			};

			_bittorrentTracker2.default.scrape(requiredOpts, function (error, results) {
				if (error) {
					console.log(error);
					setTimeout(function () {
						_this2.run();
					}, 5000);
				} else {
					console.log('Scrape Successful');
					_this2.update(results);
				}
			});
		}
	}, {
		key: 'update',
		value: function update(results) {
			var records = [];

			for (var infoHash in results) {
				if (results[infoHash]) {
					var update = {
						update: {
							_id: results[infoHash].infoHash,
							_index: 'torrents',
							_retry_on_conflict: 3,
							_type: 'hash'
						}
					};

					var doc = {
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
	}, {
		key: 'store',
		value: function store(records) {
			var _this3 = this;

			if (records.length > 0) {
				this.es.bulk({ body: records }, function (error) {
					if (error) {
						console.log(error);
						setTimeout(function () {
							_this3.run();
						}, 5000);
					} else {
						console.log('Peers Updated');
						setTimeout(function () {
							_this3.run();
						}, 1000);
					}
				});
			}
		}
	}]);

	return Scraper;
}();

exports.default = Scraper;
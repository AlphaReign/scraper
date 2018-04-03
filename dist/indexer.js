'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Indexer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _categorizer = require('./categorizer');

var _categorizer2 = _interopRequireDefault(_categorizer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _elasticsearch = require('elasticsearch');

var _elasticsearch2 = _interopRequireDefault(_elasticsearch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Indexer = exports.Indexer = function () {
	function Indexer(config) {
		_classCallCheck(this, Indexer);

		this.config = config;

		this.es = new _elasticsearch2.default.Client(_extends({}, this.config.elasticsearch));
		this.categorizer = new _categorizer2.default();

		this.torrents = [];
		this.creations = [];

		this.inserted = false;
	}

	_createClass(Indexer, [{
		key: 'getFiles',
		value: function getFiles(record, torrentData) {
			var files = torrentData.info.files;

			var recordFiles = [];

			if (typeof files !== 'undefined' && files.length < 250) {
				files.forEach(function (element) {
					try {
						recordFiles.push({
							length: element.length,
							path: element.path.toString()
						});
					} catch (error) {
						console.log(error);
					}
				});
			} else {
				try {
					recordFiles.push({
						length: _lodash2.default.get(torrentData, 'info.length', '').toString(),
						path: _lodash2.default.get(torrentData, 'info.name', '').toString()
					});
				} catch (error) {
					console.log(error);
				}
			}

			return recordFiles;
		}
	}, {
		key: 'addTorrent',
		value: function addTorrent(torrentData) {
			if (typeof torrentData.info.name === 'undefined') {
				return;
			}

			var record = {
				categories: [],
				dht: 1,
				infohash: _lodash2.default.get(torrentData, 'infohash', ''),
				magnet: _lodash2.default.get(torrentData, 'magnet', ''),
				name: _lodash2.default.get(torrentData, 'info.name', '').toString(),
				peers_updated: 0,
				search: _lodash2.default.get(torrentData, 'info.name', '').toString().replace(/\./g, ' ').replace(/\_/g, ' '),
				tags: [],
				type: '',
				updated: Math.floor(new Date().getTime() / 1000)
			};

			if (typeof torrentData.info['file-duration'] !== 'undefined' && torrentData.info['file-duration'].length < 250) {
				record.file_duration = torrentData.info['file-duration'];
			}

			if (typeof torrentData.info['file-media'] !== 'undefined' && torrentData.info['file-media'].length < 250) {
				record.file_media = torrentData.info['file-media'];
			}

			record.files = this.getFiles(record, torrentData);

			record = this.categorizer.parse(record);

			this.queue(record);
		}
	}, {
		key: 'queue',
		value: function queue(torrent) {
			console.log('Queuing: ' + torrent.infohash + ' | ' + torrent.name);

			var update = {
				update: {
					_id: torrent.infohash,
					_index: 'torrents',
					_retry_on_conflict: 3,
					_type: 'hash'
				}
			};
			var doc = {
				doc: torrent,
				doc_as_upsert: true
			};
			var script = {
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
	}, {
		key: 'checkQueue',
		value: function checkQueue() {
			var _this = this;

			if (this.torrents.length / 2 < this.config.batchSize && this.inserted) {
				return;
			}

			var torrents = this.torrents;
			var creations = this.creations;


			this.torrents = [];
			this.creations = [];

			this.es.bulk({ body: torrents }, function (error) {
				if (error) {
					console.log(error);
				} else {
					console.log('Queue Processed');
					_this.es.bulk({ body: creations }, function (error) {
						if (error) {
							console.log(error);
						} else {
							console.log("Creation Times Added");
							_this.inserted = true;
						}
					});
				}
			});
		}
	}]);

	return Indexer;
}();

exports.default = Indexer;

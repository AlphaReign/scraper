'use strict';

var _indexer = require('./indexer');

var _indexer2 = _interopRequireDefault(_indexer);

var _scraper = require('./scraper');

var _scraper2 = _interopRequireDefault(_scraper);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _lib = require('./lib');

var _lib2 = _interopRequireDefault(_lib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var indexer = new _indexer2.default(_config2.default);
var scraper = new _scraper2.default(_config2.default);

var dht = (0, _lib2.default)(_config2.default.dht);

dht.ignore(function (infohash, rinfo, callback) {
	// false => always to download the metadata even though the metadata might exists.
	callback(false);
});
dht.on('metadata', indexer.addTorrent.bind(indexer));
dht.listen(6881, '0.0.0.0');

scraper.run();
'use strict';

var _indexer = require('./indexer');

var _indexer2 = _interopRequireDefault(_indexer);

var _scraper = require('./scraper');

var _scraper2 = _interopRequireDefault(_scraper);

var _lib = require('./lib');

var _lib2 = _interopRequireDefault(_lib);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = void 0;

try {
	config = JSON.parse(_fs2.default.readFileSync('./config.json'));
} catch (error) {
	try {
		config = JSON.parse(_fs2.default.readFileSync('./../config.json'));
	} catch (lastError) {
		throw new Error('Could not find config.json file');
	}
}

var indexer = new _indexer2.default(config);
var scraper = new _scraper2.default(config);

var dht = (0, _lib2.default)(config.dht);

dht.ignore(function (infohash, rinfo, callback) {
	// false => always to download the metadata even though the metadata might exists.
	callback(false);
});
dht.on('metadata', indexer.addTorrent.bind(indexer));
dht.listen(6881, '0.0.0.0');

scraper.run();
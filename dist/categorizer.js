'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Categorizer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Categorizer = exports.Categorizer = function () {
	function Categorizer() {
		_classCallCheck(this, Categorizer);

		this.videoFormats = ['.3g2', '.3gp', '.amv', '.asf', '.avi', '.drc', '.f4a', '.f4b', '.f4p', '.f4v', '.flv', '.gif', '.gifv', '.m2v', '.m4p', '.m4v', '.mkv', '.mng', '.mov', '.mp2', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mxf', '.net', '.nsv', '.ogv', '.qt', '.rm', '.rmvb', '.roq', '.svi', '.vob', '.webm', '.wmv', '.yuv'];
		this.audioFormats = ['.aa', '.aac', '.aax', '.act', '.aiff', '.amr', '.ape', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.m4a', '.m4b', '.mmf', '.mp3', '.mpc', '.msv', '.ogg', '.opus', '.ra', '.raw', '.sln', '.tta', '.vox', '.wav', '.wma', '.wv'];
		this.documentFormats = ['.cbr', '.cbz', '.cb7', '.cbt', '.cba', 'djvu', '.epub', '.fb2', '.ibook', '.azw', '.lit', '.prc', '.mobi', '.pdb', '.pdb', '.oxps', '.xps'];
		this.inactivateFormats = ['.wmv', '.wma', '.z'];
	}

	_createClass(Categorizer, [{
		key: 'parse',
		value: function parse(torrent) {
			var newTorrent = _extends({}, torrent, {
				categories: [],
				tags: [],
				type: ''
			});

			var files = this.getFiles(newTorrent);

			for (var i = 0; i < files.length; i += 1) {
				var file = files[i];

				newTorrent = this.getType(file, newTorrent);
				newTorrent = this.getCategories(file, newTorrent);
			}
			newTorrent.categories = _lodash2.default.uniq(newTorrent.categories);
			newTorrent.tags = _lodash2.default.uniq(newTorrent.tags);
			newTorrent.categories_updated = Math.floor(Date.now() / 1000);

			delete newTorrent.count;

			return newTorrent;
		}
	}, {
		key: 'getFiles',
		value: function getFiles(torrent) {
			var files = [];

			if (typeof torrent.files !== 'undefined') {
				for (var key in torrent.files) {
					if (key) {
						files.push(torrent.files[key].path);
					}
				}
			}
			files.push(torrent.name);

			return files;
		}
	}, {
		key: 'getType',
		value: function getType(file, torrent) {
			for (var i = 0; i < this.videoFormats.length; i += 1) {
				var ext = this.videoFormats[i];

				if (file.indexOf(ext) > -1 && torrent.type === '') {
					torrent.type = 'video';
				}
			}
			for (var _i = 0; _i < this.audioFormats.length; _i += 1) {
				var _ext = this.audioFormats[_i];

				if (file.indexOf(_ext) > -1 && torrent.type === '') {
					torrent.type = 'audio';
					torrent.count = typeof torrent.count === 'undefined' ? 1 : torrent.count + 1;
				}
			}
			for (var _i2 = 0; _i2 < this.documentFormats.length; _i2 += 1) {
				var _ext2 = this.documentFormats[_i2];

				if (file.indexOf(_ext2) > -1 && torrent.type === '') {
					torrent.type = 'doc';
				}
			}
			for (var _i3 = 0; _i3 < this.inactivateFormats.length; _i3 += 1) {
				var _ext3 = this.inactivateFormats[_i3];

				if (file.indexOf(_ext3) > -1) {
					torrent.inactive = true;
				}
			}

			return torrent;
		}
	}, {
		key: 'getCategories',
		value: function getCategories(file, torrent) {
			var newTorrent = torrent;
			var ext = '.' + file.split('.')[file.split('.').length - 1];

			if (newTorrent.type === 'video' && this.videoFormats.indexOf(ext) > -1) {
				newTorrent = this.getVideoCategories(file, newTorrent);
			}
			if (newTorrent.type === 'audio' && this.audioFormats.indexOf(ext) > -1) {
				newTorrent = this.getAudioCategories(file, newTorrent);
			}
			if (newTorrent.type === 'doc' && this.documentFormats.indexOf(ext) > -1) {
				newTorrent = this.getDocCategories(file, newTorrent);
			}

			return newTorrent;
		}
	}, {
		key: 'getVideoCategories',
		value: function getVideoCategories(file, torrent) {
			if (file.match(/season|episode|s[0-9]{2}e[0-9]{2}/i)) {
				torrent.categories.push('show');
			} else if (file.match(/[0-9]+x[0-9]+/i)) {
				torrent.categories.push('show');
			} else {
				torrent.categories.push('movie');
			}

			if (file.toLowerCase().indexOf('1080') > -1) {
				torrent.tags.push('1080');
			}
			if (file.toLowerCase().indexOf('720') > -1) {
				torrent.tags.push('720');
			}
			if (file.toLowerCase().indexOf('hd') > -1) {
				torrent.tags.push('HD');
			}
			if (file.toLowerCase().indexOf('sd') > -1) {
				torrent.tags.push('SD');
			}
			if (file.toLowerCase().indexOf('bdrip') > -1) {
				torrent.tags.push('BDRIP');
			}
			if (file.toLowerCase().indexOf('xxx') > -1) {
				torrent.tags.push('XXX');
			}
			if (file.toLowerCase().indexOf('dvdrip') > -1) {
				torrent.tags.push('DVDRIP');
			}

			return torrent;
		}
	}, {
		key: 'getAudioCategories',
		value: function getAudioCategories(file, torrent) {
			if (torrent.count > 3) {
				torrent.categories.push('album');
			}

			return torrent;
		}
	}, {
		key: 'getDocCategories',
		value: function getDocCategories(file, torrent) {
			if (file.indexOf('.epub')) {
				torrent.categories.push('ebook');
				torrent.tags.push('epub');
			}
			if (file.indexOf('.mobi')) {
				torrent.categories.push('ebook');
				torrent.tags.push('mobi');
			}
			if (file.indexOf('.azw3')) {
				torrent.categories.push('ebook');
				torrent.tags.push('kindle');
			}

			return torrent;
		}
	}]);

	return Categorizer;
}();

exports.default = Categorizer;
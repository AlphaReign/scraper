import _ from 'lodash';

export class Categorizer {
	videoFormats = ['.3g2', '.3gp', '.amv', '.asf', '.avi', '.drc', '.f4a', '.f4b', '.f4p', '.f4v', '.flv', '.gif', '.gifv', '.m2v', '.m4p', '.m4v', '.mkv', '.mng', '.mov', '.mp2', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mxf', '.net', '.nsv', '.ogv', '.qt', '.rm', '.rmvb', '.roq', '.svi', '.vob', '.webm', '.wmv', '.yuv'];
	audioFormats = ['.aa', '.aac', '.aax', '.act', '.aiff', '.amr', '.ape', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.m4a', '.m4b', '.mmf', '.mp3', '.mpc', '.msv', '.ogg', '.opus', '.ra', '.raw', '.sln', '.tta', '.vox', '.wav', '.wma', '.wv'];
	documentFormats = ['.cbr', '.cbz', '.cb7', '.cbt', '.cba', 'djvu', '.epub', '.fb2', '.ibook', '.azw', '.lit', '.prc', '.mobi', '.pdb', '.pdb', '.oxps', '.xps'];
	inactivateFormats = ['.wmv', '.wma', '.z'];

	parse (torrent) {
		let newTorrent = {
			...torrent,
			categories: [],
			tags: [],
			type: ''
		};

		const files = this.getFiles(newTorrent);

		for (let i = 0; i < files.length; i += 1) {
			const file = files[i];

			newTorrent = this.getType(file, newTorrent);
			newTorrent = this.getCategories(file, newTorrent);
		}
		newTorrent.categories = _.uniq(newTorrent.categories);
		newTorrent.tags = _.uniq(newTorrent.tags);
		newTorrent.categories_updated = Math.floor(Date.now() / 1000);

		delete newTorrent.count;

		return newTorrent;

	}

	getFiles (torrent) {
		const files = [];

		if (typeof torrent.files !== 'undefined') {
			for (const key in torrent.files) {
				if (key) {
					files.push(torrent.files[key].path);
				}
			}
		}
		files.push(torrent.name);

		return files;
	}

	getType (file, torrent) {
		for (let i = 0; i < this.videoFormats.length; i += 1) {
			const ext = this.videoFormats[i];

			if (file.indexOf(ext) > -1 && torrent.type === '') {
				torrent.type = 'video';
			}
		}
		for (let i = 0; i < this.audioFormats.length; i += 1) {
			const ext = this.audioFormats[i];

			if (file.indexOf(ext) > -1 && torrent.type === '') {
				torrent.type = 'audio';
				torrent.count = typeof torrent.count === 'undefined' ? 1 : torrent.count + 1;
			}
		}
		for (let i = 0; i < this.documentFormats.length; i += 1) {
			const ext = this.documentFormats[i];

			if (file.indexOf(ext) > -1 && torrent.type === '') {
				torrent.type = 'doc';
			}
		}
		for (let i = 0; i < this.inactivateFormats.length; i += 1) {
			const ext = this.inactivateFormats[i];

			if (file.indexOf(ext) > -1) {
				torrent.inactive = true;
			}
		}

		return torrent;
	}

	getCategories (file, torrent) {
		let newTorrent = torrent;
		const ext = `.${file.split('.')[file.split('.').length - 1]}`;

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

	getVideoCategories (file, torrent) {
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

	getAudioCategories (file, torrent) {
		if (torrent.count > 3) {
			torrent.categories.push('album');
		}

		return torrent;
	}

	getDocCategories (file, torrent) {
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

}

export default Categorizer;
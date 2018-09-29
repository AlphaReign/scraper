const { Duplex } = require('stream');
const crypto = require('crypto');
const BitField = require('bitfield');
const bencode = require('bencode');

const BT_RESERVED = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x01]);
const BT_PROTOCOL = Buffer.from('BitTorrent protocol');
const PIECE_LENGTH = Math.pow(2, 14);
const MAX_METADATA_SIZE = 10000000;
const BITFIELD_GROW = 1000;
const EXT_HANDSHAKE_ID = 0;
const BT_MSG_ID = 20;

class Wire extends Duplex {
	constructor(infohash) {
		super();

		this.init();
		this.infohash = infohash;
		this.onHandshake();
	}

	init() {
		this.bitfield = new BitField(0, { grow: BITFIELD_GROW });

		this.buffer = [];
		this.bufferSize = 0;

		this.next = null;
		this.nextSize = 0;

		this.metadata = null;
		this.metadataSize = null;
		this.numPieces = 0;
		this.utMetadata = null;
	}

	onMessageLength(buffer) {
		if (buffer.length >= 4) {
			const length = buffer.readUInt32BE(0);

			if (length > 0) {
				this.register(length, this.onMessage);
			}
		}
	}

	onMessage(buffer) {
		this.register(4, this.onMessageLength);
		if (buffer[0] === BT_MSG_ID) {
			this.onExtended(buffer.readUInt8(1), buffer.slice(2));
		}
	}

	onExtended(ext, buf) {
		if (ext === 0) {
			try {
				this.onExtHandshake(bencode.decode(buf));
			} catch (err) {
				throw new Error('failed to extend handshake');
			}
		} else {
			this.onPiece(buf);
		}
	}

	register(size, next) {
		this.nextSize = size;
		this.next = next;
	}

	end() {
		super.end();
	}

	onHandshake() {
		this.register(1, (buffer) => {
			if (buffer.length === 0) {
				this.end();

				throw new Error('handshake buffer length is 0');
			}

			const pstrlen = buffer.readUInt8(0);

			return this.register(pstrlen + 48, (handshake) => {
				const protocol = handshake.slice(0, pstrlen);

				if (protocol.toString() !== BT_PROTOCOL.toString()) {
					this.end();
					throw new Error('protocol is not bittorrent protocol');
				}
				const hs = handshake.slice(pstrlen);

				// eslint-disable-next-line no-negated-condition,no-implicit-coercion,no-extra-boolean-cast,no-bitwise
				if (!!(hs[5] & 0x10)) {
					this.register(4, this.onMessageLength);
					this.sendExtHandshake();
				} else {
					throw new Error(`the register isn't correct`);
				}
			});
		});
	}

	onExtHandshake(extHandshake) {
		if (
			!extHandshake.metadata_size ||
			!extHandshake.m.ut_metadata ||
			extHandshake.metadata_size > MAX_METADATA_SIZE
		) {
			throw new Error(`bad meta on extending handshake`);
		}

		this.metadataSize = extHandshake.metadata_size;
		this.numPieces = Math.ceil(this.metadataSize / PIECE_LENGTH);
		this.utMetadata = extHandshake.m.ut_metadata;

		this.requestPieces();
	}

	requestPieces() {
		this.metadata = Buffer.alloc(this.metadataSize);
		for (let piece = 0; piece < this.numPieces; piece += 1) {
			this.requestPiece(piece);
		}
	}

	requestPiece(piece) {
		const msg = Buffer.concat([
			Buffer.from([BT_MSG_ID]),
			Buffer.from([this.utMetadata]),
			bencode.encode({ msg_type: 0, piece }), // eslint-disable-line camelcase
		]);

		this.sendMessage(msg);
	}

	sendPacket(packet) {
		this.push(packet);
	}

	sendMessage(msg) {
		const buf = Buffer.alloc(4);

		buf.writeUInt32BE(msg.length, 0);
		this.sendPacket(Buffer.concat([buf, msg]));
	}

	sendHandshake() {
		const peerID = crypto
			.createHash('sha1')
			.update(crypto.randomBytes(20))
			.digest();
		const packet = Buffer.concat([
			Buffer.from([BT_PROTOCOL.length]),
			BT_PROTOCOL,
			BT_RESERVED,
			this.infohash,
			peerID,
		]);

		this.sendPacket(packet);
	}

	sendExtHandshake() {
		const msg = Buffer.concat([
			Buffer.from([BT_MSG_ID]),
			Buffer.from([EXT_HANDSHAKE_ID]),
			bencode.encode({ m: { ut_metadata: 1 } }), // eslint-disable-line camelcase
		]);

		this.sendMessage(msg);
	}

	onPiece(piece) {
		const str = piece.toString();
		const trailerIndex = str.indexOf('ee') + 2;
		const dict = bencode.decode(str.substring(0, trailerIndex));
		const trailer = piece.slice(trailerIndex);

		if (dict.msg_type === 1 && trailer.length > PIECE_LENGTH) {
			trailer.copy(this.metadata, dict.piece * PIECE_LENGTH);
			this.bitfield.set(dict.piece);
			this.checkDone();
		}
	}

	checkDone() {
		let done = true;

		for (let piece = 0; piece < this.numPieces; piece += 1) {
			if (!this.bitfield.get(piece)) {
				done = false;
				break;
			}
		}
		if (!done) {
			return;
		}
		this.onDone(this.metadata);
	}

	onDone(metadata) {
		const { info } = bencode.decode(metadata);
		const meta = info ? bencode.encode(info) : metadata;
		const infohash = crypto
			.createHash('sha1')
			.update(meta)
			.digest('hex');

		if (this.infohash.toString('hex') === infohash) {
			this.emit('metadata', { info: bencode.decode(meta) }, this.infohash);
		} else {
			throw new Error('infohash did not match up');
		}
	}

	fail(msg) {
		this.emit('fail', msg);
	}

	write(buf, encoding, next) {
		this.bufferSize += buf.length;
		this.buffer.push(buf);

		while (this.bufferSize >= this.nextSize) {
			const buffer = Buffer.concat(this.buffer);

			this.bufferSize -= this.nextSize;
			this.buffer = this.bufferSize ? [buffer.slice(this.nextSize)] : [];
			this.next(buffer.slice(0, this.nextSize));
		}

		next(null);
	}

	read() {
		// do nothing
	}
}

module.exports = Wire;

import BitField from 'bitfield';
import { Duplex } from 'stream';
import bencode from 'bencode';
import crypto from 'crypto';

const BT_RESERVED = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x01]);
const BT_PROTOCOL = Buffer.from('BitTorrent protocol');
const PIECE_LENGTH = Math.pow(2, 14);
const MAX_METADATA_SIZE = 10000000;
const BITFIELD_GROW = 1000;
const EXT_HANDSHAKE_ID = 0;
const BT_MSG_ID = 20;

export class Wire extends Duplex {
	bitfield = new BitField(0, { grow: BITFIELD_GROW });

	buffer = [];

	bufferSize = 0;

	next = null;

	nextSize = 0;

	metadata = null;

	metadataSize = null;

	numPieces = 0;

	utMetadata = null;

	constructor (infohash) {
		super();

		this.infohash = infohash;
		this.onHandshake();
	}

	_write (buf, encoding, next) {
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

	_read () {
		// do nothing
	}

	checkDone () {
		let done = true;

		for (let piece = 0; piece < this.numPieces; piece += 1) {
			if (!this.bitfield.get(piece)) {
				done = false;

				break;
			}
		}
		if (done) {
			this.onDone(this.metadata);
		}
	}

	end () {
		Duplex.prototype.end.apply(this);
	}

	fail () {
		this.emit('fail');
	}

	onDone (metadata) {
		let correctMetaData = metadata;

		try {
			if (bencode.decode(correctMetaData).info) {
				correctMetaData = bencode.encode(bencode.decode(correctMetaData).info);
			}
		} catch (err) {
			this.fail();

			return;
		}

		const infohash = crypto.createHash('sha1').update(correctMetaData).digest('hex');

		if (this.infohash.toString('hex') === infohash) {
			this.emit('metadata', { info: bencode.decode(correctMetaData) }, this.infohash);
		} else {
			this.fail();
		}
	}

	onExtHandshake (extHandshake) {
		if (!extHandshake.metadata_size || !extHandshake.m.ut_metadata || extHandshake.metadata_size > MAX_METADATA_SIZE) {
			this.fail();
			return;
		}

		this.metadataSize = extHandshake.metadata_size;
		this.numPieces = Math.ceil(this.metadataSize / PIECE_LENGTH);
		this.utMetadata = extHandshake.m.ut_metadata;

		this.requestPieces();
	}

	onExtended (ext, buf) {
		if (ext === 0) {
			try {
				this.onExtHandshake(bencode.decode(buf));
			}
			catch (err) {
				this.fail();
			}
		}
		else {
			this.onPiece(buf);
		}
	}

	onHandshake () {
		this.register(1, (buffer) => {
			if (buffer.length === 0) {
				this.end();
				this.fail();

				return;
			}

			const pstrlen = buffer.readUInt8(0);

			this.register(pstrlen + 48, (handshake) => {
				const protocol = handshake.slice(0, pstrlen);

				if (protocol.toString() !== BT_PROTOCOL.toString()) {
					this.end();
					this.fail();

					return;
				}

				if (Boolean(handshake.slice(pstrlen)[5] & 0x10)) { // eslint-disable-line
					this.register(4, this.onMessageLength);
					this.sendExtHandshake();
				} else {
					this.fail();
				}
			});
		});
	}

	onMessage (buffer) {
		this.register(4, this.onMessageLength);

		if (buffer[0] === BT_MSG_ID) {
			this.onExtended(buffer.readUInt8(1), buffer.slice(2));
		}
	}

	onMessageLength (buffer) {
		if (buffer.length >= 4) {
			const length = buffer.readUInt32BE(0);

			if (length > 0) {
				this.register(length, this.onMessage);
			}
		}
	}

	onPiece (piece) { // eslint-disable-line max-statements
		let dict, trailer;

		try {
			const str = piece.toString();
			const trailerIndex = str.indexOf('ee') + 2;

			dict = bencode.decode(str.substring(0, trailerIndex));
			trailer = piece.slice(trailerIndex);
		} catch (err) {
			this.fail();

			return;
		}

		if (dict.msg_type !== 1) {
			this.fail();

			return;
		}
		if (trailer.length > PIECE_LENGTH) {
			this.fail();

			return;
		}

		trailer.copy(this.metadata, dict.piece * PIECE_LENGTH);
		this.bitfield.set(dict.piece);
		this.checkDone();
	}

	register (size, next) {
		this.nextSize = size;
		this.next = next;
	}

	requestPiece (piece) {
		const msg = Buffer.concat([
			Buffer.from([BT_MSG_ID]),
			Buffer.from([this.utMetadata]),
			bencode.encode({
				msg_type: 0, // eslint-disable-line camelcase
				piece,
			}),
		]);

		this.sendMessage(msg);
	}

	requestPieces () {
		this.metadata = Buffer.alloc(this.metadataSize);

		for (let piece = 0; piece < this.numPieces; piece += 1) {
			this.requestPiece(piece);
		}
	}

	sendExtHandshake () {
		const msg = Buffer.concat([
			Buffer.from([BT_MSG_ID]),
			Buffer.from([EXT_HANDSHAKE_ID]),
			bencode.encode({ m: { ut_metadata: 1 } }), // eslint-disable-line camelcase
		]);

		this.sendMessage(msg);
	}

	sendHandshake () {
		const peerID = crypto.createHash('sha1').update(crypto.randomBytes(20)).digest();
		const packet = Buffer.concat([
			Buffer.from([BT_PROTOCOL.length]),
			BT_PROTOCOL,
			BT_RESERVED,
			this.infohash,
			peerID,
		]);

		this.sendPacket(packet);
	}

	sendMessage (msg) {
		const buf = Buffer.alloc(4);

		buf.writeUInt32BE(msg.length, 0);
		this.sendPacket(Buffer.concat([buf, msg]));
	}

	sendPacket (packet) {
		this.push(packet);
	}

}

export default Wire;

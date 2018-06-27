import bencode from 'bencode';
import crypto from 'crypto';

export const createID = () => crypto.randomBytes(10).toString('hex');

export const createToken = () => crypto.randomBytes(5).toString('hex');

export const createTransactionID = () => crypto.randomBytes(2).toString('hex');

export const encode = (payload) => bencode.encode(payload).toString();

export default {
	createID,
	createToken,
	createTransactionID,
	encode,
};

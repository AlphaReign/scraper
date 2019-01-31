module.exports = (target, nid) => Buffer.concat([target.slice(0, 10), nid.slice(10)]);

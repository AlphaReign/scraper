module.exports = [
	{
		includes: '1080',
		tag: '1080',
		type: 'video',
	},
	{
		includes: '720',
		tag: '720',
		type: 'video',
	},
	{
		includes: 'bdrip',
		tag: 'bdrip',
		type: 'video',
	},
	{
		includes: 'dvdrip',
		tag: 'dvdrip',
		type: 'video',
	},
	{
		includes: 'hd',
		tag: 'hd',
		type: 'video',
	},
	{
		includes: 'sd',
		tag: 'sd',
		type: 'video',
	},
	{
		includes: 'xxx',
		tag: 'xxx',
		type: 'video',
	},
	{
		includes: 'azw3',
		tag: 'kindle',
		type: 'doc',
	},
	{
		includes: 'epub',
		tag: 'epub',
		type: 'doc',
	},
	{
		includes: 'mobi',
		tag: 'mobi',
		type: 'doc',
	},
	{
		match: /season|episode|s[0-9]{2}e[0-9]{2}/iu,
		tag: 'show',
		type: 'video',
	},
	{
		match: /[0-9]+x[0-9]+/iu,
		tag: 'show',
		type: 'video',
	},
];

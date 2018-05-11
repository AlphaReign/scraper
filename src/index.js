#! /usr/local/bin/node

require('babel-register')({
	plugins: [
		'transform-class-properties',
		'transform-es2015-modules-commonjs',
		'transform-object-rest-spread',
	],
	presets: [[
		'env',
		{ targets: { node: 'current' } },
	]],
});

require('./run.js');
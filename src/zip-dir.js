'use strict';
const os = require('os'),
	fs = require('fs'),
	archiver = require('archiver'),
	path = require('path');
module.exports = function zipDir(directory) {
	const resultFile = path.join(os.tmpdir(), 'narakeet-api-' + Date.now() + '.zip'),
		output = fs.createWriteStream(resultFile),
		archive = archiver('zip');
	return new Promise((resolve, reject) => {
		archive.on('error', reject);
		output.on('close', () => resolve(resultFile));
		archive.pipe(output);
		archive.directory(directory, false);
		archive.finalize();
	});
};

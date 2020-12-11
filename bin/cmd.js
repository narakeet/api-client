#!/usr/bin/env node
'use strict';
const path = require('path'),
	fs = require('fs'),
	axios = require('axios'),
	AxiosRestApi = require('../src/axios-rest-api'),
	version = require(path.join(__dirname, '..', 'package.json')).version,
	minimist = require('minimist'),
	RequestProcessor = require('../src/request-processor'),
	readArgs = function () {
		return minimist(process.argv.slice(2), {
			alias: {
				h: 'help',
				v: 'version',
				'apiUrl': 'api-url',
				'repositoryType': 'repository-type',
				'token': 'github-token',
				'sha': 'github-sha',
				'resultFile': 'output',
				'apiKey': 'api-key'
			},
			string: ['api-key', 'repository', 'repository-type', 'github-token', 'github-sha', 'output', 'api-url'],
			boolean: ['verbose'],
			default: {
				'repository-type': 'zip-url',
			}
		});
	},
	main = async function () {
		const args = readArgs(),
			restApi = new AxiosRestApi(axios),
			requestProcessor = new RequestProcessor(restApi);

		if (args.version) {
			console.log(version);
			return;
		}
		if (args.help) {
			const usage = fs.readFileSync(path.join(__dirname, '..', 'README.txt'), 'utf8');
			console.log(usage);
			return;
		}
		try {
			await requestProcessor.run(args);
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
	};
main();

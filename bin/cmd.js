#!/usr/bin/env node
'use strict';
const DEFAULT_URL = 'https://api.narakeet.com',
	path = require('path'),
	fs = require('fs'),
	axios = require('axios'),
	AxiosRestApi = require('../src/axios-rest-api'),
	version = require(path.join(__dirname, '..', 'package.json')).version,
	minimist = require('minimist'),
	nullLogger = require('../src/null-logger'),
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
				'apiKey': 'api-key',
				'outputType': 'output-type'
			},
			string: ['api-key', 'repository', 'repository-type', 'github-token', 'github-sha', 'output', 'api-url', 'output-type', 'project-type', 'voice'],
			boolean: ['verbose'],
			default: {
				'repository-type': 'zip-url',
				'api-url': DEFAULT_URL,
				'project-type': 'video',
				'output-type': 'm4a'
			}
		});
	},

	main = async function () {
		const args = readArgs(),
			{verbose} = args,
			logger = verbose ? console : nullLogger,
			restApi = new AxiosRestApi(axios, logger),
			pollingInterval = 5000,
			requestProcessor = new RequestProcessor({restApi, logger, pollingInterval, apiEndpoint: args.apiUrl});
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
			if (typeof e === 'string') {
				console.error(e);
			} else {
				console.error(JSON.stringify(e));
			}
			process.exit(1);
		}
	};
main();

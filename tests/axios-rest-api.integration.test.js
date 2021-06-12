'use strict';
const os = require('os'),
	fs = require('fs'),
	path = require('path'),
	axios = require('axios'),
	nullLogger = require('../src/null-logger'),
	AxiosRestApi = require('../src/axios-rest-api');
describe('AxiosRestApi', () => {
	let restApi, apiEndpoint, apiKey;
	beforeEach(() => {
		const logger = process.env.DEBUG ?  console: nullLogger;
		jest.setTimeout(120000);
		restApi = new AxiosRestApi(axios, logger);
		apiEndpoint = process.env['API_URL'];
		apiKey = process.env['API_KEY'];
	});
	describe('payload size handling', () => {
		let payloadFile;
		beforeEach(() => {
			payloadFile = path.join(os.tmpdir(), Date.now() + '.zip');
		});
		afterEach(async () => {
			try {
				await fs.promises.unlink(payloadFile);
			} catch (e) { //eslint-disable-line no-empty
			}
		});
		[1, 10, 20, 30].forEach(megabytes => {
			test(`uploads payload of ${megabytes}`, async () => {
				await fs.promises.writeFile(payloadFile, new Array(megabytes * 1024 * 1024).fill('x').join(''), 'utf8');
				const uploadToken = await restApi.getJSON(apiEndpoint + '/video/upload-request/zip', {'x-api-key': apiKey}),
					result = await restApi.putFile(uploadToken.url, payloadFile, {'Content-Type': uploadToken.contentType});
				expect(result).toEqual('');
			});
		});
	});
});

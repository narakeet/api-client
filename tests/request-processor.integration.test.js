'use strict';
const axios = require('axios'),
	os = require('os'),
	fs = require('fs'),
	path = require('path'),
	AxiosRestApi = require('../src/axios-rest-api'),
	restApi = new AxiosRestApi(axios),
	RequestProcessor = require('../src/request-processor'),
	requestProcessor = new RequestProcessor(restApi);
describe('request processor integration tests', () => {
	let params, resultFile;
	beforeEach(() => {
		jest.setTimeout(120000);
		resultFile = path.join(os.tmpdir(), Date.now() + '.mp4');
		params = {
			apiUrl: process.env['API_URL'],
			apiKey: process.env['API_KEY'],
			source: process.env['SOURCE_PATH'],
			repository: process.env['GITHUB_REPOSITORY'],
			token: process.env['GITHUB_TOKEN'],
			sha: process.env['GITHUB_SHA'],
			resultFile,
			repositoryType: 'github'
		};
	});
	afterEach(() => {
		try {
			fs.unlinkSync(resultFile);
		} catch (e) {
			console.error('error cleaning up', resultFile);
		}
	});
	describe('video/build', () => {
		test('builds a video using GITHUB repository type', async () => {
			const result = await requestProcessor.run(params);
			expect(result.videoUrl).toBeTruthy();
			expect(result.videoFile).toEqual(resultFile);
			expect(fs.statSync(resultFile).size).toBeGreaterThan(600000);
		});
	});
});

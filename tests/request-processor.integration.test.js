'use strict';
const axios = require('axios'),
	os = require('os'),
	fs = require('fs'),
	path = require('path'),
	AxiosRestApi = require('../src/axios-rest-api'),
	zipDir = require('../src/zip-dir'),
	nullLogger = require('../src/null-logger'),
	RequestProcessor = require('../src/request-processor');
describe('request processor integration tests', () => {
	let resultFile, requestProcessor, restApi;
	beforeEach(() => {
		const logger = process.env.DEBUG ?  console: nullLogger;
		jest.setTimeout(120000);
		resultFile = path.join(os.tmpdir(), Date.now() + '.mp4');
		restApi = new AxiosRestApi(axios, logger);
		requestProcessor = new RequestProcessor({restApi, logger, pollingInterval: 1000, apiEndpoint: process.env['API_URL']});
	});
	afterEach(() => {
		try {
			fs.unlinkSync(resultFile);
		} catch (e) { //eslint-disable-line no-empty
		}
	});
	describe('video/build', () => {
		test('builds a video using GITHUB repository type', async () => {
			const params = {
					apiKey: process.env['API_KEY'],
					source: process.env['SOURCE_PATH'],
					repository: process.env['GITHUB_REPOSITORY'],
					token: process.env['GITHUB_TOKEN'],
					sha: process.env['GITHUB_SHA'],
					resultFile,
					repositoryType: 'github',
				},
				result = await requestProcessor.run(params);
			expect(result.videoUrl).toBeTruthy();
			expect(result.videoFile).toEqual(resultFile);
			expect(fs.statSync(resultFile).size).toBeGreaterThan(600000);
		});
		test('builds a video using zip repository type', async () => {
			const localZip = await zipDir(path.resolve(__dirname, 'example')),
				params = {
					apiUrl: process.env['API_URL'],
					apiKey: process.env['API_KEY'],
					source: 'video.txt',
					resultFile,
					repositoryType: 'local-zip',
					repository: localZip,
				},
				result = await requestProcessor.run(params);
			expect(result.videoUrl).toBeTruthy();
			expect(result.videoFile).toEqual(resultFile);
			expect(fs.statSync(resultFile).size).toBeGreaterThan(305000);
			fs.unlinkSync(localZip);
		});
		test('builds a video using local-dir repository type', async () => {
			const params = {
					apiUrl: process.env['API_URL'],
					apiKey: process.env['API_KEY'],
					source: 'video.txt',
					resultFile,
					repositoryType: 'local-dir',
					repository: path.resolve(__dirname, 'example'),
				},
				result = await requestProcessor.run(params);
			expect(result.videoUrl).toBeTruthy();
			expect(result.videoFile).toEqual(resultFile);
			expect(fs.statSync(resultFile).size).toBeGreaterThan(305000);
		});
		describe('returns reasonable errors back from the server', () => {
			test('for invalid api key', async () => {
				const params = {
					apiUrl: process.env['API_URL'],
					apiKey: 'invalid-key',
					source: process.env['SOURCE_PATH'],
					repository: process.env['GITHUB_REPOSITORY'],
					token: process.env['GITHUB_TOKEN'],
					sha: process.env['GITHUB_SHA'],
					resultFile,
					repositoryType: 'github'
				};
				await expect(requestProcessor.run(params)).rejects.toEqual('Forbidden');
			});
			test('for invalid URLs', async () => {
				const params = {
					apiKey: process.env['API_KEY'],
					source: process.env['SOURCE_PATH'],
					repository: 'invalid-url',
					resultFile,
					repositoryType: 'zip-url',
				};
				await expect(requestProcessor.run(params)).rejects.toEqual('Forbidden');
			});

		});

	});
});

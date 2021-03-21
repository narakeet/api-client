'use strict';
const RequestProcessor = require('../src/request-processor');
describe('RequestProcessor', () => {
	let restApi, logger, underTest, basicArgs;
	beforeEach(() => {
		restApi = {
			postJSON: jest.fn().mockResolvedValue(true),
			downloadToFile: jest.fn().mockResolvedValue(true),
			getJSON: jest.fn().mockResolvedValue({finished: true, succeeded: true, result: 'someresult'})
		};
		logger = {
			log: jest.fn(),
			error: jest.fn()
		};
		underTest = new RequestProcessor({restApi, logger, pollingInterval: 10, apiEndpoint: 'API_URL'});
		jest.setTimeout(200);
		basicArgs = {
			apiKey: 'API_KEY',
			source: 'SOURCE',
			repository: 'REPOSITORY',
			repositoryType: 'github',
			resultFile: 'RESULT_FILE'
		};
	});
	test('returns the result URL and file', async () => {
		const result = await underTest.run(basicArgs);
		expect(result).toEqual({videoUrl: 'someresult', videoFile: 'RESULT_FILE'});
	});
	describe('for GITHUB repository type', () => {
		test('requests the task using the API key', async () => {
			await underTest.run(Object.assign(basicArgs, {repositoryType: 'github', sha: 'SHA', token: 'TOKEN'}));
			expect(restApi.postJSON).toHaveBeenCalledWith(
				'API_URL/video/build',
				{
					'repository': 'REPOSITORY',
					'repositoryType': 'github',
					'sha': 'SHA',
					'source': 'SOURCE',
					'token': 'TOKEN',
				},
				{'x-api-key': 'API_KEY'}
			);
		});
	});
	describe('for zip-url repository type', () => {
		test('requests the task using the API key', async () => {
			await underTest.run(Object.assign(basicArgs, {repositoryType: 'zip-url'}));
			expect(restApi.postJSON).toHaveBeenCalledWith(
				'API_URL/video/build',
				{
					'repository': 'REPOSITORY',
					'repositoryType': 'zip-url',
					'source': 'SOURCE',
				},
				{'x-api-key': 'API_KEY'}
			);
		});
	});

	test('rejects without polling if the task request fails', async () => {
		restApi.postJSON.mockRejectedValue('boom!');
		await expect(underTest.run(basicArgs)).rejects.toEqual('boom!');
		expect(restApi.getJSON).not.toHaveBeenCalled();
	});
	test('polls for results until the task is finished', async () => {
		restApi.getJSON
			.mockResolvedValueOnce({finished: false})
			.mockResolvedValueOnce({finished: false})
			.mockResolvedValueOnce({finished: true, succeeded: true, result: 'someresult'});
		const result = await underTest.run(basicArgs);
		expect(result).toEqual({videoUrl: 'someresult', videoFile: 'RESULT_FILE'});
		expect(restApi.getJSON.mock.calls.length).toEqual(3);
	});

	describe('handling polling errors', () => {
		beforeEach(() => {
			let calls = 0;
			restApi.getJSON.mockImplementation(async () => {
				calls += 1;
				if (calls === 1) {
					return {finished: false};
				}
				if (calls === 2) {
					throw 'some error';
				}
				return {finished: true, succeeded: true, result: 'someresult'};
			});
		});
		test('survives intermittent errors', async () => {
			const result = await underTest.run(basicArgs);
			expect(result).toEqual({videoUrl: 'someresult', videoFile: 'RESULT_FILE'});
		});
		test('logs network errors', async () => {
			await underTest.run(Object.assign(basicArgs, {verbose: true}));
			expect(logger.error).toHaveBeenCalledWith('network request failed', 'some error');
		});
	});
	test('returns the task result if successful', async () => {
		restApi.getJSON.mockResolvedValue({finished: true, succeeded: true, result: 'someresult'});
		const result = await underTest.run(basicArgs);
		expect(result).toEqual({videoUrl: 'someresult', videoFile: 'RESULT_FILE'});

	});
	test('rejects with the task response message if not successful', async () => {
		restApi.getJSON.mockResolvedValue({finished: true, succeeded: false, message: 'oops!'});
		await expect(underTest.run(basicArgs)).rejects.toEqual('oops!');
	});
	test('rejects with the task response if not successful and no message', async () => {
		restApi.getJSON.mockResolvedValue({finished: true, succeeded: false, result: 'oops!'});
		await expect(underTest.run(basicArgs)).rejects.toMatchObject({message: JSON.stringify({finished: true, succeeded: false, result: 'oops!'})});
	});
});

'use strict';
const RequestProcessor = require('../src/request-processor'),
	path = require('path');
describe('RequestProcessor', () => {
	let restApi, logger, underTest, basicArgs;
	beforeEach(() => {
		restApi = {
			postJSON: jest.fn().mockResolvedValue(true),
			downloadToFile: jest.fn().mockResolvedValue(true),
			getJSON: jest.fn().mockResolvedValue({finished: true, succeeded: true, result: 'someresult'}),
			postText: jest.fn().mockResolvedValue(true)
		};
		logger = {
			log: jest.fn(),
			error: jest.fn()
		};
		underTest = new RequestProcessor({restApi, logger, pollingInterval: 10, apiEndpoint: 'API_URL'});
		jest.setTimeout(200);

	});
	describe('video builds', () => {
		beforeEach(() => {
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
		test('uses the video build when projectType=video', async () => {
			basicArgs.projectType = 'video';
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
	describe('audio builds', () => {
		beforeEach(() => {
			basicArgs = {
				script: 'my script 123',
				apiKey: 'API_KEY',
				outputType: 'wav',
				projectType: 'audio'
			};
		});
		test('returns the result URL and file', async () => {
			const result = await underTest.run(basicArgs);
			expect(result).toEqual({audioUrl: 'someresult', audioFile: 'someresult'});
		});
		test('uses specified result file', async () => {
			basicArgs.resultFile = 'RESULT_FILE';
			const result = await underTest.run(basicArgs);
			expect(result).toEqual({audioUrl: 'someresult', audioFile: 'RESULT_FILE'});
		});
		describe('for inline scripts', () => {
			test('requests the task using script contents and the API key', async () => {
				await underTest.run(basicArgs);
				expect(restApi.postText).toHaveBeenCalledWith(
					'API_URL/text-to-speech/wav',
					'my script 123',
					{'x-api-key': 'API_KEY'}
				);
			});
			test('posts to m4a when requested', async () => {
				await underTest.run(Object.assign(basicArgs, {outputType: 'm4a'}));
				expect(restApi.postText).toHaveBeenCalledWith(
					'API_URL/text-to-speech/m4a',
					'my script 123',
					{'x-api-key': 'API_KEY'}
				);
			});
			test('adds voice to request url', async () => {
				await underTest.run(Object.assign(basicArgs, {outputType: 'm4a', voice: 'mickey'}));
				expect(restApi.postText).toHaveBeenCalledWith(
					'API_URL/text-to-speech/m4a?voice=mickey',
					'my script 123',
					{'x-api-key': 'API_KEY'}
				);
			});


		});
		describe('for scripts as filenames', () => {
			test('loads the file contentd then posts the text', async () => {
				delete basicArgs.script;
				await underTest.run(Object.assign(basicArgs, {scriptFile: path.resolve(__dirname, 'example', 'audio.txt')}));
				expect(restApi.postText).toHaveBeenCalledWith(
					'API_URL/text-to-speech/wav',
					'script from file\n',
					{'x-api-key': 'API_KEY'}
				);
			});
		});
		test('rejects without polling if the task request fails', async () => {
			restApi.postText.mockRejectedValue('boom!');
			await expect(underTest.run(basicArgs)).rejects.toEqual('boom!');
			expect(restApi.getJSON).not.toHaveBeenCalled();
		});
		test('polls for results until the task is finished', async () => {
			restApi.getJSON
				.mockResolvedValueOnce({finished: false})
				.mockResolvedValueOnce({finished: false})
				.mockResolvedValueOnce({finished: true, succeeded: true, result: 'someresult'});
			const result = await underTest.run(Object.assign(basicArgs, {resultFile: 'RESULT_FILE'}));
			expect(result).toEqual({audioUrl: 'someresult', audioFile: 'RESULT_FILE'});
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
				const result = await underTest.run(Object.assign(basicArgs, {resultFile: 'RESULT_FILE'}));
				expect(result).toEqual({audioUrl: 'someresult', audioFile: 'RESULT_FILE'});
			});
			test('logs network errors', async () => {
				await underTest.run(Object.assign(basicArgs, {verbose: true}));
				expect(logger.error).toHaveBeenCalledWith('network request failed', 'some error');
			});
		});
		test('returns the task result if successful', async () => {
			restApi.getJSON.mockResolvedValue({finished: true, succeeded: true, result: 'someresult'});
			const result = await underTest.run(Object.assign(basicArgs, {resultFile: 'RESULT_FILE'}));
			expect(result).toEqual({audioUrl: 'someresult', audioFile: 'RESULT_FILE'});

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
});

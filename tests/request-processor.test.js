'use strict';
const RequestProcessor = require('../src/request-processor');
describe('RequestProcessor', () => {
	let restApi, taskLogger, underTest;
	beforeEach(() => {
		restApi = {
			postJSON: jest.fn().mockResolvedValue(true),
			downloadToFile: jest.fn().mockResolvedValue(true),
			getJSON: jest.fn().mockResolvedValue({finished: true, succeeded: true, result: 'someresult'})
		};
		taskLogger = {
			log: jest.fn(t => console.log(t))
		};
		underTest = new RequestProcessor(restApi, taskLogger, 10);
		jest.setTimeout(200);
	});
	test('returns the result URL and file', async () => {
		const result = await underTest.run({
			apiUrl: 'API_URL',
			apiKey: 'API_KEY',
			source: 'SOURCE',
			repository: 'REPOSITORY',
			repositoryType: 'REPOSITORY_TYPE',
			token: 'TOKEN',
			sha: 'SHA',
			resultFile: 'RESULT_FILE',
			verbose: false
		});
		expect(result).toEqual({videoUrl: 'someresult', videoFile: 'RESULT_FILE'});
	});
	test('requests the task using the API key', async () => {
		await underTest.run({
			apiUrl: 'API_URL',
			apiKey: 'API_KEY',
			source: 'SOURCE',
			repository: 'REPOSITORY',
			repositoryType: 'REPOSITORY_TYPE',
			token: 'TOKEN',
			sha: 'SHA',
			resultFile: 'RESULT_FILE',
			verbose: false
		});
		expect(restApi.postJSON).toHaveBeenCalledWith(
			'API_URL',
			{
				'repository': 'REPOSITORY',
				'repositoryType': 'REPOSITORY_TYPE',
				'sha': 'SHA',
				'source': 'SOURCE',
				'token': 'TOKEN',
			},
			{'x-api-key': 'API_KEY'}
		);
	});

});

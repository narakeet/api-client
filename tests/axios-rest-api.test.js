'use strict';
const AxiosRestApi = require('../src/axios-rest-api');
describe('AxiosRestApi', () => {
	let axios, underTest, logger;
	beforeEach(() => {
		axios = {
			post: jest.fn()
		};
		logger = {
			error: jest.fn()
		};
		underTest = new AxiosRestApi(axios, logger);
		axios.post.mockResolvedValue({data: 'response-text'});
	});
	describe('postText', () => {
		test('uses underlying axios post to send information with text/plain content type', async () => {
			const result = await underTest.postText('/url/', 'body-contents');
			expect(axios.post).toHaveBeenCalledWith('/url/', 'body-contents', {'headers': {'content-type': 'text/plain'}});
			expect(result).toEqual('response-text');
		});
		test('appends additional headers if requested', async () => {
			const result = await underTest.postText('/url/', 'body-contents', {'x-api-key': 'api-1234'});
			expect(axios.post).toHaveBeenCalledWith('/url/', 'body-contents', {'headers': {'content-type': 'text/plain', 'x-api-key': 'api-1234'}});
			expect(result).toEqual('response-text');
		});
	});
});

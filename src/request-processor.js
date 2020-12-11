'use strict';
const pause = require('./pause'),
	path = require('path'),
	url = require('url'),
	POLLING_INTERVAL = 5000,
	DEFAULT_URL = 'https://api.narakeet.com/video/build';
module.exports = function RequestProcessor (restApi) {
	const self = this,
		startTask = async function (apiUrl, apiKey, event, logger) {
			try {
				const result = await restApi.postJSON(
					apiUrl,
					event,
					{
						'x-api-key': apiKey
					}
				);
				if (logger) {
					logger.log('got task id', result.taskId);
					logger.log('got status URL', result.statusUrl);
				}
				return result;
			} catch (e) {
				if (e.error) {
					throw new Error(e.error);
				}
				throw e;
			}
		},
		pollForFinished = async function (statusUrl, interval, logger) {
			try {
				await pause(interval);
				const result = await restApi.getJSON(statusUrl);
				if (logger) {
					logger.log(result);
				}
				if (result && result.finished) {
					return result;
				} else {
					return pollForFinished(statusUrl, interval);
				}
			} catch (e) {
				console.error('network request failed', e);
				return pollForFinished(statusUrl, interval);
			}
		},
		saveResults = async function (task, taskResponse, resultFile, logger) {
			const videoUrl = taskResponse.result,
				remoteName = path.basename(url.parse(videoUrl).pathname),
				filename = resultFile || remoteName;
			if (logger) {
				logger.log('downloading from', taskResponse.result, 'to', filename);
			}
			await restApi.downloadToFile(taskResponse.result, filename);
			return {
				videoUrl: taskResponse.result,
				videoFile: filename
			};
		};
	self.run = async function ({apiUrl, apiKey, source, repository, repositoryType, token, sha, resultFile, verbose}) {
		const event = {
				source,
				repository,
				token,
				repositoryType,
				sha
			},
			api = apiUrl || DEFAULT_URL,
			logger = verbose && console,
			task = await startTask(api, apiKey, event, logger),
			taskResponse = await pollForFinished(task.statusUrl, POLLING_INTERVAL, logger);
		if (taskResponse.succeeded) {
			return await saveResults(task, taskResponse, resultFile, logger);
		} else {
			throw new Error(JSON.stringify(taskResponse));
		}
	};

};

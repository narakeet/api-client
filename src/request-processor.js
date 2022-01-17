'use strict';
const pause = require('./pause'),
	path = require('path'),
	url = require('url'),
	zipDir = require('../src/zip-dir'),
	fs = require('fs');
module.exports = function RequestProcessor ({restApi, logger, pollingInterval, apiEndpoint}) {
	if (!restApi || !logger || !pollingInterval || !apiEndpoint) {
		throw new Error('invalid-args');
	}
	const startVideoTask = async function (apiKey, event) {
			const result = await restApi.postJSON(
				apiEndpoint + '/video/build',
				event,
				{
					'x-api-key': apiKey
				}
			);
			logger.log('got task id', result.taskId);
			logger.log('got status URL', result.statusUrl);
			return result;
		},
		startAudioTask = async function (apiKey, source, endpoint) {
			const result = await restApi.postText(
				apiEndpoint + '/text-to-speech/' + endpoint,
				source,
				{
					'x-api-key': apiKey
				}
			);
			logger.log('got task id', result.taskId);
			logger.log('got status URL', result.statusUrl);
			return result;
		},
		pollForFinished = async function (statusUrl, interval) {
			try {
				await pause(interval);
				const result = await restApi.getJSON(statusUrl);
				logger.log(result);
				if (result && result.finished) {
					return result;
				} else {
					return pollForFinished(statusUrl, interval);
				}
			} catch (e) {
				logger.error('network request failed', e);
				return pollForFinished(statusUrl, interval);
			}
		},
		saveResults = async function (task, taskResponse, resultFile) {
			const videoUrl = taskResponse.result,
				remoteName = path.basename(url.parse(videoUrl).pathname),
				filename = resultFile || remoteName;
			logger.log('downloading from', taskResponse.result, 'to', filename);
			await restApi.downloadToFile(taskResponse.result, filename);
			return {
				result: taskResponse.result,
				filename
			};
		},
		getRequestForLocalZip = async ({apiKey, source, repository}) => {
			logger.log('getting upload token', {apiKey});
			const uploadToken = await restApi.getJSON(apiEndpoint + '/video/upload-request/zip', {'x-api-key': apiKey});
			logger.log('received upload token', uploadToken);
			logger.log('uploading file');
			await restApi.putFile(uploadToken.url, repository, {'Content-Type': uploadToken.contentType});
			return {
				repositoryType: uploadToken.repositoryType,
				repository: uploadToken.repository,
				source
			};
		},
		getCompilationRequest = async function ({source, repository, token, repositoryType, sha, apiKey}) {
			if (repositoryType === 'github') {
				return {source, repository, repositoryType, token, sha};
			} else if (repositoryType === 'zip-url') {
				return {source, repository, repositoryType};
			} else if (repositoryType === 'local-zip') {
				return getRequestForLocalZip({apiKey, source, repository});
			} else if (repositoryType === 'local-dir') {
				const localZip = await zipDir(repository),
					request = await getRequestForLocalZip({apiKey, source, repository: localZip});
				await fs.promises.unlink(localZip);
				return request;
			} else {
				throw `unsupported repository type ${repositoryType}`;
			}
		},
		runVideo = async function ({apiKey, source, repository, repositoryType, token, sha, resultFile}) {
			logger.log('executing', {
				apiEndpoint, apiKey, source, repository, repositoryType, token, sha, resultFile
			});
			const event = await getCompilationRequest({
					source,
					repository,
					token,
					repositoryType,
					sha,
					apiKey
				}),
				task = await startVideoTask(apiKey, event, ),
				taskResponse = await pollForFinished(task.statusUrl, pollingInterval);
			if (taskResponse.succeeded) {
				const outcome = await saveResults(task, taskResponse, resultFile);
				return {
					videoUrl: outcome.result,
					videoFile: outcome.filename
				};

			} else {
				if (taskResponse.message) {
					throw taskResponse.message;
				}
				throw new Error(JSON.stringify(taskResponse));
			}
		},
		runAudio = async function ({apiKey, script, scriptFile, voice, outputType, resultFile}) {
			logger.log('executing', {
				apiKey, script, scriptFile, outputType, resultFile
			});
			if (script && scriptFile) {
				throw `cannot use both script and script-file options at the same time`;
			}
			if (!script && !scriptFile) {
				throw `please specify either script or script-file must`;
			}
			if (!['wav', 'mp3', 'm4a'].includes(outputType)) {
				throw `unsupported output type ${outputType}`;
			}
			const source = script || await fs.promises.readFile(scriptFile, 'utf8'),
				endpoint = voice ? `${outputType}?voice=${voice}` : outputType,
				task = await startAudioTask(apiKey, source, endpoint),
				taskResponse = await pollForFinished(task.statusUrl, pollingInterval);
			if (taskResponse.succeeded) {
				const outcome = await saveResults(task, taskResponse, resultFile);
				return {
					audioUrl: outcome.result,
					audioFile: outcome.filename
				};
			} else {
				if (taskResponse.message) {
					throw taskResponse.message;
				}
				throw new Error(JSON.stringify(taskResponse));
			}
		},
		projectTypeRunners = {
			video: runVideo,
			audio: runAudio
		},
		run = async function(args = {}) {
			const projectType = args.projectType || 'video',
				runner = projectTypeRunners[projectType];
			if (!runner) {
				throw `unsupported project type ${projectType}`;
			}
			return await runner(args);
		};

	Object.freeze(Object.assign(this, {run}));

};

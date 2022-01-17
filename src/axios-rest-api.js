'use strict';
const fs = require('fs');
module.exports = function AxiosRestApi(axios, logger) {
	const extractResponseError = (error) => {
			if (error.response) {
				logger.error(error.response);
				if (typeof error.response.data === 'string') {
					throw error.response.data;
				}
				if (typeof error.response.data === 'object' && typeof error.response.data.error === 'string') {
					throw error.response.data.error;
				}
				if (typeof error.response.data === 'object' && typeof error.response.data.message === 'string') {
					throw error.response.data.message;
				}
				throw JSON.stringify(error.response.data);
			}
			logger.error(error);
			throw error;
		},
		sendFile = async function (url, filePath, additionalHeaders, operation) {
			try {
				const stat = await fs.promises.stat(filePath),
					headers = Object.assign({'Content-Length': stat.size}, additionalHeaders),
					maxBodyLength = stat.size + 2000,
					response = await axios[operation](url, fs.createReadStream(filePath), {headers, maxBodyLength});
				return response.data;
			} catch (error) {
				throw extractResponseError(error);
			}
		},
		downloadToFile = async function (fileUrl, filePath) {
			const writer = fs.createWriteStream(filePath),
				response = await axios({
					method: 'get',
					url: fileUrl,
					responseType: 'stream'
				});
			response.data.pipe(writer);
			return new Promise((resolve, reject) => {
				writer.on('finish', resolve);
				writer.on('error', reject);
			});
		},
		postJSON = async function (url, data, headers) {
			try {
				const response = await axios.post(url, data, {headers});
				return response.data;
			} catch (error) {
				throw extractResponseError(error);
			}
		},
		postText = async function (url, data, additionalHeaders) {
			const headers = Object.assign({'content-type': 'text/plain'}, additionalHeaders);
			try {
				const response = await axios.post(url, data, {headers});
				return response.data;
			} catch (error) {
				throw extractResponseError(error);
			}
		},
		putFile = function (url, filePath, additionalHeaders) {
			return sendFile(url, filePath, additionalHeaders, 'put');
		},
		getJSON = async function (url, headers) {
			try {
				const response = await axios.get(url, {headers});
				return response.data;
			} catch (error) {
				throw extractResponseError(error);
			}
		};
	Object.freeze(Object.assign(this, {downloadToFile, postJSON, putFile, postText, getJSON}));
};

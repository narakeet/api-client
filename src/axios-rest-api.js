'use strict';
const fs = require('fs');
module.exports = function AxiosRestApi(axios, logger) {
	const self = this,
		extractResponseError = (error) => {
			if (error.response) {
				logger.error(error.response);
				if (typeof error.response.data === 'string') {
					throw error.response.data;
				}
				if (typeof error.response.data === 'object' && typeof error.response.data.message === 'string') {
					throw error.response.data.message;
				}
				throw JSON.stringify(error.response.data);
			}
			logger.error(error);
			throw error;
		};

	self.downloadToFile = async function (fileUrl, filePath) {
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
	};
	self.postJSON = async function (url, data, headers) {
		try {
			const response = await axios.post(url, data, {headers});
			return response.data;
		} catch (error) {
			throw extractResponseError(error);
		}
	};
	self.putFile = async function (url, filePath, additionalHeaders) {
		try {
			const stat = await fs.promises.stat(filePath),
				headers = Object.assign({'Content-Length': stat.size}, additionalHeaders),
				response = await axios.put(url, fs.createReadStream(filePath), {headers});
			return response.data;
		} catch (error) {
			throw extractResponseError(error);
		}
	};
	self.getJSON = async function (url, headers) {
		try {
			const response = await axios.get(url, {headers});
			return response.data;
		} catch (error) {
			throw extractResponseError(error);
		}
	};
};

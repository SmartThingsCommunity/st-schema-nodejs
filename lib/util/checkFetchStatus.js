'use strict';

class FetchError {
	constructor(res) {
		this.statusCode = res.status;
		this.message = `${res.status} - ${res.statusText}`
	}

	toString() {
		return this.message
	}
}

module.exports = function(res) {
	if (res.ok) {
		return res
	}
	throw new FetchError(res)
}

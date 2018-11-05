/**
 *	Copyright 2018 SmartThings
 *
 *	Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *	in compliance with the License. You may obtain a copy of the License at:
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 *	Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *	on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *	for the specific language governing permissions and limitations under the License.
 *
 */

 "use strict";

module.exports = {
  response(statusCode, payload = {}) {
    let response = {
      statusCode: statusCode,
      body: JSON.stringify(payload)
    };
    return Promise.resolve(response);
  },
  error(requestId, statusCode = 500, code = "InternalServiceError", message) {
    let response = {
      statusCode: statusCode,
      body: JSON.stringify({
        requestId: requestId,
        error: {
          code: code,
          message: message
        }
      })
    };
    return Promise.resolve(response);
  },
  badParamError(badParam, requestId) {
    const responseMessage = `Path or query parameter '${badParam}' is missing or empty`;
    return this.badRequest(requestId, responseMessage);
  },
  badRequest(requestId, message) {
    return this.error(
        requestId,
        400,
        "Bad Request",
        message
    );
  }
};

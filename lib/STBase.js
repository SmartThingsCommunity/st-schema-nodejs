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

/**
 * @typedef {Object} STBase
 * @property {string} interactionType
 * @property {string} requestId
 */

const schema = "st-schema";
const version = "1.0";

/**
 * Base class for a ST schema response.
 * @class STBase
 */
class STBase {
  /**
   * Create a STBase
   * @param {string} interactionType
   * @param {string} requestId
   */
  constructor(interactionType, requestId) {
    this.headers = {
      schema,
      version,
      interactionType,
      requestId
    };
  }

  /**
   * set error
   * @param {string} detail
   * @param {string} errorEnum
   */
  setError(detail, errorEnum = "UNKNOWN-ERROR") {
    this.globalError = {
      detail,
      errorEnum
    };
    return this;
  }

  /**
   * has globalError or not
   * @return {boolean}
   */
  isError() {
    return this.hasOwnProperty("globalError");
  }
}

module.exports = STBase;

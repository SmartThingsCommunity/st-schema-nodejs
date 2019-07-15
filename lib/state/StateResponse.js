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
 * @typedef {Object} StateResponse
 * @property {string} interactionType
 * @property {string} requestId
 * @property {Array} deviceState
 */

const STBase = require('../STBase');
const Device = require('./StateDevice');

const deviceMap = Symbol('private');

/** Class representing a state response in ST schema.
 * @class StateResponse
 * @extends STBase
 */
class StateResponse extends STBase {
  /**
   * Create a state response.
   * @param {string} interactionType
   * @param {string} requestId
   */
  constructor(interactionType, requestId) {
    super(interactionType, requestId);
    // Lookup map for fast lookup when adding device state
    this[deviceMap] = new Map();
  }

  /**
   * Add a device ID to the state response
   * @param {string} externalDeviceId
   * @returns {StateDevice}
   */
  addDevice(externalDeviceId, states) {
    if (! this.deviceState) {
      this.deviceState = [];
    }
    const device = new Device(externalDeviceId);
    this.deviceState.push(device);

    if (states) {
      for (const state of states) {
        device.addState(state)
      }
    }
    return device;
  }
}

module.exports = StateResponse;

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
 * @typedef {Object} DiscoveryResponse
 * @property {string} interactionType
 * @property {string} requestId
 * @property {DiscoveryDevice[]} devices
 */

const STBase = require("../STBase");
const Device = require('./DiscoveryDevice');

/**
 * Class representing a discovery response in ST schema
 * @class DiscoveryResponse
 * @extends STBase
 */
class DiscoveryResponse extends STBase {
  /**
   * Create a discovery response
   * @param {string} requestId
   */
  constructor(requestId) {
    super("discoveryResponse", requestId);
  }

  /**
   * Add a device to discovery response
   * @param {string} id
   * @param {string} friendlyName
   * @param {string} deviceType
   * @returns {DiscoveryDevice}
   */
  addDevice(id, friendlyName, deviceHandlerType) {
    if (! this.devices) {
      this.devices = [];
    }
    const device = new Device(id, friendlyName, deviceHandlerType);
    this.devices.push(device);
    return device;
  }
}

module.exports = DiscoveryResponse;

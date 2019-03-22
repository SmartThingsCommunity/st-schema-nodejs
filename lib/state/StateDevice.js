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

'use strict';

/**
 * @typedef {Object} Device
 * @property {string} externalDeviceId
 * @property {string} requestId
 * @property {Array} states
 */

/**
 * Class representing a device
 * @class Device
 */
class Device {
  /**
   * Create a device
   * @param {string} externalDeviceId
   */
  constructor(externalDeviceId) {
    this.externalDeviceId = externalDeviceId;
  }

  /**
   * Add a component to the device
   * @param {string} componentName
   * @returns {Object}
   */
  addComponent(componentName) {
    return {
      addState: this.addState.bind(this, componentName)
    }
  }

	/**
   * Add a state to the device
   * @param {string} component
   * @param {string} capability
   * @param {string} attribute
   * @param {mixed} value
   * @returns {Object}
   */
  addState(component, capability, attribute, value, unit) {
    if (! this.states) {
      this.states = [];
    }
    const state = {
      component,
      capability,
      attribute,
      value,
      unit
    };
    this.states.push(state);
    return Object.seal(state);
  }
}

module.exports = Device;

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
   * Adds a cookie to the device. Cookies can contain any information usefull to the integration
   * @param {Object} cookie
   * @returns {Device}
   */
  addCookie(cookie) {
    this.cookie = cookie;
    return this;
  }

  /**
   * Add a state to the device
   * @param {string} componentOrMap
   * @param {string} capability
   * @param {string} attribute
   * @param {mixed} value
   * @param {string} unit
   * @param {object} data
   * @returns {Object}
   */
  addState(component, capability, attribute, value, unit, data) {
    if (! this.states) {
      this.states = [];
    }
    let state;
    if (typeof component === 'object') {
      state = component
    }
    else {
      state = {
        component,
        capability,
        attribute,
        value,
        unit,
        data
      }
    }
    this.states.push(state);
    return Object.seal(state);
  }

  setError(detail, errorEnum = "UNKNOWN-ERROR") {
    if (!this.deviceError) {
      this.deviceError = [];
    }
    this.deviceError.push({errorEnum, detail});
    return this;
  }
}

module.exports = Device;

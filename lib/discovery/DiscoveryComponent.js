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
 * @typedef {Object} Component
 * @property {string} capabilities
 * @property {Object} properties
 */

/**
 * Class representing a component in ST schmea
 * @class Component
 */
class Component {
  /**
   * Create a component
   */
  constructor() {
    this.capabilities = undefined;
    this.properties = undefined;
  }

  /**
   * Add a new property to the component
   * @param {string} capability
   * @param {string} attribute
   * @param {string} type
   * @param {number} minimum
   * @param {number} maximum
   * @param {string=} units
   */
  addProperty(capability, attribute, type, minimum, maximum, units) {
    if (! this.capabilities) {
      this.capabilities = [];
    }
    this.capabilities.push(capability);
    if (! type) {
      // No property for this capabilty
      return;
    }

    if (! this.properties) {
      this.properties = {};
    }

    const property = {
      type,
      units,
      minimum,
      maximum
    };

    this.properties[capability] = {};
    this.properties[capability][attribute] = property;

    // prevent adding new property, but allow changing existing property
    return Object.seal(property);
  }
}

module.exports = Component;

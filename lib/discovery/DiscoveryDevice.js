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

const Component = require('./DiscoveryComponent');

/**
 * @typedef {Object} Device
 * @property {string} externalDeviceId
 * @property {string} friendlyName
 * @property {string} deviceHandlerType
 * @property {Object} manufacturerInfo
 * @property {string} manufacturerInfo.manufacturerName
 * @property {string} manufacturerInfo.modelName
 * @property {string} manufacturerInfo.hwVersion
 * @property {string} manufacturerInfo.swVersion
 * @property {Object} deviceContext
 * @property {string} deviceContext.roomName
 * @property {string[]} deviceContext.groups
 * @property {string[]} deviceContext.categories
 * @property {Object} components
 */

const setProperty = Symbol("private");

/**
 * Class representing a device in ST schema
 * @class Device
 */
class Device {
  /**
   * Create a device
   * @param {string} id
   * @param {string} friendlyName
   * @param {string} deviceHandlerType
   */
  constructor(id, friendlyName, deviceHandlerType) {
    this.externalDeviceId = id;
    this.friendlyName = friendlyName;
    this.deviceHandlerType = deviceHandlerType;
  }

  /**
   * Set/create a new property that includes given key and value
   * @param {string} propertyName
   * @param {string} key
   * @param {string} value
   * @returns {Device}
   */
  [setProperty](propertyName, key, value) {
    if (! this[propertyName]) {
      this[propertyName] = {};
    }
    this[propertyName][key] = value;
    return this;
  }

  /**
   * Set manufacturer name of the device
   * @param {string} name
   * @returns {Device}
   */
  manufacturerName(name) {
    return this[setProperty]("manufacturerInfo", "manufacturerName", name);
  }

  /**
   * Set model name of the device
   * @param {string} name
   * @returns {Device}
   */
  modelName(name) {
    return this[setProperty]("manufacturerInfo", "modelName", name);
  }

  /**
   * Set hardware version of the device
   * @param {string} version
   * @returns {Device}
   */
  hwVersion(version) {
    return this[setProperty]("manufacturerInfo", "hwVersion", version);
  }

  /**
   * Set software version of the device
   * @param {string} version
   * @returns {Device}
   */
  swVersion(version) {
    return this[setProperty]("manufacturerInfo", "swVersion", version);
  }

  /**
   * Set room name of the device
   * @param {string} name
   * @returns {Device}
   */
  roomName(name) {
    return this[setProperty]("deviceContext", "roomName", name);
  }

  /**
   * Add a group to the device
   * @param {string} groupName
   * @returns {string}
   */
  addGroup(groupName) {
    const propertyName = "deviceContext";
    const key = "groups";
    this[setProperty](propertyName, key, []);
    this[propertyName][key].push(groupName);
    return groupName;
  }

  /**
   * Add a category to the device
   * @param {string} categoryName
   * @returns {string}
   */
  addCategory(categoryName) {
    const propertyName = "deviceContext";
    const key = "categories";
    this[setProperty](propertyName, key, []);
    this[propertyName][key].push(categoryName);
    return categoryName;
  }

  /**
   * Add a component to the device
   * @param {string} key
   * @returns {DiscoveryComponent}
   */
  addComponent(key) {
    const propertyName = "components";
    const component = new Component();
    this[setProperty](propertyName, key, component);
    return component;
  }
}

module.exports = Device;

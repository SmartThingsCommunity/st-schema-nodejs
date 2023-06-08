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

const fetch = require('node-fetch');
const checkFetchStatus = require('./util/checkFetchStatus');
const camelCase = require('camelcase');

function Library(options, capabilityMapping) {
    this.baseUrl = options.baseUrl;
    this.discoveryRequest = options.discoveryRequest;
    this.headers = options.headers;
    this.stateRefreshRequest = options.stateRefreshRequest;
    this.commandRequest = options.commandRequest;
    this.capabilityMapping = capabilityMapping;
};

Library.prototype.requestBuilder = function (requestType, bearerToken, body = null, xoptions = null) {
    const defaultHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': "Bearer " + bearerToken
    }
    var options = {
        method: this[requestType].method,
        headers: defaultHeaders,
        body: body
    }
    let uri = this.baseUrl + this[requestType].uri;

    if (this.headers !== null) {
        options.headers = Object.assign(defaultHeaders, this.headers);
    }

    // if the configuration header needs to be overwritten with dynamic values
    // or when the token needs to be passed in a different format
    if (xoptions.headers) {
        options.headers = Object.assign(options.headers, xoptions.headers);
    }

    //xoptions uri is useful if clientId or token needs to be passed in the url for some partners
    if (xoptions.uri) {
        uri = this.baseUrl + xoptions.uri;
    }

    if (xoptions.debug) {
        console.log("CALL TO Partner %j", options);
    }

    return fetch(uri, options)
      .then(checkFetchStatus)
      .then(res => {
        if (xoptions.debug) {
            console.log("body from Partner %j", res.body);
        }
        return res.json();
      });
}

Library.prototype.mapPartnerToSTCapability = function (device, result) {
    for (let partnerCapability in this.capabilityMapping.partnerToSTCapabilityMapping) {
        let stCapabilityMap = this.capabilityMapping.partnerToSTCapabilityMapping[partnerCapability]
        if (stCapabilityMap) {
            if (partnerCapability === "color") {
                for (let colorType in stCapabilityMap) {
                    let component = device.addComponent("main");
                    component.addState(stCapabilityMap[colorType].capability, stCapabilityMap[colorType].attribute, result[partnerCapability][colorType] * stCapabilityMap[colorType].valueMultiplier);
                }
            } else {
                let component = device.addComponent("main");
                let value;
                if (stCapabilityMap.valueMultiplier) {
                    value = result[partnerCapability] * stCapabilityMap.valueMultiplier;
                } else if (stCapabilityMap.valueMap) {
                    value = stCapabilityMap.valueMap[result[partnerCapability].toString()]
                } else {
                    value = result[partnerCapability]
                }
                if (value) {
                    component.addState(stCapabilityMap.capability, stCapabilityMap.attribute, value);
                }
            }
        }
    }
}

Library.prototype.mapSTCommandsToState = function (device, commands) {
    for (let command of commands) {
        if (command.capability === "st.colorControl") {
            let component = device.addComponent(command.component);
            component.addState("st.colorControl", "hue", command.arguments[0].hue);
            component = device.addComponent(command.component);
            component.addState("st.colorControl", "saturation", command.arguments[0].saturation);
        } else if (command.capability === "st.switch" || command.capability === "st.siren") {
            const component = device.addComponent(command.component);
            component.addState(command.capability, command.capability.replace(/^st\./, ''), command.command);
        } else if (command.capability === "st.lock") {
            const component = device.addComponent(command.component);
            component.addState("st.lock", "lock", command.command + "ed");
        } else if (command.capability === "st.valve" || command.capability === "st.windowShade") {
            const component = device.addComponent(command.component);
            if (command.command === "close") {
                component.addState(command.capability, command.capability.replace(/^st\./, ''), command.command + "d");
            } else {
                component.addState(command.capability, command.capability.replace(/^st\./, ''), command.command);
            }
        } else {
            const component = device.addComponent(command.component);
            component.addState(command.capability, camelCase(command.command.replace(/^set/, '')), command.arguments[0]);
        }
    }
}

module.exports = Library;
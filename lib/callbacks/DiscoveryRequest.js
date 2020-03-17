'use strict';

/**
 * @typedef {Object} DiscoveryRequest
 * @property {string} clientId
 * @property {string} clientSecret
 */

const fetch = require('node-fetch');
const checkFetchStatus = require('../util/checkFetchStatus');
const STBase = require("../STBase");
const uuid = require('uuid/v4');
const RefreshTokenRequest = require('./RefreshTokenRequest');
const doSendDiscovery = Symbol("private");

module.exports = class DiscoveryRequest extends STBase {

  constructor(clientId, clientSecret) {
    super('discoveryCallback', uuid());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Add a device to discovery response
   * @param {DiscoveryDevice} device
   * @returns {DiscoveryDevice}
   */
  addDevice(device) {
    if (! this.devices) {
      this.devices = [];
    }
    this.devices.push(device);
    return device;
  }

  sendDiscovery(callbackUrls, callbackAuth, refreshedCallback) {

    return this[doSendDiscovery](callbackUrls.stateCallback, callbackAuth.accessToken).then(res => {
      if (res.status === 401 && refreshedCallback) {

        return new RefreshTokenRequest(this.clientId, this.clientSecret).getCallbackToken(
          callbackUrls.oauthToken,
          callbackAuth.refreshToken
        ).then(refreshResponse => {
          refreshedCallback(refreshResponse.callbackAuthentication);

          return this[doSendDiscovery](callbackUrls.stateCallback, refreshResponse.callbackAuthentication.accessToken)
            .then(checkFetchStatus)
        })
      }

      return checkFetchStatus(res)
    })
  }

  [doSendDiscovery](callbackUrl, callbackAccessToken) {
    const body = {
      headers: this.headers,
      authentication: {
        "tokenType": "Bearer",
        "token": callbackAccessToken
      },
      devices: this.devices
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    };

    return fetch(callbackUrl, options)
  }

};

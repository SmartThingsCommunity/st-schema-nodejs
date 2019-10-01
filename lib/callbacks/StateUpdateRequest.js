'use strict';

const fetch = require('node-fetch');
const checkFetchStatus = require('../util/checkFetchStatus');
const STBase = require("../STBase");
const uuid = require('uuid/v4');
const RefreshTokenRequest = require('./RefreshTokenRequest');
const doUpdateState = Symbol("private");

module.exports = class StateUpdateRequest extends STBase {

  constructor(clientId, clientSecret) {
    super('stateCallback', uuid());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  updateState(callbackUrls, callbackAuth, deviceState, refreshedCallback) {

    return this[doUpdateState](callbackUrls.stateCallback, callbackAuth.accessToken, deviceState).then(res => {
      if (res.status === 401 && refreshedCallback) {

        return new RefreshTokenRequest(this.clientId, this.clientSecret).getCallbackToken(
            callbackUrls.oauthToken,
            callbackAuth.refreshToken
        ).then(refreshResponse => {
          refreshedCallback(refreshResponse.callbackAuthentication);

          return this[doUpdateState](callbackUrls.stateCallback, refreshResponse.callbackAuthentication.accessToken, deviceState)
              .then(checkFetchStatus)
        })
      }

      return checkFetchStatus(res)
    })
  }

  [doUpdateState](callbackUrl, callbackAccessToken, deviceState) {
    const body = {
      headers: this.headers,
      authentication: {
        "tokenType": "Bearer",
        "token": callbackAccessToken
      },
      deviceState: deviceState
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

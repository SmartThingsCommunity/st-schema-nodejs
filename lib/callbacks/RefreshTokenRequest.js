'use strict';

const rp = require('request-promise-native');
const STBase = require("../STBase");
const uuid = require('uuid/v4');

module.exports = class RefreshTokenRequest extends STBase {

  constructor(clientId, clientSecret) {
    super('refreshAccessTokens', uuid());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getCallbackToken(url, refreshToken) {
    const options = {
      url: url,
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: {
        headers: this.headers,
        callbackAuthentication: {
          grantType: "refresh_token",
          refreshToken: refreshToken,
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }
      }
    };

    return rp(options);
  }
};
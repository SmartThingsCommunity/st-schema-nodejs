'use strict';

const rp = require('request-promise-native');
const STBase = require("../STBase");
const uuid = require('uuid/v4');

module.exports = class AccessTokenRequest extends STBase {

  constructor(clientId, clientSecret, requestId) {
    super('accessTokenRequest', requestId ? requestId : uuid());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getCallbackToken(url, code) {
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
          grantType: "authorization_code",
          code: code,
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }
      }
    };

    return rp(options);
  }
};
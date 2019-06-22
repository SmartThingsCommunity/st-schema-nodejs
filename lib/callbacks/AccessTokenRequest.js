'use strict';

const fetch = require('node-fetch');
const checkFetchStatus = require('../util/checkFetchStatus');
const STBase = require("../STBase");
const uuid = require('uuid/v4');

module.exports = class AccessTokenRequest extends STBase {

  constructor(clientId, clientSecret, requestId) {
    super('accessTokenRequest', requestId || uuid());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getCallbackToken(url, code) {
    const body = {
      headers: this.headers,
      callbackAuthentication: {
        grantType: "authorization_code",
        code: code,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      }
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    };

    return fetch(url, options)
      .then(checkFetchStatus)
      .then(res => res.json());
  }
};

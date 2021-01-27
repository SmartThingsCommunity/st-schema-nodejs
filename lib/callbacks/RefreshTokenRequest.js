'use strict';

const fetch = require('node-fetch');
const checkFetchStatus = require('../util/checkFetchStatus');
const STBase = require("../STBase");
const {v4: uuidv4} = require("uuid");

module.exports = class RefreshTokenRequest extends STBase {

  constructor(clientId, clientSecret) {
    super('refreshAccessTokens', uuidv4());
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getCallbackToken(url, refreshToken) {
    const body = {
      headers: this.headers,
      callbackAuthentication: {
        grantType: "refresh_token",
        refreshToken: refreshToken,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      }
    };

    if (this.globalError) {
      body.globalError = this.globalError
    }

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

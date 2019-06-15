'use strict';

const RefreshTokenRequest = require('../../../lib/callbacks/RefreshTokenRequest');
const sinon = require('sinon');
const rp = require('request-promise-native');

const testClientId = 'xxxx';
const testClientSecret = 'yyyy';
const testUrl = 'https://stschema.com/oauth/token';
const testRefreshToken = 'aaaa-bbbb';

describe('RefreshTokenRequest', function() {

  describe('constructor', function() {
    it('Should create an instance of RefreshTokenRequest', async function() {
      const objectUnderTest = new RefreshTokenRequest(testClientId, testClientSecret);
      objectUnderTest.should.be.instanceOf(RefreshTokenRequest);
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('refreshAccessTokens');
    });
  });

  describe('tokenRequest', function() {
    it('Should execute proper request', async function() {
      const objectUnderTest = new RefreshTokenRequest(testClientId, testClientSecret);

      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        url.should.equal(testUrl);
        method.should.equal('POST');
        body.callbackAuthentication.grantType.should.equal('refresh_token');
        body.callbackAuthentication.refreshToken.should.equal(testRefreshToken);
        body.callbackAuthentication.clientId.should.equal(testClientId);
        body.callbackAuthentication.clientSecret.should.equal(testClientSecret)
      });
      objectUnderTest.getCallbackToken(testUrl, testRefreshToken)
      stub.restore();
    });
  });
});

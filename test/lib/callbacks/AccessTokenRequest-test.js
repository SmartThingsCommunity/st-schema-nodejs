'use strict';

const AccessTokenRequest = require('../../../lib/callbacks/AccessTokenRequest');
const sinon = require('sinon');
const rp = require('request-promise-native');

const testClientId = 'xxxx';
const testClientSecret = 'yyyy';
const testRequestId = '1234';
const testUrl = 'https://stschema.com/oauth/token';
const testCode = 'aaaa';

describe('AccessTokenResponse', function() {

  describe('constructor', function() {
    it('Should create an instance of AccessTokenRequest', async function() {
      const objectUnderTest = new AccessTokenRequest(testClientId, testClientSecret, testRequestId);
      objectUnderTest.should.be.instanceOf(AccessTokenRequest);
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('accessTokenRequest');
      headers.should.have.property('requestId').equal(testRequestId);
    });
  });

  describe('tokenRequest', function() {
    it('Should execute proper request', async function() {
      const objectUnderTest = new AccessTokenRequest(testClientId, testClientSecret, testRequestId);

      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        url.should.equal(testUrl);
        method.should.equal('POST');
        body.callbackAuthentication.grantType.should.equal('authorization_code');
        body.callbackAuthentication.code.should.equal(testCode);
        body.callbackAuthentication.clientId.should.equal(testClientId);
        body.callbackAuthentication.clientSecret.should.equal(testClientSecret)
      });
      objectUnderTest.getCallbackToken(testUrl, testCode)
      stub.restore();
    });
  });
});

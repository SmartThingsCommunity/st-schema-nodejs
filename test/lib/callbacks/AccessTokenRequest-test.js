'use strict';

const AccessTokenRequest = require('../../../lib/callbacks/AccessTokenRequest');
const sinon = require('sinon');
const fetch = require('node-fetch');

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

});

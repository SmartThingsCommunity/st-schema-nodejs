'use strict';

const RefreshTokenRequest = require('../../../lib/callbacks/RefreshTokenRequest');
const sinon = require('sinon');

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

});

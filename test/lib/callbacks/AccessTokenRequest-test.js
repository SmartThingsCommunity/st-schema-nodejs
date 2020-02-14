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

  describe('validTokenRequest', function() {
    it('Should execute proper request without refreshing token', async function() {
      const objectUnderTest = new AccessTokenRequest(testClientId, testClientSecret, testRequestId);

      const stub = sinon.stub(fetch, 'Promise')
        .returns(Promise.resolve({
          ok: true,
          json: function() {
            return {
              "headers": {
                "schema": "st-schema",
                "version": "1.0",
                "interactionType": "accessTokenResponse",
                "requestId": "1D461343-65F1-4A3A-86A8-5FC5D5701669"
              },
              "callbackAuthentication": {
                "tokenType": "Bearer",
                "accessToken": "eyJhbGciOiJIUzM4NCJ9.ZTVhYjI2ZDEtNTI5ZC00Mjk4LThjM2MtOTE4OGRkNmI1NjNkOlNUIFNjaGVtYSBPQXV0aCBFeGFtcGxl.kM9F4nOrO9QV6NlNl_N_u68G0aHjw3OKqrWojPRhJnzIInL3pVoh23tM_9UhEYu0",
                "refreshToken": "eyJhbGciOiJIUzM4NCJ9.NDNmNTkxZTgtNzNkZi00ZjZhLWJmNGYtZWVmNWI2ZTYzMjUzOlNUIFNjaGVtYSBPQXV0aCBFeGFtcGxl.bPng5oDs0NMbfjrXkSo79dpG2HyXm1b6gXjudKJITdGK0LiGbCiqenb4XlXPVM7i",
                "expiresIn": 86400
              }
            }
          }
        }));

      const response = await objectUnderTest.getCallbackToken(testUrl, testCode);

      stub.restore();
    });
  });
});

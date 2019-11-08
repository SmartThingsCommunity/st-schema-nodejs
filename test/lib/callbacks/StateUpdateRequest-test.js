'use strict';

const StateUpdateRequest = require('../../../lib/callbacks/StateUpdateRequest');
const sinon = require('sinon');
const fetch = require('node-fetch');

const testClientId = 'xxxx';
const testClientSecret = 'yyyy';
const testCallbackUrls = {
  oauthToken: 'https://smartthings/token',
  stateCallback: 'https://smartthings/callback'
};
const textCallbackAuth = {
  accessToken: 'aaaa-zzzz',
  refreshToken: 'yyyy-bbbb'
};
const testDeviceState = [
  {
    externalDeviceId: 'abcd',
    states: [
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: 'on'
      }
    ]
  }
];

describe('StateUpdateRequest', function() {

  describe('constructor', function() {
    it('Should create an instance of StateUpdateRequest', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);
      objectUnderTest.should.be.instanceOf(StateUpdateRequest);
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('stateCallback');
    });
  });

  describe('validTokenRequest', function() {
    it('Should execute proper request without refreshing token', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const stub = sinon.stub(fetch, 'Promise')
        .returns(Promise.resolve({
          ok: true,
          json: function() {
            return {}
          }
        }));

      let refreshCallback = false;
      await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState, function() {
        refreshCallback = true;
      });

      refreshCallback.should.equal(false);
      stub.restore();
    });
  });


  describe('validTokenRequestWithNoRefreshCallback', function() {
    it('Should execute proper request ', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const stub = sinon.stub(fetch, 'Promise')
        .returns(Promise.resolve({
          ok: true,
          json: function() {
            return {}
          }
        }));

      await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState);
      stub.restore();
    });
  });

  describe('invalidTokenRequestWithRefresh', function() {
    it('Should execute proper request, refresh token, and re-issue the request', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const stub = sinon.stub();

      const fetchStub = sinon.stub(fetch, 'Promise')
        .onCall(0).returns(Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'UNAUTHORIZED'
        }))
        .onCall(1).returns(Promise.resolve({
          ok: true,
          json: function() {
            return {
              callbackAuthentication: {
                accessToken: 'aaaa-xxxx',
                refreshToken: 'yyyy-cccc'
              }
            }
          }
        }))
        .onCall(2).returns(Promise.resolve({
          ok: true,
          json: function() {
            return {}
          }
        }));

      await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState, stub);

      const {callbackAuthentication} = (await fetchStub.returnValues[1]).json();

      fetchStub.callCount.should.equal(3);
      stub.callCount.should.equal(1);
      callbackAuthentication.should.have.property('accessToken');
      callbackAuthentication.should.have.property('refreshToken');
      callbackAuthentication.accessToken.should.equal('aaaa-xxxx');
      callbackAuthentication.refreshToken.should.equal('yyyy-cccc');

      fetchStub.restore();
    });
  });

  describe('invalidTokenRequestWithNoRefresh', function() {
    it('Should execute proper request, refresh token, and re-issue the request', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const fetchStub = sinon.stub(fetch, 'Promise')
        .onCall(0).returns(Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'UNAUTHORIZED'
        }));

      let statusCode = 200;
      try {
        await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState);
      }
      catch (err) {
        statusCode = err.statusCode
      }

      fetchStub.callCount.should.equal(1);
      statusCode.should.equal(401);
      fetchStub.restore();
    });
  });

});

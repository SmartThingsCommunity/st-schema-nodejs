'use strict';

const StateUpdateRequest = require('../../../lib/callbacks/StateUpdateRequest');
const sinon = require('sinon');
const rp = require('request-promise-native');

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
      headers.should.have.property('interactionType').equal('callback');
    });
  });

  describe('validTokenRequest', function() {
    it('Should execute proper request without refreshing token', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        url.should.equal('https://smartthings/callback');
        method.should.equal('POST');
        body.authentication.token.should.equal('aaaa-zzzz');
        body.authentication.tokenType.should.equal('Bearer');
        return new Promise((resolve, reject) => {
          resolve({})
        })
      });
      let refreshCallback = false;
      objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState, function() {
        refreshCallback = true;
      });
      refreshCallback.should.equal(false);
      stub.restore();
    });
  });

  describe('validTokenRequestWithNoRefreshCallback', function() {
    it('Should execute proper request ', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        url.should.equal('https://smartthings/callback');
        method.should.equal('POST');
        body.authentication.token.should.equal('aaaa-zzzz');
        body.authentication.tokenType.should.equal('Bearer');
        return new Promise((resolve, reject) => {
          resolve({})
        })
      });
      await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState);
      stub.restore();
    });
  });

  describe('invalidTokenRequestWithRefresh', function() {
    it('Should execute proper request, refresh token, and re-issue the request', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      let firstTime = true;
      let secondCall = false;
      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        if (url === 'https://smartthings/callback') {
          if (firstTime) {
            firstTime = false
            return new Promise((resolve, reject) => {
              reject({statusCode: 401})
            })
          }
          else {
            secondCall = true;
            return new Promise((resolve, reject) => {
              resolve({})
            })
          }
        }
        else {
          url.should.equal('https://smartthings/token');
          return new Promise((resolve, reject) => {
            resolve({
              callbackAuthentication: {
                accessToken: 'aaaa-xxxx',
                refreshToken: 'yyyy-cccc'
              }
            })
          })
        }
      });
      let refreshCallback = false;
      await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState, function(auth) {
        refreshCallback = true;
        auth.should.have.property('accessToken');
        auth.should.have.property('refreshToken');
        auth.accessToken.should.equal('aaaa-xxxx');
        auth.refreshToken.should.equal('yyyy-cccc')
      });
      refreshCallback.should.equal(true);
      secondCall.should.equal(true);
      stub.restore();
    });
  });

  describe('invalidTokenRequestWithNoRefresh', function() {
    it('Should execute proper request, refresh token, and re-issue the request', async function() {
      const objectUnderTest = new StateUpdateRequest(testClientId, testClientSecret);

      let firstTime = true;
      let refresh = false;
      let secondCall = false;
      const stub = sinon.stub(rp, 'Request').callsFake(function(options) {
        const {url, method, body} = options;
        if (url === 'https://smartthings/callback') {
          if (firstTime) {
            firstTime = false
            return new Promise((resolve, reject) => {
              reject({statusCode: 401})
            })
          }
          else {
            secondCall = true;
            return new Promise((resolve, reject) => {
              resolve({})
            })
          }
        }
        else {
          refresh = true;
          return new Promise((resolve, reject) => {
            resolve({})
          })
        }
      });

      try {
        await objectUnderTest.updateState(testCallbackUrls, textCallbackAuth, testDeviceState)
      }
      catch(err) {
        err.should.have.property('statusCode')
        err.statusCode.should.equal(401);
        secondCall.should.equal(false);
        refresh.should.equal(false);
      }
      stub.restore();
    });
  });
});

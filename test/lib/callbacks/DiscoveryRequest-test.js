'use strict';

const DiscoveryDevice = require('../../../lib/discovery/DiscoveryDevice');
const DiscoveryRequest = require('../../../lib/callbacks/DiscoveryRequest');
const sinon = require('sinon');
const fetch = require('node-fetch');

const testClientId = 'xxxx';
const testClientSecret = 'yyyy';
const testCallbackUrls = {
  oauthToken: 'https://smartthings/token',
  stateCallback: 'https://smartthings/callback'
};
const testCallbackAuth = {
  accessToken: 'aaaa-zzzz',
  refreshToken: 'yyyy-bbbb'
};

describe('DiscoveryRequest', function() {

  describe('constructor', function() {
    it('Should create an instance of DiscoveryRequest', async function() {
      const objectUnderTest = new DiscoveryRequest(testClientId, testClientSecret);
      objectUnderTest.should.be.instanceOf(DiscoveryRequest);
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('discoveryCallback');
    });
  });

  describe('validTokenRequest', function() {
    it('Should execute proper request without refreshing token', async function() {
      const objectUnderTest = new DiscoveryRequest(testClientId, testClientSecret);

      const stub = sinon.stub(fetch, 'Promise')
        .returns(Promise.resolve({
          ok: true,
          json: function() {
            return {}
          }
        }));

      let refreshCallback = false;
      const device = new DiscoveryDevice('zzzzz', 'My Test Device', 'custom-handler-type')
        .manufacturerName('SmartThings')
        .modelName('ST One')

      objectUnderTest.addDevice(device);
      await objectUnderTest.sendDiscovery(testCallbackUrls, testCallbackAuth, function() {
        refreshCallback = true;
      });

      refreshCallback.should.equal(false);
      stub.restore();
    });
  });
});

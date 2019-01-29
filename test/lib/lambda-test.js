/**
 *  Copyright 2018 SmartThings
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *  	http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */

'use strict';

const should = require('chai').should();
const sinon = require('sinon');
const rewire = require('rewire');
const lambda = rewire('../../lib/lambda');

const DiscoveryResponse = require('../../lib/discovery/DiscoveryResponse');
const CommandResponse = require('../../lib/state/CommandResponse');
const StateRefreshResponse = require('../../lib/state/StateRefreshResponse');

const testRequestId = 'aaa-bbb-ccc';
const sandbox = sinon.createSandbox();

function createEvent(interactionType, requestId) {
  return {
    headers: {
      interactionType,
      requestId
    }
  };
}

describe('lambda:createResponse', function() {
  const createResponse = lambda.__get__('createResponse');
  const testContext = {};

  afterEach(function() {
    sandbox.restore();
  });

  it('Should create discovery response given discovery request', async function() {
    const response = createResponse('discoveryRequest', testRequestId);
    response.should.be.instanceOf(DiscoveryResponse);
  });

  it('Should create state refresh response given state refresh request', async function() {
    const response = createResponse('stateRefreshRequest', testRequestId);
    response.should.be.instanceOf(StateRefreshResponse);
  });

  it('Should create command response given command request', async function() {
    const response = createResponse('commandRequest', testRequestId);
    response.should.be.instanceOf(CommandResponse);
  });

  it('Should throw error given unknownRequest interaction type', async function() {
    const response = createResponse('unknownRequest', testRequestId);
    response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
    response.globalError.detail.should.be.equal("error interaction type");
  });

  it('Should throw error given grantCallbackAccess interaction type', async function() {
    const response = createResponse('grantCallbackAccess', testRequestId);
    response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
    response.globalError.detail.should.be.equal("grantCallbackAccess type not implemented in st-schema-nodejs helper");
  });

});

describe('lambda', function() {
  let lambdaOpts;
  let testContext;

  beforeEach(function() {
    testContext = {};
    lambdaOpts = {
      discoveryRequest: sandbox.stub().resolves(),
      commandRequest: sandbox.stub().resolves(),
      stateRefreshRequest: sandbox.stub().resolves(),
      callbackRequest: sandbox.stub().resolves()
    };
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('Should fail given empty JSON body', function(done) {
    const event = {};

    const objectUnderTest = lambda(lambdaOpts);
    testContext.succeed = done;
    testContext.fail = (response) => {
        response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
        response.globalError.detail.should.be.equal("invalid ST schema");
        done();
    };
    objectUnderTest(event, testContext)
        .catch(done);
  });

  it('Should fail given unknown interaction type', function(done) {
    const interactionType = 'unknown';
    const event = createEvent(interactionType, testRequestId);

    const objectUnderTest = lambda(lambdaOpts);

    testContext.succeed = sandbox.stub().throws("Should not be called");
    testContext.fail = (response) => {
        response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
        response.globalError.detail.should.be.equal("error interaction type");
        done();
    };

    objectUnderTest(event, testContext)
        .catch(done);
  });

  it('Should fail given unimplemented interaction type', function(done) {
    const interactionType = 'grantCallbackAccess';
    const event = createEvent(interactionType, testRequestId);

    const objectUnderTest = lambda(lambdaOpts);

    testContext.succeed = sandbox.stub().throws("Should not be called");
    testContext.fail = (response) => {
        response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
        response.globalError.detail.should.be.equal("grantCallbackAccess type not implemented in st-schema-nodejs helper");
        done();
    };

    objectUnderTest(event, testContext)
        .catch(done);
  });

  it('Should fail given the interaction type request fails', function(done) {
    const interactionType = 'discoveryRequest';
    const event = createEvent(interactionType, testRequestId);

    const expectedError = new Error('TEST');
    lambdaOpts.discoveryRequest = sandbox.stub().rejects(expectedError);

    const objectUnderTest = lambda(lambdaOpts);

    testContext.succeed = sandbox.stub().throws("Should not be called");
    testContext.fail = (response) => {
        response.globalError.errorEnum.should.be.equal("UNKNOWN-ERROR");
        response.globalError.detail.should.be.equal(expectedError.message);
        done();
    };

    objectUnderTest(event, testContext)
        .catch(done);
  });

});

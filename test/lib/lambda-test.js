/**
 *	Copyright 2018 SmartThings
 *
 *	Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *	in compliance with the License. You may obtain a copy of the License at:
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 *	Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *	on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *	for the specific language governing permissions and limitations under the License.
 *
 */

'use strict';

const should = require('chai').should();
const sinon = require('sinon');
const rewire = require('rewire');
const lambda = rewire('../../lib/lambda');

const responseBuilder = require('../../utils/response_builder');
const DiscoveryResponse = require('../../lib/discovery/DiscoveryResponse');
const CommandResponse = require('../../lib/state/CommandResponse');
const StateRefreshResponse = require('../../lib/state/StateRefreshResponse');

const testRequestId = 'aaa-bbb-ccc';
const testContext = {};

function createEvent(interactionType, requestId) {
  const body = {
    headers: {
      interactionType,
      requestId
    }
  };
  return {
    body: JSON.stringify(body)
  };
}

describe('lambda:createResponse', function() {
  const sandbox = sinon.createSandbox();
  const createResponse = lambda.__get__('createResponse');

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

  it('Should not create any response given callback interaction type', async function() {
    const response = createResponse('callbackRequest', testRequestId);
    should.not.exist(response);
  });

  it('Should not create any response given unknown interaction type', async function() {
    const response = createResponse('unknown', testRequestId);
    should.not.exist(response);
  });
});

describe('lambda', function() {
  const sandbox = sinon.createSandbox();
  let lambdaOpts;

  beforeEach(function() {
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

  it('Should fail given invalid JSON body', async function() {
    const event = {
      body: 'NOT JSON'
    };

    const mock = sandbox.mock(lambda.__get__('responseBuilder'));
    mock.expects('badRequest')
        .withArgs(undefined, 'Failed to parse POST body');

    const objectUnderTest = lambda(lambdaOpts);
    const p = objectUnderTest(event, testContext);

    mock.verify();
    mock.restore();

    return p;
  });

  it('Should fail given unknown interaction type', async function() {
    const interactionType = 'unknown';
    const event = createEvent(interactionType, testRequestId);

    const mock = sandbox.mock(lambda.__get__('responseBuilder'));
    mock.expects('badRequest')
        .withArgs(testRequestId, interactionType + ' has not been implemented');

    const objectUnderTest = lambda(lambdaOpts);
    const p = objectUnderTest(event, testContext);

    mock.verify();
    mock.restore();

    return p;
  });

  it('Should fail given unimplemented interaction type', async function() {
    const interactionType = 'callbackRequest';
    const event = createEvent(interactionType, testRequestId);

    const mockCreateResponse = sandbox.stub();
    const revert = lambda.__set__('createResponse', mockCreateResponse);

    const mock = sandbox.mock(lambda.__get__('responseBuilder'));
    mock.expects('badRequest')
        .withArgs(testRequestId, 'Invalid request ' + interactionType);

    const objectUnderTest = lambda(lambdaOpts);
    const p = objectUnderTest(event, testContext);

    mock.verify();
    mock.restore();
    revert();

    return p;
  });

  it.skip('Should fail given the interaction type request fails', async function() {
    const interactionType = 'discoveryRequest';
    const event = createEvent(interactionType, testRequestId);

    const expectedError = new Error('TEST');
    lambdaOpts.discoveryRequest = sandbox.stub().rejects(expectedError);

    const mockResponse = sandbox.stub();
    const mockCreateResponse = sandbox.stub().returns(mockResponse);

    const mockBuilder = {
      error: sandbox.stub()
        .withArgs(testRequestId, 500, expectedError.message, 'Failed to make the request')
        .returns(expectedError.message)
    }

    const revert = lambda.__set__({
      'createResponse': mockCreateResponse,
      'responseBuilder': mockBuilder
    });

    const objectUnderTest = lambda(lambdaOpts);
    const p = objectUnderTest(event, testContext)
                .then(message => {
                  message.should.be.equal(expectedError.message);
                });

    revert(); 

    return p;
  });

});

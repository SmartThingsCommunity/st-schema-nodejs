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

const DiscoveryResponse = require('../../../lib/discovery/DiscoveryResponse');

const testRequestId = '1234';
const testId = '7890';
const testName = 'TEST';
const testType = 'FAKE';

describe('DiscoveryResponse', function() {
  let objectUnderTest;
  beforeEach(function() {
    objectUnderTest = new DiscoveryResponse(testRequestId);
  });

  describe('constructor', function() {
    it('Should create an instance of DiscoveryResponse', async function() {
      objectUnderTest.should.exist;
      objectUnderTest.should.be.instanceOf(DiscoveryResponse);
      objectUnderTest.should.not.have.property('devices');
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('discoveryResponse');
      headers.should.have.property('requestId').equal(testRequestId);
    });
  });

  describe('addDevice', function() {
    it('Should add a device given valid id, name, and type', async function() {
      objectUnderTest.addDevice(testId, testName, testType);
      const {headers, devices} = objectUnderTest;
      headers.should.have.property('interactionType').equal('discoveryResponse');
      headers.should.have.property('requestId').equal(testRequestId);
      devices.should.have.lengthOf(1);
    });
  });

});

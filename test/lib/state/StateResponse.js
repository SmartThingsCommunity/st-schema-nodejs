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

const StateResponse = require('../../../lib/state/StateResponse');
const Device = require('../../../lib/state/StateDevice');

const testType = 'TEST-type';
const testRequestId = 'TEST-1234';
const testDeviceId = 'aaa-bbb-ccc';
const testDeviceCookie = {
  something: 'anything'
}

describe('StateResponse', function() {
  let objectUnderTest;
  beforeEach(function() {
    objectUnderTest = new StateResponse(testType, testRequestId);
  });

  describe('constructor', function() {
    it('Should create an instance of StateResponse', async function() {
      objectUnderTest.should.exist;
      objectUnderTest.should.be.instanceOf(StateResponse);
      objectUnderTest.should.not.have.property('deviceState');
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal(testType);
      headers.should.have.property('requestId').equal(testRequestId);
    });
  });

  describe('addDevice', function() {
    it('Should add a device given id and cookie', function() {
      const device = objectUnderTest.addDevice(testDeviceId, testDeviceCookie);
      device.should.exist;
      device.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('deviceState').with.lengthOf(1);
      objectUnderTest.deviceState[0].should.equal(device);
    });
  });

});

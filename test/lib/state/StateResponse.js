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
const testDeviceCookie = {myData: 'xyz'}
const testDeviceStates = [
  {
    component: 'main',
    capability: 'st.switch',
    attribute: 'switch',
    value: 'off'
  },
  {
    component: 'main',
    capability: 'st.thermostatFanMode',
    attribute: 'thermostatFanMode',
    value: 'auto',
    data: {supportedThermostatFanModes: ['auto', 'on']}
  }
];

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
    it('Should add a device given id', function() {
      const device = objectUnderTest.addDevice(testDeviceId);
      device.should.exist;
      device.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('deviceState').with.lengthOf(1);
      objectUnderTest.deviceState[0].should.equal(device);
    });
  });

  describe('addDeviceAndCookie', function() {
    it('Should add a device given id', function() {
      const device = objectUnderTest.addDevice(testDeviceId).addCookie(testDeviceCookie);
      device.should.exist;
      device.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('deviceState').with.lengthOf(1);
      objectUnderTest.deviceState[0].should.equal(device);
      objectUnderTest.deviceState[0].should.have.property('cookie');
      objectUnderTest.deviceState[0].cookie.should.have.property('myData');
      objectUnderTest.deviceState[0].cookie.myData.should.equal(testDeviceCookie.myData);
    });
  });

  describe('addDeviceWithStates', function() {
    it('Should add a device given id and state', function() {
      const device = objectUnderTest.addDevice(testDeviceId, testDeviceStates);
      device.should.exist;
      device.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('deviceState').with.lengthOf(1);
      objectUnderTest.deviceState[0].should.equal(device);

      objectUnderTest.deviceState[0].should.have.property('states').with.lengthOf(2);
      objectUnderTest.deviceState[0].states[0].should.equal(testDeviceStates[0]);
      objectUnderTest.deviceState[0].states[1].should.equal(testDeviceStates[1]);
    });
  });

  describe('addDeviceWithStatesAndCookie', function() {
    it('Should add a device given id and state', function() {
      const device = objectUnderTest.addDevice(testDeviceId, testDeviceStates).addCookie(testDeviceCookie);
      device.should.exist;
      device.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('deviceState').with.lengthOf(1);
      objectUnderTest.deviceState[0].should.equal(device);
      objectUnderTest.deviceState[0].cookie.should.have.property('myData');
      objectUnderTest.deviceState[0].cookie.myData.should.equal(testDeviceCookie.myData);
      objectUnderTest.deviceState[0].should.have.property('states').with.lengthOf(2);
      objectUnderTest.deviceState[0].states[0].should.equal(testDeviceStates[0]);
      objectUnderTest.deviceState[0].states[1].should.equal(testDeviceStates[1]);
    });
  });

});

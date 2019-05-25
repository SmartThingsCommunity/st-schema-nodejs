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

const Device = require('../../../lib/state/StateDevice');

const testDeviceId = '1234';
const testDeviceCookie = {
  something: 'anything'
};
const testComponent = 'test-component';
const testCapability = 'test-capability';
const testAttribute = 'test-attribute';
const testValue = 9999;
const testUnit = 'rad'
const testData = {modes: ['x','y','z']}

describe('StateDevice', function() {
  let objectUnderTest;

  beforeEach(function() {
    objectUnderTest = new Device(testDeviceId, testDeviceCookie);
  });

  describe('constructor', function() {
    it('Should create instance of StateDevice', async function() {
      objectUnderTest.should.exist;
      objectUnderTest.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('externalDeviceId').equal(testDeviceId);
      objectUnderTest.should.not.have.property('states');
    });
  });

  describe('addComponent', function() {
    it('Should add a component given a string', async function() {
      const component = objectUnderTest.addComponent(testComponent);
      component.should.have.property('addState').be.a('function');
    });
  });

  describe('addState', function() {
    it('Should add a state given valid arguments', async function() {
      const state = objectUnderTest.addState(
        testComponent,
        testCapability,
        testAttribute,
        testValue,
        testUnit,
        testData
      );
      objectUnderTest.states.should.have.lengthOf(1);
      state.should.have.property('component').equal(testComponent);
      state.should.have.property('capability').equal(testCapability);
      state.should.have.property('attribute').equal(testAttribute);
      state.should.have.property('value').equal(testValue);
      state.should.have.property('unit').equal(testUnit);
      state.should.have.property('data').equal(testData);
    });
  });

});

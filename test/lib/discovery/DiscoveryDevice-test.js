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

const Device = require('../../../lib/discovery/DiscoveryDevice');
const Component = require('../../../lib/discovery/DiscoveryComponent');

const testDeviceId = '1234';
const testFriendlyName = 'test name';
const testDeviceType = 'test type';

describe('DiscoveryDevice', function() {
  let objectUnderTest;

  beforeEach(function() {
    objectUnderTest = new Device(testDeviceId, testFriendlyName, testDeviceType);
  });

  describe('constructor', function() {
    it('Should create an instance of DiscoveryDevice', async function() {
      objectUnderTest.should.exist;
      objectUnderTest.should.be.instanceOf(Device);
      objectUnderTest.should.have.property('externalDeviceId').equal(testDeviceId);
      objectUnderTest.should.have.property('friendlyName').equal(testFriendlyName);
      objectUnderTest.should.have.property('deviceHandlerType').equal(testDeviceType);
    });
  });

  describe('deviceUniqueId', async function() {
    objectUnderTest = new Device(testDeviceId, testFriendlyName, testDeviceType);
    objectUnderTest.deviceUniqueId('xyz123');
    objectUnderTest.should.have.property('deviceUniqueId').equal('xyz123');
  });

  let testcases = [{
    description: 'Should set manufacturer name given a string',
    propertyName: 'manufacturerInfo',
    methodName: 'manufacturerName'
  }, {
    description: 'Should set model name given a string',
    propertyName: 'manufacturerInfo',
    methodName: 'modelName'
  }, {
    description: 'Should set hardware version given a string',
    propertyName: 'manufacturerInfo',
    methodName: 'hwVersion'
  }, {
    description: 'Should set software version given a string',
    propertyName: 'manufacturerInfo',
    methodName: 'swVersion'
  }, {
    description: 'Should set room name given a string',
    propertyName: 'deviceContext',
    methodName: 'roomName'
  }];

  for (let testcase of testcases) {
    const {methodName, propertyName, description} = testcase;
    describe(methodName, function() {
      it(description, async function() {
        const inputString = methodName + ' TEST';
        const obj = objectUnderTest[methodName](inputString);
        objectUnderTest.should.equal(obj);
        objectUnderTest.should.have.property(propertyName)
                              .have.property(methodName).equal(inputString);
      });
    });
  }

  testcases = [{
    description: 'Should add a group given a string',
    propertyName: 'groups',
    methodName: 'addGroup'
  }, {
    description: 'Should add a category given a string',
    propertyName: 'categories',
    methodName: 'addCategory'
  }];

  for (let testcase of testcases) {
    const {methodName, propertyName, description} = testcase;
    describe(methodName, function() {
      it(description, async function() {
        const inputString = 'TEST';
        const obj = objectUnderTest[methodName](inputString);
        obj.should.equal(inputString);
        objectUnderTest.should.have.property('deviceContext')
                              .have.property(propertyName).with.lengthOf(1);
        objectUnderTest.deviceContext[propertyName][0].should.equal(inputString);
      });
    });
  }

  describe('addComponent', function() {
    it('Should add a component given a string', async function() {
      const inputString = 'TEST';
      const obj = objectUnderTest.addComponent(inputString);
      obj.should.be.instanceOf(Component);
      objectUnderTest.should.have.property('components')
                            .have.property(inputString).equal(obj);
    });
  });

});

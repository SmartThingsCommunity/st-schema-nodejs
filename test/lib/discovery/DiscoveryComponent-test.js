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

const Component = require('../../../lib/discovery/DiscoveryComponent');
const testCapability = 'test-capability';
const testAttribute = 'test-attribute';
const testType = 'test-type';
const testMin = 0;
const testMax = 10;
const testUnits = 'unit';

describe('DiscoveryComponent', function() {

  describe('constructor', function() {
    it('should create an instance of Component', async function() {
      const objectUnderTest = new Component();
      objectUnderTest.should.exist;
      objectUnderTest.should.be.instanceOf(Component);
    });
  });

  describe('addProperty', function() {
    it('should add a property given all arguments except units', async function() {
      const objectUnderTest = new Component();
      const property = objectUnderTest.addProperty(
        testCapability, 
        testAttribute, 
        testType, 
        testMin, 
        testMax
      );
      property.should.exist;
      objectUnderTest.capabilities[0].should.equal(testCapability);
      objectUnderTest.properties.should.have.property(testCapability)
                                .have.property(testAttribute);
      property.should.have.property('type').equal(testType);
      property.should.have.property('minimum').equal(testMin);
      property.should.have.property('maximum').equal(testMax);
      property.should.have.property('units').is.undefined;
    });

    it('should add a property given all arguments', async function() {
      const objectUnderTest = new Component();
      const property = objectUnderTest.addProperty(
        testCapability, 
        testAttribute, 
        testType, 
        testMin, 
        testMax,
        testUnits
      );
      property.should.exist;
      objectUnderTest.capabilities[0].should.equal(testCapability);
      objectUnderTest.properties.should.have.property(testCapability)
                                .have.property(testAttribute);
      property.should.have.property('type').equal(testType);
      property.should.have.property('minimum').equal(testMin);
      property.should.have.property('maximum').equal(testMax);
      property.should.have.property('units').equal(testUnits);
    });

    it('should not be able to add new attribute to the added porperty', async function() {
      const objectUnderTest = new Component();
      const property = objectUnderTest.addProperty(
        testCapability, 
        testAttribute, 
        testType, 
        testMin, 
        testMax,
        testUnits
      );
      property.should.exist;
      try {
        property.bad = '1234';
        should.fail('should not have be able to add new property');
      } catch(err) {
        // pass
      }
    });
  });

});

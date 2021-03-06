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

const StateRefreshResponse = require('../../../lib/state/StateRefreshResponse');

const testRequestId = '1234';

describe('StateRefreshResponse', function() {
  describe('constructor', function() {
    it('Should create an instance of StateRefreshResponse', async function() {
      const objectUnderTest = new StateRefreshResponse(testRequestId);

      objectUnderTest.should.be.instanceOf(StateRefreshResponse);
      const {headers} = objectUnderTest;
      headers.should.have.property('interactionType').equal('stateRefreshResponse');
      headers.should.have.property('requestId').equal(testRequestId);
    });
  });
});

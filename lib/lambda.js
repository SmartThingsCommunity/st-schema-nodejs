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

const DiscoveryResponse = require('./discovery/DiscoveryResponse');
const CommandResponse = require('./state/CommandResponse');
const StateRefreshResponse = require('./state/StateRefreshResponse');
const ErrorResponse = require('./STBase');

function createResponse(interactionType, requestId) {
  switch (interactionType) {
    case 'discoveryRequest':
      return new DiscoveryResponse(requestId);

    case 'stateRefreshRequest':
      return new StateRefreshResponse(requestId);

    case 'commandRequest':
      return new CommandResponse(requestId);

    case 'grantCallbackAccess':
      const badCallback = new ErrorResponse(interactionType, requestId);
      badCallback.setError(
        'grantCallbackAccess type not implemented in st-schema-nodejs helper'
      );
      return badCallback;

    default:
      const badType = new ErrorResponse(interactionType, requestId);
      badType.setError('error interaction type');
      return badType;
  }
}

function isValidSchema(schema) {
  if (!schema.hasOwnProperty('headers')) {
    return false;
  }

  return schema.headers.hasOwnProperty('interactionType');
}

module.exports = function(opts) {
  return async function(event, context) {
    let response;

    if (!isValidSchema(event)) {
      response = new ErrorResponse();
      response.setError('invalid ST schema');
      return context.fail(response);
    }

    const { headers } = event;
    const { interactionType, requestId } = headers;

    response = createResponse(interactionType, requestId);

    if (response.isError()) {
      return context.fail(response);
    }

    try {
      console.log('interactionType', interactionType);
      await opts[interactionType](event, response);
    } catch (err) {
      console.error('ERROR IN ST-SCHEMA HELPER', err);
      response.setError(err.message);
      return context.fail(response);
    }

    console.log('response back to SmartThings %j', response);
    return context.succeed(response);
  };
};

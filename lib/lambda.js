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

const responseBuilder = require('../utils/response_builder');

const DiscoveryResponse = require('./discovery/DiscoveryResponse');
const CommandResponse = require('./state/CommandResponse');
const StateRefreshResponse = require('./state/StateRefreshResponse');

const ALLOWED_REQUESTS = [
  "discoveryRequest",
  "stateRefreshRequest",
  "commandRequest",
  "grantCallbackAccess"
];

function createResponse(interactionType, requestId) {
  switch(interactionType) {
    case 'discoveryRequest':
      return new DiscoveryResponse(requestId);
    case 'stateRefreshRequest':
      return new StateRefreshResponse(requestId);
    case 'commandRequest':
      return new CommandResponse(requestId);
    case 'grantCallbackAccess':
      return "grantCallbackAccess type not implemented in st-schema-nodejs helper"
    default:
      return "error interaction type"
  }
}

module.exports = function(opts) {
  return async function(event, context) {
    let request, response;
  
    try {
      request = event;//JSON.parse(event.body);
      //console.log("event", JSON.stringify(event))
    } catch(err) { 
      return responseBuilder.badRequest(
        undefined,
        'Failed to parse POST body'
      );
    }
  
    const {headers, authentication, devices} = request;
    const {interactionType, requestId} = headers;
  
    if (! opts[interactionType]) {
      return responseBuilder.badRequest(
      requestId,
      interactionType + ' has not been implemented'
      );
    }
  
    response = createResponse(interactionType, requestId);

    if (! response) {
      return responseBuilder.badRequest(
        requestId, 
        'Invalid request ' + interactionType
      );
    }
      
    try {
      console.log("interactionType", interactionType);
      await opts[interactionType].call(
        null, 
        request,
        response
      );
    } catch(err) {
      /*return responseBuilder.error(
        requestId,
        500,
        err.message,
        'Failed to make the request'
      );*/
      console.error("ERROR IN ST-SCHEMA HELPER", err);
      response.globalError = {};
      response.globalError.errorEnum = "UNKNOWN-ERROR";
      response.globalError.detail = err;
      context.fail(response);
    }
  
    //return responseBuilder.response(200, response);
    console.log("response back to SmartThings %j", response)
    context.succeed(response);
  }
}

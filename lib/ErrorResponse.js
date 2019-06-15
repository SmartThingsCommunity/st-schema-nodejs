'use strict';


const STBase = require('./STBase');

class ErrorResponse extends STBase {

  constructor(interactionType, requestId) {
    super(interactionType, requestId);
  }

}

module.exports = ErrorResponse;
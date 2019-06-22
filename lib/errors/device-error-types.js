'use strict';

const types = {
  DEVICE_DELETED: 'DEVICE-DELETED',                               //Device is deleted and cannot accept commands.
  RESOURCE_CONSTRAINT_VIOLATION: 'RESOURCE-CONSTRAINT-VIOLATION', //Value is out of range or not acceptable.
  DEVICE_UNAVAILABLE: 'DEVICE-UNAVAILABLE',                       //Device is unavailable because of a f/w update, maintenance, etc. For use when temporarily unavailable for known reasons.
  CAPABILITY_NOT_SUPPORTED: 'CAPABILITY-NOT-SUPPORTED'            //Command requested is not supported by the device.
};

module.exports = Object.freeze(types);
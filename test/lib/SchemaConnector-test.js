'use strict';

const SchemaConnector = require('../../lib/SchemaConnector');
const AccessTokenRequest = require('../../lib/callbacks/AccessTokenRequest');
const DeviceErrorTypes = require('../../lib/errors/device-error-types')
const sinon = require('sinon');

let interactionResultCount = 0;
const testClientId = 'xxxx';
const testClientSecret = 'yyyy';

const textCallbackAuth = {
  accessToken: 'aaaa-zzzz',
  refreshToken: 'yyyy-bbbb'
};

class HttpResponse {
  status (code) {
    this.statusCode = code
    return this
  }

  send(data) {
    this.data = data
  }
}

class LambdaContext {
  succeed(data) {
    this.success = data
  }

  fail(data) {
    this.failure = data
  }
}

const schemaConnector = new SchemaConnector()
  .clientId(testClientId)
  .clientSecret(testClientSecret)
  .discoveryHandler((accessToken, response) => {
    response.addDevice('abcd', 'Test Switch 1', 'c2c-switch')
  })
  .stateRefreshHandler((accessToken, response, data) => {
    for (const device of data.devices) {
      if (device.externalDeviceId === 'abcd') {
        response.addDevice('abcd', [
          {
            component: 'main',
            capability: 'st.switch',
            attribute: 'switch',
            value: 'off'
          }
        ])
      } else {
        response.addDevice(device.externalDeviceId, [])
          .setError('Device not found', DeviceErrorTypes.DEVICE_DELETED)
      }
    }
  })
  .commandHandler((accessToken, response, devices) => {
    for (const device of devices) {
      if (device.externalDeviceId === 'abcd') {
        response.addDevice(device.externalDeviceId, device.commands.map(cmd => {
          return {
            component: cmd.component,
            capability: cmd.capability,
            attribute: 'switch',
            value: cmd.command === 'on' ? 'on' : 'off'
          }
        }))
      } else {
        response.addDevice(device.externalDeviceId, [])
          .setError('Device not found', DeviceErrorTypes.DEVICE_DELETED)
      }
    }
  })
  .integrationDeletedHandler(accessToken => {
    delete textCallbackAuth.accessToken
  })
  .interactionResultHandler(accessToken => {
    interactionResultCount++
  });

const errorConnector = new SchemaConnector()
  .clientId(testClientId)
  .clientSecret(testClientSecret)
  .discoveryHandler((accessToken, response) => {
    throw Error('Error handling discovery request')
  })


describe('SchemaConnector', function() {

  describe('constructor', function() {
    it('Should create an instance of StateUpdateRequest', async function() {
      schemaConnector.should.be.instanceOf(SchemaConnector);
    });
  });

  describe('discoveryHandlerRequest', function() {
    it('Should return proper discovery response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "discoveryRequest",
          "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('discoveryResponse');
      response.headers.requestId.should.equal('0edb967a-380e-4699-968e-64ea31cef618');

      response.should.have.property('devices');
      response.devices.length.should.equal(1);
      response.devices[0].externalDeviceId.should.equal('abcd');
      response.devices[0].friendlyName.should.equal('Test Switch 1');
      response.devices[0].deviceHandlerType.should.equal('c2c-switch');
    });
  });

  describe('grantCallbackAccess', function() {
    it('Should return proper state refresh response', async function() {

      const grantAccessToken = "eyJhbGciOiJIUzM4NCJ9.MDcyNmRlNDYtNTIzYS00MjlmLWI4MTktODE5NDViODY1MTU1.aLkqFJFmzbrWQNcqsemE_ZHRW8n1Oi1Xrvo_4aB_q7vsUKk03z4rpi-XbyLQ285o";
      const grantRefreshToken = "eyJhbGciOiJIUzM4NCJ9.ZWQ0YzM1ODQtNjA3My00MWViLTkxZTctNDU3ZWNhZmQ2NThm.IAX_H7mFZMHF2PVguvPxHMU8I2-UqDLmszVTDTKWnLVWD64OKm3pYGXWCcFqbQvZ";
      const grantCode = "eyJhbGciOiJIUzM4NCJ9.MTFlZTdlMTMtZjQ1My00YTI0LWI2ZTktZTY4MGU4ZDU4NDIx.pVSGwU1hWKFuA4Snzk_vacZH1luHDQgGGaClgPZ4vpULPu35aXtBp6aURNYElxyl"

      let expectedAccessToken = 'UNDEFINED';
      let expectedCallbackAuthentication = {};
      let expectedCallbackUrls = {};

      schemaConnector.callbackAccessHandler(async (accessToken, callbackAuthentication, callbackUrls) => {
        expectedAccessToken = accessToken;
        expectedCallbackAuthentication = callbackAuthentication;
        expectedCallbackUrls = callbackUrls;
      });

      let tokenUrl = 'UNDEFINED';
      let tokenCode = 'UNDEFINED';

      const stub = sinon.stub(AccessTokenRequest.prototype, 'getCallbackToken').callsFake(async function(url, code) {
        tokenUrl = url;
        tokenCode = code;
        return {
          "headers": {
            "schema": "st-schema",
            "version": "1.0",
            "interactionType": "accessTokenResponse",
            "requestId": "E68C91AB-0ED7-48B2-8FFC-036282FBD607"
          },
          "callbackAuthentication": {
            "tokenType": "Bearer",
            "accessToken": grantAccessToken,
            "refreshToken": grantRefreshToken,
            "expiresIn": 86400
          }
        }
      });

      await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "grantCallbackAccess",
          "requestId": "8C58E0CD-386F-4BBB-80B9-B28A7FF8040F"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "callbackAuthentication": {
          "grantType": "authorization_code",
          "scope": "callback-access",
          "code": grantCode,
          "clientId": "xxxx"
        },
        "callbackUrls": {
          "oauthToken": "https://c2c-us.smartthings.com/oauth/token",
          "stateCallback": "https://c2c-us.smartthings.com/device/events"
        }
      });

      tokenUrl.should.equal('https://c2c-us.smartthings.com/oauth/token');
      tokenCode.should.equal(grantCode);

      expectedAccessToken.should.equal('ACCT-HCtR4Q');
      expectedCallbackAuthentication.tokenType.should.equal('Bearer');
      expectedCallbackAuthentication.accessToken.should.equal(grantAccessToken);
      expectedCallbackAuthentication.refreshToken.should.equal(grantRefreshToken);
      expectedCallbackAuthentication.expiresIn.should.equal(86400);

      expectedCallbackUrls.oauthToken.should.equal('https://c2c-us.smartthings.com/oauth/token');
      expectedCallbackUrls.stateCallback.should.equal('https://c2c-us.smartthings.com/device/events');
      stub.restore();
    });
  });

  describe('stateRefreshRequest', function() {
    it('Should return proper state refresh response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "stateRefreshRequest",
          "requestId": "8C58E0CD-386F-4BBB-80B9-B28A7FF8040F"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "devices": [
          {
            "externalDeviceId": "abcd",
            "deviceCookie": {}
          },
          {
            "externalDeviceId": "wxyz",
            "deviceCookie": {}
          }
        ]
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('stateRefreshResponse');
      response.headers.requestId.should.equal('8C58E0CD-386F-4BBB-80B9-B28A7FF8040F');

      response.should.have.property('deviceState');
      response.deviceState.length.should.equal(2);
      response.deviceState[0].externalDeviceId.should.equal('abcd');
      response.deviceState[0].states.length.should.equal(1);
      response.deviceState[0].states[0].component.should.equal('main');
      response.deviceState[0].states[0].capability.should.equal('st.switch');
      response.deviceState[0].states[0].attribute.should.equal('switch');
      response.deviceState[0].states[0].value.should.equal('off');

      response.deviceState[1].externalDeviceId.should.equal('wxyz');
      response.deviceState[1].deviceError[0].detail.should.equal('Device not found')
      response.deviceState[1].deviceError[0].errorEnum.should.equal('DEVICE-DELETED')
    });
  });

  describe('commandRequestOn', function() {
    it('Should return proper on command response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "commandRequest",
          "requestId": "3d41b3d6-b328-68b8-351a-8c0c2303adb1"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "devices": [
          {
            "externalDeviceId": "abcd",
            "deviceCookie": {},
            "commands": [
              {
                "component": "main",
                "capability": "st.switch",
                "command": "on",
                "arguments": []
              }
            ]
          }
        ]
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('commandResponse');
      response.headers.requestId.should.equal('3d41b3d6-b328-68b8-351a-8c0c2303adb1');

      response.should.have.property('deviceState');
      response.deviceState.length.should.equal(1);
      response.deviceState[0].externalDeviceId.should.equal('abcd');
      response.deviceState[0].states.length.should.equal(1);
      response.deviceState[0].states[0].component.should.equal('main');
      response.deviceState[0].states[0].capability.should.equal('st.switch');
      response.deviceState[0].states[0].attribute.should.equal('switch');
      response.deviceState[0].states[0].value.should.equal('on')
    });
  });

  describe('commandRequestOff', function() {
    it('Should return proper off command response response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "commandRequest",
          "requestId": "3d41b3d6-b328-68b8-351a-8c0c2303adb1"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "devices": [
          {
            "externalDeviceId": "abcd",
            "deviceCookie": {},
            "commands": [
              {
                "component": "main",
                "capability": "st.switch",
                "command": "off"
              }
            ]
          }
        ]
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('commandResponse');
      response.headers.requestId.should.equal('3d41b3d6-b328-68b8-351a-8c0c2303adb1');

      response.should.have.property('deviceState');
      response.deviceState.length.should.equal(1);
      response.deviceState[0].externalDeviceId.should.equal('abcd');
      response.deviceState[0].states.length.should.equal(1);
      response.deviceState[0].states[0].component.should.equal('main');
      response.deviceState[0].states[0].capability.should.equal('st.switch');
      response.deviceState[0].states[0].attribute.should.equal('switch');
      response.deviceState[0].states[0].value.should.equal('off')
    });
  });

  describe('commandRequest missing device', function() {
    it('Should return error response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "commandRequest",
          "requestId": "3d41b3d6-b328-68b8-351a-8c0c2303adb1"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "devices": [
          {
            "externalDeviceId": "wxyz",
            "deviceCookie": {},
            "commands": [
              {
                "component": "main",
                "capability": "st.switch",
                "command": "off"
              }
            ]
          }
        ]
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('commandResponse');
      response.headers.requestId.should.equal('3d41b3d6-b328-68b8-351a-8c0c2303adb1');

      response.should.have.property('deviceState');
      response.deviceState.length.should.equal(1);
      response.deviceState[0].externalDeviceId.should.equal('wxyz');
      response.deviceState[0].deviceError.length.should.equal(1);
      response.deviceState[0].deviceError[0].errorEnum.should.equal('DEVICE-DELETED');
      response.deviceState[0].deviceError[0].detail.should.equal('Device not found');
    });
  });

  describe('invalidRequest : missing headers', function() {
    it('Should return proper error response', async function() {
      const response = await schemaConnector.handleCallback({
        "item": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.isError().should.equal(true);
      response.should.have.property('globalError');
      response.globalError.errorEnum.should.equal('BAD-REQUEST')
    });
  });

  describe('invalidRequest : missing authentication', function() {
    it('Should return proper error response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "discoverRequest",
          "requestId": "3d41b3d6-b328-68b8-351a-8c0c2303adb1"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.isError().should.equal(true);
      response.should.have.property('globalError');
      response.globalError.errorEnum.should.equal('BAD-REQUEST')
    });
  });

  describe('invalidInteractionType', function() {
    it('Should return proper error response', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "someOtherRequest",
          "requestId": "3d41b3d6-b328-68b8-351a-8c0c2303adb1"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.isError().should.equal(true);
      response.should.have.property('globalError');
      response.globalError.errorEnum.should.equal('INVALID-INTERACTION-TYPE')
    });
  });

  describe('invalidGrantCallbackAccess', function() {
    it('Should return proper error response', async function() {

      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "grantCallbackAccess",
          "requestId": "8C58E0CD-386F-4BBB-80B9-B28A7FF8040F"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        },
        "callbackAuthentication": {
          "grantType": "authorization_code",
          "scope": "callback-access",
          "code": "eyJhbGciOiJIUzM4NCJ9.MTFlZTdlMTMtZjQ1My00YTI0LWI2ZTktZTY4MGU4ZDU4NDIx.pVSGwU1hWKFuA4Snzk_vacZH1luHDQgGGaClgPZ4vpULPu35aXtBp6aURNYElxyl",
          "clientId": "pdq"
        },
        "callbackUrls": {
          "oauthToken": "https://c2c-us.smartthings.com/oauth/token",
          "stateCallback": "https://c2c-us.smartthings.com/device/events"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.isError().should.equal(true);
      response.should.have.property('globalError');
      response.globalError.errorEnum.should.equal('INVALID-CLIENT')
    });
  });

  describe('interactionResultTest', function() {
    it('Should properly handle an interaction result request', async function() {
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "interactionResult",
          "requestId": "FCDBB024-6785-4518-A27F-4593CCE0387B"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "1OCdvY6XCHVKPuQXEMQYjHwd"
        },
        "deviceState": [
          {
            "externalDeviceId": "00955ee8-f54e-4ccd-8698-83fe162cab5b",
            "deviceError": [
              {
                "errorEnum": 400,
                "detail": "manufacturerInfo, manufacturerName/modelName missing"
              }
            ]
          }
        ]
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('interactionResult');
      response.headers.requestId.should.equal('FCDBB024-6785-4518-A27F-4593CCE0387B');
      interactionResultCount.should.equal(1)
    });
  });

  describe('integrationDeleted', function() {
    it('Should properly handle an integration delete request', async function() {
      schemaConnector.enableEventLogging()
      const response = await schemaConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "integrationDeleted",
          "requestId": "B30F2993-0BE4-464B-9506-1FF686072FA1"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "1xlHR91DyjUJBYsSAvxAw8AT"
        }
      });

      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('integrationDeleted');
      response.headers.requestId.should.equal('B30F2993-0BE4-464B-9506-1FF686072FA1');
    });
  });

  describe('handlerCallbackError', function() {
    it('Should handle thrown error', async function() {
      const response = await errorConnector.handleCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "discoveryRequest",
          "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        }
      });

      response.should.be.instanceOf(Error)
    });
  });

  describe('httpHandlerCallback', function() {
    it('Should return proper discovery response', async function() {
      const res = new HttpResponse()
      await schemaConnector.handleHttpCallback({
        body: {
          "headers": {
            "schema": "st-schema",
            "version": "1.0",
            "interactionType": "discoveryRequest",
            "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
          },
          "authentication": {
            "tokenType": "Bearer",
            "token": "ACCT-HCtR4Q"
          }
        }
      }, res);

      const response = res.data
      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('discoveryResponse');
      response.headers.requestId.should.equal('0edb967a-380e-4699-968e-64ea31cef618');

      response.should.have.property('devices');
      response.devices.length.should.equal(1);
      response.devices[0].externalDeviceId.should.equal('abcd');
      response.devices[0].friendlyName.should.equal('Test Switch 1');
      response.devices[0].deviceHandlerType.should.equal('c2c-switch');
    });

    it('Should handle error response', async function() {
      const res = new HttpResponse()
      await schemaConnector.handleHttpCallback(
        {body: {
            "headers": {
              "schema": "st-schema",
              "version": "1.0",
              "interactionType": "discoveryRequest",
              "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
            }
          }
        }, res);

      res.statusCode.should.equal(200)
      res.data.globalError.errorEnum.should.equal('BAD-REQUEST')
    });

    it('Should handle thrown error', async function() {
      const res = new HttpResponse()
      await errorConnector.handleHttpCallback(
        {body: {
            "headers": {
              "schema": "st-schema",
              "version": "1.0",
              "interactionType": "discoveryRequest",
              "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
            },
            "authentication": {
              "tokenType": "Bearer",
              "token": "ACCT-HCtR4Q"
            }
          }}, res);

      res.statusCode.should.equal(500)
    });

    it('Should handle empty request', async function() {
      const res = new HttpResponse()
      await schemaConnector.handleHttpCallback(
          {body: {}
          }, res);

      res.statusCode.should.equal(200)
      res.data.globalError.errorEnum.should.equal('BAD-REQUEST')
    });

    it('Should handle missing auth', async function() {
      const res = new HttpResponse()
      await schemaConnector.handleHttpCallback(
          {body: {
              "headers": {
                "schema": "st-schema",
                "version": "1.0",
                "interactionType": "discoveryRequest",
                "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
              }}
          }, res);

      res.statusCode.should.equal(200)
      res.data.globalError.errorEnum.should.equal('BAD-REQUEST')
    });
  });

  describe('lambdaHandlerCallback', function() {
    it('Should return proper discovery response', async function() {
      const context = new LambdaContext()
      await schemaConnector.handleLambdaCallback({
        "headers": {
          "schema": "st-schema",
          "version": "1.0",
          "interactionType": "discoveryRequest",
          "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
        },
        "authentication": {
          "tokenType": "Bearer",
          "token": "ACCT-HCtR4Q"
        }
      }, context);

      const response = context.success
      response.should.have.property('headers');
      response.headers.schema.should.equal('st-schema');
      response.headers.version.should.equal('1.0');
      response.headers.interactionType.should.equal('discoveryResponse');
      response.headers.requestId.should.equal('0edb967a-380e-4699-968e-64ea31cef618');

      response.should.have.property('devices');
      response.devices.length.should.equal(1);
      response.devices[0].externalDeviceId.should.equal('abcd');
      response.devices[0].friendlyName.should.equal('Test Switch 1');
      response.devices[0].deviceHandlerType.should.equal('c2c-switch');
    });

    it('Should handle error response', async function() {
      const context = new LambdaContext()
      await schemaConnector.handleLambdaCallback(
        {body: {
            "headers": {
              "schema": "st-schema",
              "version": "1.0",
              "interactionType": "discoveryRequest",
              "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
            }
          }
        }, context);

      context.should.haveOwnProperty('success')
      context.should.not.haveOwnProperty('failure')
    });

    it('Should handle thrown error', async function() {
      const context = new LambdaContext()
      await errorConnector.handleLambdaCallback(
        {body: {
            "headers": {
              "schema": "st-schema",
              "version": "1.0",
              "interactionType": "discoveryRequest",
              "requestId": "0edb967a-380e-4699-968e-64ea31cef618"
            },
            "authentication": {
              "tokenType": "Bearer",
              "token": "ACCT-HCtR4Q"
            }
          }}, context);

      context.should.haveOwnProperty('success')
      context.should.not.haveOwnProperty('failure')
    });
  });

});

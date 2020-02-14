# st-schema-nodejs
ST Schema helper library for NodeJS

## Installing the module
```
npm install st-schema
```

## Connector app structure
```javascript
const connector = new SchemaConnector()
  .discoveryHandler((accessToken, response) => {
    /**
     * Discovery request. Respond with a list of devices. Called after installation of the
     * connector and every six hours after that.
     * @accessToken External cloud access token
     * @response {DiscoveryResponse} Discovery response object
     */
  })
  .stateRefreshHandler((accessToken, response) => {
    /**
     * State refresh request. Respond with the current states of all devices. Called after
     * device discovery runs.
     * @accessToken External cloud access token
     * @response {StateRefreshResponse} StateRefresh response object
     */
  })
  .commandHandler((accessToken, response, devices) => {
    /**
     * Device command request. Control the devices and respond with new device states
     * @accessToken External cloud access token
     * @response {CommandResponse} CommandResponse response object
     * @devices {array} List of ST device commands
     */
  })
  .callbackAccessHandler((accessToken, callbackAuthentication, callbackUrls) => {
    /**
     * Create access and refresh tokens to allow SmartThings to be informed of device state
     * changes as they happen. 
     * @accessToken External cloud access token
     * @callbackAuthentication ST access and refresh tokens for proactive state callbacks
     * @callbackUrls Callback and refresh token URLs
     */
  })
  .integrationDeletedHandler(accessToken => {
    /**
     * Called when the connector is removed from SmartThings. You may want clean up access
     * tokens and other data when that happend.
     * @accessToken External cloud access token
     */
  });

```

## Minimal loopback connector example
This simple connector creates a one dimmer device named _Test Dimmer_. There's no physical
device involved. The connector command handler simply returns the state value corresponding to 
the issued command. The current state of the device is stored in memory, so if the server
is restarted the states will revert to their initial value. This implementation does not 
implement proactive state callbacks.

#### connector.js
```javascript
const {SchemaConnector, DeviceErrorTypes} = require('st-schema')
const deviceStates = { switch: 'off', level: 100}
const connector = new SchemaConnector()
  .discoveryHandler((accessToken, response) => {
    response.addDevice('external-device-1', 'Test Dimmer', 'c2c-dimmer')
      .manufacturerName('Example Connector')
      .modelName('Virtual Dimmer');
  })
  .stateRefreshHandler((accessToken, response) => {
    response.addDevice('external-device-1', [
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: deviceStates.switch
      },
      {
        component: 'main',
        capability: 'st.switchLevel',
        attribute: 'level',
        value: deviceStates.level
      }
    ])
  })
  .commandHandler((accessToken, response, devices) => {
    for (const device of devices) {
      const deviceResponse = response.addDevice(device.externalDeviceId);
      for (cmd of device.commands) {
        const state = {
          component: cmd.component,
          capability: cmd.capability
        };
        if (cmd.capability === 'st.switchLevel' && cmd.command === 'setLevel') {
          state.attribute = 'level';
          state.value = deviceStates.level = cmd.arguments[0];
          deviceResponse.addState(state);

        } else if (cmd.capability === 'st.switch') {
          state.attribute = 'switch';
          state.value = deviceStates.switch = cmd.command === 'on' ? 'on' : 'off';
          deviceResponse.addState(state);

        } else {
          deviceResponse.setError(
            `Command '${cmd.command} of capability '${cmd.capability}' not supported`,
            DeviceErrorTypes.CAPABILITY_NOT_SUPPORTED)
        }
      }
    }
  });

module.exports = connector
```
  
## Running as a web-service
To run the above connector as a web service using the _Express_ framework create a server
like this one. Note that a real application would need to validate the access token 
passed in each request. This example only checks for the presence of the token.

#### server.js
```javascript
const express = require('express');
const connector = require('./connector');
const server = express();
const port = 3000;
server.use(express.json());

server.post('/', (req, res) => {
  if (accessTokenIsValid(req)) {
    connector.handleHttpCallback(req, res)
  }
});

function accessTokenIsValid(req) {
  // Replace with proper validation of issued access token
  if (req.body.authentication.token) {
    return true;
  }
  res.status(401).send('Unauthorized')
  return false;
}

server.listen(port);
console.log(`Server listening on http://127.0.0.1:${port}`);
```

## Running as an AWS Lambda

To run the connector as an AWS lambda use a handler like this one.

#### index.js
```javascript
const connector = require('./connector');
exports.handle = async (evt, context, callback) => {
    return connector.handleLambdaCallback(evt, context, callback);
};
```

## Proactive state callbacks

Sensors and devices that can be controlled other than through the SmartThings mobile app can change state at any time.
To ensure that the SmartThings platform is made aware of these state changes right away callsbacks can be implemented
to call into the SmartThings cloud. These callbacks are secured via a token exchange dependent on the client ID
and secret defined for the ST Schema connector in the Developer Workspace. The following example is a
minimal implementation of a connector that supports these callback. It builds on the previous example by implementing
the callbacks and exposing a web-service endpoint for executing device commands.

#### app.js

The connector app is now initialized with the ST Schema connector's client ID and secret, which are available from
the Developer workspace. It also declares an `accessTokens` map to contain the list of connectors that need to be
called when device state changes. Note that this simple implementation stores the connectors in memory, so restarting
the server will cause them to be lost. The app also has new `callbackAccessHandler` and `integrationDeletedHandler`
handlers defined to add and remove entries from the `accessTokens` map.
```javascript
const {SchemaConnector} = require('st-schema');
const deviceStates = {switch: 'off', level: 100};
const accessTokens = {};
const connector = new SchemaConnector()
  .clientId(process.env.ST_CLIENT_ID)
  .clientSecret(process.env.ST_CLIENT_SECRET)
  .discoveryHandler((accessToken, response) => {
    response.addDevice('external-device-1', 'Test Dimmer', 'c2c-dimmer')
      .manufacturerName('Example Connector')
      .modelName('Virtual Dimmer');
  })
  .stateRefreshHandler((accessToken, response) => {
    response.addDevice('external-device-1', [
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: deviceStates.switch
      },
      {
        component: 'main',
        capability: 'st.switchLevel',
        attribute: 'level',
        value: deviceStates.level
      }
    ])
  })
  .commandHandler((accessToken, response, devices) => {
    for (const device of devices) {
      const deviceResponse = response.addDevice(device.externalDeviceId);
      for (cmd of device.commands) {
        const state = {
          component: cmd.component,
          capability: cmd.capability
        };
        if (cmd.capability === 'st.switchLevel' && cmd.command === 'setLevel') {
          state.attribute = 'level';
          state.value = deviceStates.level = cmd.arguments[0];
          deviceResponse.addState(state);

        } else if (cmd.capability === 'st.switch') {
          state.attribute = 'switch';
          state.value = deviceStates.switch = cmd.command === 'on' ? 'on' : 'off';
          deviceResponse.addState(state);

        } else {
          deviceResponse.setError(
            `Command '${cmd.command} of capability '${cmd.capability}' not supported`,
            DeviceErrorTypes.CAPABILITY_NOT_SUPPORTED)
        }
      }
    }
  })
  .callbackAccessHandler((accessToken, callbackAuthentication, callbackUrls) => {
    accessTokens[accessToken] = {
      callbackAuthentication,
      callbackUrls
    }
  })

  .integrationDeletedHandler(accessToken => {
    delete accessTokens[accessToken]
  });

module.exports = {
  connector: connector,
  deviceStates: deviceStates,
  accessTokens: accessTokens
};

```

#### server.js

The web server is modified to add a new `/command` endpoint for turning on and off the switch. It expects
a JSON body of the form `{"attribute": "switch", "value": "on"}`. 

```javascript
"use strict";
require('dotenv').config();
const express = require('express');
const {StateUpdateRequest} = require('st-schema');
const {connector, deviceStates, accessTokens} = require('./app');
const server = express();
const port = 3001;
server.use(express.json());

server.post('/', (req, res) => {
  if (accessTokenIsValid(req)) {
    connector.handleHttpCallback(req, res)
  }
});

server.post('/command', (req, res) => {
  deviceStates[req.body.attribute] = req.body.value;
  for (const accessToken of Object.keys(accessTokens)) {
    const item = accessTokens[accessToken];
    const updateRequest = new StateUpdateRequest(process.env.ST_CLIENT_ID, process.env.ST_CLIENT_SECRET);
    const deviceState = [
      {
        externalDeviceId: 'external-device-1',
        states: [
          {
            component: 'main',
            capability: req.body.attribute === 'level' ? 'st.switchLevel' : 'st.switch',
            attribute: req.body.attribute,
            value: req.body.value
          }
        ]
      }
    ];
    updateRequest.updateState(item.callbackUrls, item.callbackAuthentication, deviceState)
  }
  res.send({});
  res.end()
});


function accessTokenIsValid(req) {
  // Replace with proper validation of issued access token
  if (req.body.authentication && req.body.authentication.token) {
    return true;
  }
  res.status(401).send('Unauthorized');
  return false;
}

server.listen(port);
console.log(`Server listening on http://127.0.0.1:${port}`);
```

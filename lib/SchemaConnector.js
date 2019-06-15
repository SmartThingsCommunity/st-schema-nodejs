'use strict';

const DiscoveryResponse = require("./discovery/DiscoveryResponse");
const StateRefreshResponse = require("./state/StateRefreshResponse");
const CommandResponse = require("./state/CommandResponse");
const AccessTokenRequest = require("./callbacks/AccessTokenRequest");
const ErrorResponse = require('./ErrorResponse');
const STBase = require('./STBase');

module.exports = class SchemaConnector {

  constructor(options = {}) {
    this._clientId = options.clientId;
    this._clientSecret = options.clientId;

    this._discoveryHandler = ((response, data) => {
      console.log('discoverDevices not defined')
    });

    this._stateRefreshHandler = ((response, data) => {
      console.log('stateRefreshHandler not defined')
    });

    this._commandHandler = ((response, data) => {
      console.log('commandHandler not defined')
    });

    this._callbackAccessHandler = null;

    this._integrationDeletedHandler = (data => {
      console.log('integrationDeletedHandler not defined')
    })
  }

  /**
   * Set your smartapp automation's client id. Cannot be
   * acquired until your app has been created through the
   * Developer Workspace.
   * @param {String} id
   * @returns {SchemaConnector} SchemaConnector instance
   */
  clientId(id) {
    this._clientId = id;
    return this
  }

  /**
   * Set your smartapp automation's client secret. Cannot be
   * acquired until your app has been created through the
   * Developer Workspace. This secret should never be shared
   * or committed into a public repository.
   * @param {String} secret
   * @returns {SchemaConnector} SmartApp instance
   */
  clientSecret(secret) {
    this._clientSecret = secret;
    return this
  }

  /**
   * Sets the discovery request handler
   */
  discoveryHandler(callback) {
    this._discoveryHandler = callback;
    return this
  }

  /**
   * Sets the state refresh request handler
   */
  stateRefreshHandler(callback) {
    this._stateRefreshHandler = callback;
    return this
  }

  /**
   * Sets the command request handler
   */
  commandHandler(callback) {
    this._commandHandler = callback;
    return this
  }

  /**
   * Sets the grant callback access handler
   */
  callbackAccessHandler(callback) {
    this._callbackAccessHandler = callback;
    return this
  }

  /**
   * Sets integration deleted handler
   */
  integrationDeletedHandler(callback) {
    this._integrationDeletedHandler = callback;
    return this
  }

  /**
   * Provide a custom context store used for storing in-flight credentials
   * for each installed instance of the app.
   *
   * @param {*} value
   * @example Use the AWS DynamoDB plugin
   * smartapp.contextStore(new DynamoDBSchemaCallbackStore('aws-region', 'app-table-name'))
   * @example
   * // Use Firebase Cloud Firestore
   * smartapp.contextStore(new FirestoreDBContextStore(firebaseServiceAccount, 'app-table-name'))
   * @returns {SchemaConnector} SmartApp instance
   */
  callbackStore(value) {
    this._contextStore = value;
    return this
  }

  manufacturerName(value) {
    this._manufacturerName = value;
    return this
  }

  enableEventLogging(jsonSpace = null, enableEvents = true) {
    this._enableEventLogging = enableEvents;
    this._eventLoggingSpace = jsonSpace;
    return this
  }

  /**
   * Use with an AWS Lambda function. No signature verification is required.
   *
   * @param {*} event
   * @param {*} context
   */
  async handleLambdaCallback(event, context) {
    try {
      const response = await this._handleCallback(event);
      if (response.isError()) {
        console.log("ERROR: %j", err);
        return context.fail(response)
      }
      else {
        return context.succeed(response);
      }
    }
    catch (err) {
      console.log("ERROR: %j", err);
      return context.fail(err)
    }
  }

  /**
   * Use with a standard HTTP webhook endpoint app. Signature verification is required.
   *
   * @param {*} req
   * @param {*} res
   */
  async handleHttpCallback(req, res) {
    try {
      const response = await this._handleCallback(req.body);
      if (response.isError()) {
        console.log("ERROR: %j", response);
        res.status(500).send(response)
      }
      else {
        res.send(response)
      }
    }
    catch (err) {
      console.log("ERROR: %j", err);
      res.status(500).send(err)
    }
  }

  async handleMockCallback(body) {
    try {
      return await this._handleCallback(body)
    }
    catch (err) {
      return err;
    }
  }

  async _handleCallback(body) {
    if (this._enableEventLogging) {
      console.log(`REQUEST ${JSON.stringify(body, null, this._eventLoggingSpace)}`)
    }
    if (body.headers) {
      let response;
      switch (body.headers.interactionType) {
        case "discoveryRequest":
          response = new DiscoveryResponse(body.headers.requestId);
          await this._discoveryHandler(body.authentication.token, response, body);
          break;

        case "commandRequest":
          response = new CommandResponse(body.headers.requestId);
          await this._commandHandler(body.authentication.token, response, body.devices, body);
          break;

        case "stateRefreshRequest":
          response = new StateRefreshResponse(body.headers.requestId);
          await this._stateRefreshHandler(body.authentication.token, response, body);
          break;

        case "grantCallbackAccess":
          response = new STBase(body.headers.requestId);
          if (this._callbackAccessHandler) {
            if (body.callbackAuthentication.clientId === this._clientId ) {

              const grantResponse = await (
                new AccessTokenRequest(
                  this._clientId,
                  this._clientSecret,
                  body.headers.requestId
                ).getCallbackToken(
                  body.callbackUrls.oauthToken,
                  body.callbackAuthentication.code
                )
              );

              await this._callbackAccessHandler(body.authentication.token, grantResponse.callbackAuthentication, body.callbackUrls, body)
            }
            else {
              response = new ErrorResponse().setError('Invalid client ID');
            }
          }
          break;

        case "integrationDeleted":
          response = new STBase(body.headers.requestId);
          await this._integrationDeletedHandler(body.authentication.token, body);
          break;

        default:
          response = new ErrorResponse().setError(`Unsupported interactionType: ${body.headers.interactionType}`);
          break;
      }

      if (this._enableEventLogging) {
        console.log(`RESPONSE ${JSON.stringify(response, null, this._eventLoggingSpace)}`)
      }

      return response;
    }
    else {
      return new ErrorResponse().setError(`Invalid ST Schema request. No 'headers' field present.`);
    }
  }
};

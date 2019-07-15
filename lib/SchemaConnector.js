'use strict';

const DiscoveryResponse = require("./discovery/DiscoveryResponse");
const StateRefreshResponse = require("./state/StateRefreshResponse");
const CommandResponse = require("./state/CommandResponse");
const AccessTokenRequest = require("./callbacks/AccessTokenRequest");
const STBase = require('./STBase');
const GlobalErrorTypes = require('./errors/global-error-types');

const clientId = Symbol('private)');
const clientSecret = Symbol('private)');
const discoveryHandler = Symbol('private)');
const stateRefreshHandler = Symbol('private)');
const commandHandler = Symbol('private)');
const callbackAccessHandler = Symbol('private)');
const integrationDeletedHandler = Symbol('private)');
const enableEventLogging = Symbol('private');
const eventLoggingSpace = Symbol('private');
const handleCallback = Symbol('private');

module.exports = class SchemaConnector {

  constructor(options = {}) {
    this[clientId] = options.clientId;
    this[clientSecret] = options.clientId;

    this[discoveryHandler] = ((response, data) => {
      console.log('discoverDevices not defined')
    });

    this[stateRefreshHandler] = ((response, data) => {
      console.log('stateRefreshHandler not defined')
    });

    this[commandHandler] = ((response, data) => {
      console.log('commandHandler not defined')
    });

    this[callbackAccessHandler] = null;

    this[integrationDeletedHandler] = (data => {
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
    this[clientId] = id;
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
    this[clientSecret] = secret;
    return this
  }

  /**
   * Sets the discovery request handler
   */
  discoveryHandler(callback) {
    this[discoveryHandler] = callback;
    return this
  }

  /**
   * Sets the state refresh request handler
   */
  stateRefreshHandler(callback) {
    this[stateRefreshHandler] = callback;
    return this
  }

  /**
   * Sets the command request handler
   */
  commandHandler(callback) {
    this[commandHandler] = callback;
    return this
  }

  /**
   * Sets the grant callback access handler
   */
  callbackAccessHandler(callback) {
    this[callbackAccessHandler] = callback;
    return this
  }

  /**
   * Sets integration deleted handler
   */
  integrationDeletedHandler(callback) {
    this[integrationDeletedHandler] = callback;
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
    this[contextStore] = value;
    return this
  }

  enableEventLogging(jsonSpace = null, enableEvents = true) {
    this[enableEventLogging] = enableEvents;
    this[eventLoggingSpace] = jsonSpace;
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
      const response = await this[handleCallback](event);
      if (response.isError()) {
        console.log("ERROR: %j", err);
        return context.fail(response)
      }
      else {
        return context.succeed(response);
      }
    }
    catch (err) {
      console.log("ERROR: %s", err.stack || err);
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
      const response = await this[handleCallback](req.body);
      if (response.isError()) {
        console.log("ERROR: %j", response);
        res.status(500).send(response)
      }
      else {
        res.send(response)
      }
    }
    catch (err) {
      console.log("ERROR: %s", err.stack || err);
      res.status(500).send(err)
    }
  }

  async handleCallback(body) {
    try {
      return await this[handleCallback](body)
    }
    catch (err) {
      return err;
    }
  }

  async [handleCallback](body) {
    if (this[enableEventLogging]) {
      console.log(`REQUEST ${JSON.stringify(body, null, this[eventLoggingSpace])}`)
    }

    if (!body.headers) {
      return new STBase('missingHeader', 'unavailable').setError(
        `Invalid ST Schema request. No 'headers' field present.`,
        GlobalErrorTypes.BAD_REQUEST);
    }

    let response;
    switch (body.headers.interactionType) {
      case "discoveryRequest":
        response = new DiscoveryResponse(body.headers.requestId);
        await this[discoveryHandler](body.authentication.token, response, body);
        break;

      case "commandRequest":
        response = new CommandResponse(body.headers.requestId);
        await this[commandHandler](body.authentication.token, response, body.devices, body);
        break;

      case "stateRefreshRequest":
        response = new StateRefreshResponse(body.headers.requestId);
        await this[stateRefreshHandler](body.authentication.token, response, body);
        break;

      case "grantCallbackAccess":
        response = new STBase(body.headers.interactionType, body.headers.requestId);
        if (this[callbackAccessHandler]) {
          if (body.callbackAuthentication.clientId === this[clientId] ) {

            const tokenRequest = new AccessTokenRequest(
              this[clientId],
              this[clientSecret],
              body.headers.requestId
            );

            const tokenResponse = await tokenRequest.getCallbackToken(
              body.callbackUrls.oauthToken,
              body.callbackAuthentication.code
            );

            await this[callbackAccessHandler](body.authentication.token, tokenResponse.callbackAuthentication, body.callbackUrls, body)
          }
          else {
            response = new STBase(body.headers.interactionType, body.headers.requestId)
              .setError(`Client ID ${body.callbackAuthentication.clientId} is invalid`, GlobalErrorTypes.INVALID_CLIENT);
          }
        }
        break;

      case "integrationDeleted":
        response = new STBase(body.headers.interactionType, body.headers.requestId);
        await this[integrationDeletedHandler](body.authentication.token, body);
        break;

      default:
        response = new STBase(body.headers.interactionType, body.headers.requestId).setError(
          `Unsupported interactionType: '${body.headers.interactionType}'`,
          GlobalErrorTypes.INVALID_INTERACTION_TYPE);

        break;
    }

    if (this[enableEventLogging]) {
      console.log(`RESPONSE ${JSON.stringify(response, null, this[eventLoggingSpace])}`)
    }

    return response;
  }
};

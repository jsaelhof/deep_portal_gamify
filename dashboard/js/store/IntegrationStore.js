var EventDispatcher = require('../dispatcher/EventDispatcher');

var events = EventDispatcher.hashFromArray( [
    'UserIntegrationInfo'
] );

var IntegrationStore = EventDispatcher.createDispatcher(module.exports, events);

IntegrationStore.getUserIntegrationInfo = function () {
    var rpcRequestParams = { "desc":"Script Tag Token", "type":"SCRIPT_TAG" };
    sendRequest('user/app-key/get-or-create', rpcRequestParams, events.UserIntegrationInfo);
};

/**
 * Private method, Generic Send Request for all UserStore requests
 */
var sendRequest = function (method, requestParams, requestEvent) {
    var onSuccessResponse = function (responseData) {
        // Notify that the request was responded to successfully
        IntegrationStore.dispatchEvent(requestEvent, {
            response: responseData
        });
    };

    portalConnection.sendImmediate( { 
        method: method, 
        params: requestParams, 
        onSuccess: onSuccessResponse 
    } );
};
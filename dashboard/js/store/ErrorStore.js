import EventDispatcher from '../dispatcher/EventDispatcher';
import i18n from '../store/i18nStore';

let _events = EventDispatcher.hashFromArray( [
    'Error',
    'ClearErrors'
] );

let codes = {
    unknown: "0000",
    rpcResponseError: "0001",
    externalError: "0002"
}

let defaultUserTitle = "Something went wrong\u00A0\u00A0: (";
let defaultUserMessage = "We've deployed our engineers to take a look.\nYou can return to the dashboard and try again or send us a message to let us know.";
let defaultDevMessage = "Unhandled Error";
let defaultCode = codes.unknown;
let errors = [];

var ErrorStore = EventDispatcher.createDispatcher( module.exports, _events );

ErrorStore.setError = function ( dev, code, data, userMessage, userTitle, flags ) {
    // Flags are additional configuration for the error that would become cumbersome as individual arguments because they would only be applicable in certain situations. If none are passed in, just use an empty set.
    flags = flags || {};

    let errorData = { 
        userTitle: userTitle || defaultUserTitle,
        userMessage: userMessage || defaultUserMessage,
        devMessage: dev || defaultDevMessage,
        data: data,
        code: code || defaultCode,
        timestamp: Date.now(),
        flags: flags
    };      

    errors.push( errorData );

    ErrorStore.dispatchEvent( _events.Error , errorData );

    return errorData;
}

ErrorStore.getFirstError = function () {
    return (errors.length) ? errors[0] : null;
};

ErrorStore.clear = function () {
    errors = [];
    ErrorStore.dispatchEvent( _events.ClearErrors );
}

ErrorStore.rpcResponseError = function ( response ) {
    // This check is here in case the code passes in the body that contains the response instead of just the response value itself.
    if (response.response) response = response.response;

    let devMessage = "Unknown Error";
    let userMessage;
    let userTitle;

    if (response.errors) {
        if (response.errors.application_error) {
            switch (response.errors.application_error.errorCode ) {
                case "error_campaign_version_mismatch":
                    userTitle = "We're sorry, your campaign could not be updated.\u00A0\u00A0: ("
                    userMessage = "A problem occurred while updating your campaign.\nRefreshing your browser and trying again should fix it. We apologize for the inconvenience."
                    break;
            }
            devMessage = response.errors.application_error.errorCode + " - " + response.errors.application_error.message;
        } else if ( response.errors.validation_errors ) {
            devMessage = response.errors.validation_errors[0].message || JSON.stringify(response.errors.validation_errors[0]);
        } else {
            devMessage = JSON.stringify(response.errors);
        }
    }

    return ErrorStore.setError( devMessage, codes.rpcResponseError, response, userMessage, userTitle );
}

ErrorStore.externalError = function ( errorString, data ) {
    let userMessage = i18n.stringFor( errorString, "error_desc" );

    // If the user message returned is just the same string we inputted, then it wasn't found. Set the userMessage to undefined so that the default user message is shown.
    if (userMessage === errorString) userMessage = undefined;
    
    return this.setError( errorString, codes.externalError, data, userMessage, undefined, { hideDashboardButton: true } );
}
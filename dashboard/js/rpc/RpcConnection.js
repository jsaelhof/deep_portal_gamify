import GUID from '../util/guid';
import Queue from './Queue';
import EventDispatcher from '../dispatcher/EventDispatcher';
import $ from 'jquery';

let HEADERS_KEY = 'rpcHeaders';
let failedRequests = [];

let buildRequestURL = ( base, method ) => {
    return base.replace( /\/$/g, '' ) + '/' + method.replace( /^\/|\/$/g, '' );
};

function RpcConnection ( baseURL ) {
    this._defaultBaseURL = baseURL;
    this._queue = new Queue();

    EventDispatcher.createDispatcher( this, [
        'RequestSent',
        'HeadersUpdated',
        'UncaughtException',
        'ResponseReceived',
        'AjaxError',
        'RequestDone'
    ] );
}

RpcConnection.prototype.setHeaders = function ( headers ) {
    localStorage[ HEADERS_KEY ] = JSON.stringify( headers );
};

RpcConnection.prototype.setHeader = function ( key, value ) {
    let headers = this.getHeaders();
    headers[ key ] = value;
    this.setHeaders( headers );
    this.dispatchHeadersUpdated( { headers: this.getHeaders() } );
};

RpcConnection.prototype.deleteHeaders = function () {
    this.setHeaders( {} );
    this.dispatchHeadersUpdated( { headers: this.getHeaders() } );
};

RpcConnection.prototype.deleteHeader = function ( key ) {
    var headers = this.getHeaders();
    delete headers[ key ];
    this.setHeaders( headers );
    this.dispatchHeadersUpdated( { headers: this.getHeaders() } );
};

RpcConnection.prototype.getHeaders = function () {
    try {
        return JSON.parse( localStorage[ HEADERS_KEY ] );
    } catch ( e ) {
        return {};
    }
};

RpcConnection.prototype.setHeaderKey = function ( key ) {
    HEADERS_KEY = key + 'Headers';
};

// See sendImmediate for paramObject structure
RpcConnection.prototype.send = function ( paramObject ) {
    this._queue.execute( this.sendImmediate.bind( this, paramObject ) );
};

RpcConnection.prototype.checkSessionValid = function ( response ) {
    return !( response.hasFieldError( [ 'session-token', 'request' ] ) );
};

RpcConnection.prototype.executeFailedRequests = function () {
    failedRequests.forEach( function ( req ) { 
        this._queue.execute( req ); 
    }, this );
    failedRequests = [];
};

// paramObject: An object containing any parameters required for the request. 
// Given the large and potentially growing number of arguments, it's become difficult to use individual arguments as many need to be set as undefined if oyu don't need them.
// Instead, a params object is used with the following format. Simply remove any keys that aren't needed (except method which is required)
// {
//     method: <string> Path to the endpoint
//     params: <object> The parameters to be included with the request
//     onSuccess: <function ( rpcResponse )> Function to execute on success
//     onError: <function ( xhr, status, error )> Function to execute on error
//     onUploadProgress: <function ( percentComplete, loaded, total )> Function to execute during upload progress (send)
//     onDownloadProgress: <function ( percentComplete, loaded, total )> Function to execute during download progress (receive)
//     removeHeaders: <boolean> Not sure this is ever used.
// }
/**
 * 
 * @param {*} paramObject An object containing any parameters required for the request. 
 * Given the large and potentially growing number of arguments, it's become difficult to use individual arguments as many need to be set as undefined if oyu don't need them.
 * Instead, a params object is used with the following format. Simply remove any keys that aren't needed (except method which is required)
 * {
 *     method: <string> Path to the endpoint
 *     params: <object> The parameters to be included with the request
 *     onSuccess: <function ( rpcResponse )> Function to execute on success
 *     onError: <function ( xhr, status, error )> Function to execute on error
 *     onUploadProgress: <function ( percentComplete, loaded, total )> Function to execute during upload progress (send)
 *     onDownloadProgress: <function ( percentComplete, loaded, total )> Function to execute during download progress (receive)
 *     removeHeaders: <boolean> Not sure this is ever used.
 * }
 */
RpcConnection.prototype.sendImmediate = function ( paramObject ) {
    let rpcRequestURL = buildRequestURL( this._defaultBaseURL, paramObject.method );
    let rpcGUID = GUID.guid();
    let rpcRequest = {
        'id': rpcGUID,
        'method': paramObject.method,
        'params': paramObject.params
    };

    if ( !paramObject.removeHeaders ) { rpcRequest.headers = this.getHeaders(); }

    let rpcRequestString = JSON.stringify( rpcRequest, null, 4 );

    this.dispatchRequestSent( { request: rpcRequest } );

    $.ajax( {
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        url: rpcRequestURL,
        data: rpcRequestString,
        xhr: function() {
            var xhr = new window.XMLHttpRequest();
            //Upload progress
            xhr.upload.addEventListener("progress", function(event){
                if (event.lengthComputable) {
                    var percentComplete = event.loaded / event.total;
                    if (paramObject.onUploadProgress) paramObject.onUploadProgress( percentComplete, event.loaded, event.total );
                } else {
                    if (paramObject.onUploadProgress) paramObject.onUploadProgress( null, null, null );
                }
            }, false);
            //Download progress
            xhr.addEventListener("progress", function(event){
                if (event.lengthComputable) {
                    var percentComplete = event.loaded / event.total;
                    if (paramObject.onDownloadProgress) paramObject.onDownloadProgress( percentComplete, event.loaded, event.total );
                }
            }, false);
            return xhr;
        },
        success: function ( rpcResponse ) {

            if ( 'headers' in rpcResponse ) {
                this.setHeaders( rpcResponse.headers );
                this.dispatchHeadersUpdated( { headers: rpcResponse.headers } );
            }

            mixinHelperFunctions( rpcResponse );

            if ( !this.checkSessionValid( rpcResponse ) ) {
                this.setHeaders( {} );
                this.dispatchHeadersUpdated( { headers: {} } );

                if ( [ '/user/token-auth', 'user/login' ].indexOf( paramObject.method ) === -1 ) { // don't resend login or token-auth reqs
                    failedRequests.push( this.sendImmediate.bind( this, paramObject ) );
                }
            }

            // HandleOwnError is a bit of a hack i put in. The global handler always pops up the temp tech difficulties box if there's an error regardless of whether the code wants to handle it
            // So i added this flag in tp tell the gobal handler to skip it because the code initiating the request is going to display the error itself.
            let responseEvent = { request: rpcRequest, response: rpcResponse, handleOwnError: paramObject.handleOwnError };

            if ( rpcResponse.hasUncaughtException() ) {
                this.dispatchUncaughtException( responseEvent );
            }

            this.dispatchResponseReceived( responseEvent );
            this.dispatchRequestDone( responseEvent );
            if ( paramObject.onSuccess ) paramObject.onSuccess( rpcResponse );
        }.bind( this ),
        error: function ( xhr, status, error ) {
            let response = { xhr: xhr, status: status, error: error };
            let responseEvent = { request: rpcRequest, response: response };

            mixinHelperFunctions( response );

            this.dispatchAjaxError( responseEvent );

            if ( paramObject.onError ) { paramObject.onError( xhr, status, error ); }

            this.dispatchRequestDone( responseEvent );
        }.bind( this )
    } );
};

let hasErrorsPartial = function () {
    return ( this.errors );
};

let hasAjaxError = function () {
    return ( this.status === 'error' );
};

let hasValidationErrorsPartial = function () {
    return ( this.errors && this.errors.validation_errors );
};

let hasFieldError = function ( fields ) {
    if ( !fields ) { fields = []; }
    if ( !Array.isArray( fields ) ) { fields = [ fields ]; }

    return this.hasValidationErrors() ? this.errors.validation_errors.filter( ( e ) => fields.indexOf( e.field ) !== -1 ).length > 0 : false;
};

let hasUncaughtExceptionPartial = function () {
    return ( this.errors && this.errors.uncaught_exception );
};

let hasApplicationError = function () {
    return this.errors && this.errors.application_error;
};

function mixinHelperFunctions ( rpcResponse ) {
    rpcResponse.hasErrors = hasErrorsPartial.bind( rpcResponse );
    rpcResponse.hasValidationErrors = hasValidationErrorsPartial.bind( rpcResponse );
    rpcResponse.hasUncaughtException = hasUncaughtExceptionPartial.bind( rpcResponse );
    rpcResponse.hasAjaxError = hasAjaxError.bind( rpcResponse );
    rpcResponse.hasFieldError = hasFieldError.bind( rpcResponse );
    rpcResponse.hasApplicationError = hasApplicationError.bind( rpcResponse );
}

RpcConnection.prototype.mockValidResponse = function () {
    return {
        hasErrors: function () {
            return false;
        },
        hasAjaxError: function () {
            return false;
        },
        hasValidationErrors: function () {
            return false;
        },
        hasUncaughtException: function () {
            return false;
        },
        hasApplicationError: function () {
            return false
        },
        result: {}
    };
};

RpcConnection.prototype.ajax = function ( req ) {
    var x = new XMLHttpRequest();

    x.open( req.type || 'POST', req.url, true );

    x.onreadystatechange = () => {
        if ( x.readyState === XMLHttpRequest.DONE ) {
            if ( x.status === 200 ) {
                let response = x.response;
                if ( req.dataType && req.dataType === 'json' ) {
                    response = JSON.parse( response );
                }
                req.success( response );
            } else {
                let response = x.response;
                if ( req.dataType && req.dataType === 'json' ) {
                    try {
                        response = JSON.parse( response );
                    } catch ( e ) {

                    }
                }
                req.error( response );
            }
        }
    };

    x.setRequestHeader( 'Content-Type', req.contentType || 'application/json' );
    x.setRequestHeader( 'Data-Type', req.dataType || 'json' );
    x.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    x.setRequestHeader( 'Accept', 'application/json, text/javascript, */*; q=0.01' );

    let data = req.data || JSON.stringify( {} );

    x.send( data );
};

module.exports = RpcConnection;
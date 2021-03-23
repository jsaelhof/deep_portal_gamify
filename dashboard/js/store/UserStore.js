var $               = require('jquery');
var _               = require('underscore');
var EventDispatcher = require('../dispatcher/EventDispatcher');
var LiveChat        = require( '../components/common/LiveChat.jsx' );
var i18n            = require( './i18nStore' );
var Utils           = require( '../components/gamify/util/GeneralUtils' );
var ConfigStore     = require('./ConfigStore');
var ErrorStore      = require('./ErrorStore');

var userState = {};
var subscriptionList = [];
var subscriptionPlanList;

let subscriptionFeatures = {
    "TIER_1": {
        "slideout": [
            "activate"
        ],
        "social": [
            "activate"
        ],
        "emailbanner": [
            "activate"
        ],
        "survey": [
            "activate"
        ]
    }
}

var events = EventDispatcher.hashFromArray( [
    'UserAuthenticated',
    'UserRegistered',
    'UserTokenAuthenticated',
    'UserUpdatePassword',
    'UserResetPassword',
    'UserUpdateInfo',
    'RequestLogin',
    'SubscriptionPlanListRetrieved',
    'SubscriptionListRetrieved',
    'SubscriptionCanceled',
    'SubscriptionAuthorized',
    'InquireSubscription',
    'CreateSubscription',
    'SubscriptionExecuted',
    'LeadListRetrieved',
    'DeleteLead',
    'LeadExport',
    'CardList',
    'AddCard'
] );

var UserStore = EventDispatcher.createDispatcher(module.exports, events);

UserStore.getImmutableState = function () {
    return JSON.clone( userState );
};

UserStore.hasMessage = function ( messageId ) {
    return (userState.userDetails && userState.userDetails.messages && userState.userDetails.messages[messageId] !== undefined);
}

UserStore.getMessage = function ( messageId ) {
    if (UserStore.hasMessage(messageId)) {
        return userState.userDetails.messages[messageId];
    } else {
        return undefined;
    }
}

UserStore.getMessages = function () {
    // Check if the server has left any messages in the user object telling us to do something.
    if (userState.userDetails && userState.userDetails.messages) {
        return userState.userDetails.messages;
    } else {
        return {};
    }
}

UserStore.removeMessage = function ( messageId ) {
    // Make sure it has messages and contains this message id.
    // If so, delete it and update the server
    // If not, there's nothing to do.
    if (UserStore.hasMessage(messageId)) {
        // Create an update for the user details with a copy of the messages
        let update = {
            messages: {...userState.messages}
        }

        // delete the message
        delete update.messages[messageId];

        // Send the update
        UserStore.sendUpdateUser( update );

        return true;
    } else {
        return false;
    }
}

function findMatch ( key, obj ) {
    return Object.keys( obj ).filter( k => ( k.toLowerCase() + '' ) === ( key.toLowerCase() + '' ) )[ 0 ];
}

function getAddresses () {
    let keys = Object.keys( userState.userDetails ).filter( k => k.toLowerCase().indexOf( 'address' ) !== -1 );//.map( k => userState.userDetails[ k ] );
    let res = {};
    keys.forEach( (k) => {
        if (userState.userDetails[k] instanceof String) {
            res[ k ] = JSON.parse( userState.userDetails[ k ] ) 
        }else {
            res[ k ] = userState.userDetails[ k ];
        }
    } );
    return res;
}

UserStore.fillAddress = function ( data, type ) {
    let response = {};
    let addresses = getAddresses(); //userState.userDetails.address || {};
    let types = Object.keys( addresses ) || [];
    let address = {};

    _.forEach( data, ( value, key ) => {
        if ( userState.userDetails[ key ] ) {
            response[ key ] = userState.userDetails[ key ] + '';
        } else if ( findMatch( key, userState.userDetails ) ) {
            response[ key ] = userState.userDetails[ findMatch( key, userState.userDetails ) ];
        } else {
            response[ key ] = value;
        }
    } );

    if ( addresses && types.length ) {
        if ( types.indexOf( type ) !== -1 ) {
            address = addresses[ type ];
        } else {
            address = addresses[ types[ 0 ] ];
        }

        if ( address ) {
            _.forEach( data, ( value, key ) => { if ( address[ key ] ) { response[ key ] = address[ key ]; } } );
        }
    }

    return response;
};

UserStore.updateAddress = function ( data, type, onSuccess ) {

    // Create an empty object and append to it.
    // We don't want to send the entire user object because we might overwrite something uninentionally
    // So we create jsut a delta that we want merged with the user object.
    let update = {};

    if ( !userState.userDetails[ type ] ) {
        update[ type ] = {};
    } else {
        update[ type ] = userState.userDetails[ type ];
    }

    _.forEach( data, function ( value, key ) {
        update[ type ][ key ] = value;
    } );

    UserStore.sendUpdateUser( update, onSuccess );
};

UserStore.get = function ( key ) {
    let data = this.getImmutableState();

    if ( !key ) { return data; }

    if ( data && data.userDetails ) {
        return data.userDetails[ key ];
    }

    return '';
};

UserStore.sendLoginRequest = function (login, password, integrationTag) {
    var rpcRequestParams = {
        "login": login,
        "password": password
    };

    if (integrationTag) {
        rpcRequestParams.tag = integrationTag;
    }

    sendRequest('/user/login', rpcRequestParams, events.UserAuthenticated);
};

UserStore.sendRegisterRequest = function (userPassword, userDetails, integrationTag) {
    var rpcRequestParams = {
        "login": userDetails.email,
        "details": userDetails
    };

    if(!_.isNull(userPassword) && !_.isUndefined(userPassword)) {
        rpcRequestParams.password = userPassword;
    }

    if (integrationTag) {
        rpcRequestParams.tag = integrationTag;
    }

    sendRequest('/user/register', rpcRequestParams, events.UserRegistered);
};

UserStore.tokenLogin = function (registerToken, onSuccess) {
    var rpcRequestParams = {
        "loginToken": registerToken
    };
    sendRequest('/user/token-auth', rpcRequestParams, events.UserTokenAuthenticated, onSuccess);
};

UserStore.sendUpdatePassword = function (password) {
    var rpcRequestParams = {
        "password": password
    };
    sendRequest('/user/update', rpcRequestParams, events.UserUpdatePassword);
};

UserStore.sendPasswordReset = function (login, integrationTag) {
    var rpcRequestParams = {
        "login": login
    };

    if (integrationTag) {
        rpcRequestParams.tag = integrationTag;
    }

    sendRequest('/user/reset', rpcRequestParams, events.UserResetPassword);
};

UserStore.sendUpdateUser = function (formData, onSuccess) {
    var rpcRequestParams = {details: {}};
    for(var oKey in formData) {
        rpcRequestParams.details[oKey] = formData[oKey];
        if (oKey === 'email') {
            rpcRequestParams.login = rpcRequestParams.details[oKey];
        }
    }
    sendRequest('/user/update', rpcRequestParams, events.UserUpdateInfo, onSuccess);
};

/*
 * SUBSCRIPTION STUFF
 */

 // Given a product and feature, check if the subscription code includes that feature.
UserStore.isFeatureAuthorized = function ( product, feature ) {
    let auth = false;

    // Loop over the users subscriptions.
    // The goal is to find out if the feature for the product exists within a tier that the user is subscribed to.
    // For each subscription, check if the subscriptionFeatures (defined in this class above) has a set of features for the product and then if the feature list for that product on that subscription contains the feature.
    // If so, then feature is available for the product based on the user's subscriptions.
    //
    // Loop over each subscription pulled from the server
    _.each(subscriptionList, subscription => {
        // If that subscription has a feature array...
        if (subscription.subscriptionInfo.details.feature) {
            // ...loop over the feature array...
            _.each( subscription.subscriptionInfo.details.feature, featureTier => {
                // ...and check if that feature tier exists and contains the product and feature passed in.
                if (subscriptionFeatures[featureTier] && 
                    subscriptionFeatures[featureTier][product] && 
                    subscriptionFeatures[featureTier][product].indexOf(feature) >= 0)
                {
                    auth = true;
                }
            } )
        }
    });

    return auth;
}

UserStore.hasAvailablePlanList = function () {
    return subscriptionPlanList !== undefined;
}

// Gets a copy of the last list of plans retrieved fro mthe server.
// This will return nothing unless UserStore.getSubscriptionPlanList() has been called at least once.
// The app is going to make that request on load so that we have this info immediately available when we need to pop up the subscription dialog.
UserStore.getAvailablePlanList = function () {
    return subscriptionPlanList;
}

// Gets the available plans that a user can subscribe to.
UserStore.getSubscriptionPlanList = function ( onSuccess ) {
    sendRequest('/user/subscription/plan/list', {}, events.SubscriptionPlanListRetrieved, ( response ) => {
        if (!response.hasErrors()) {
            subscriptionPlanList = response.result.available;

            if (onSuccess) onSuccess( response, UserStore.getImmutableState() );
        } else {
            ErrorStore.rpcResponseError(response);
        }
    } );
};

// This gets a list of what subscriptions you ARE subscribed to
UserStore.getSubscriptionInfo = function ( onSuccess ) {
    sendRequest('/user/subscription/list', {}, events.SubscriptionListRetrieved, ( response ) => {
        // Store the subscriptions here as the last kown set of info we have about this user's subscription status.
        if (!response.hasErrors()) {
            // Save the user's current subscription list.
            // This will be reffered to at various times so we don't want to keep making the request over and over.
            // We will make the request again if the user is changing their subscription (upgrade or downgrade)
            subscriptionList = response.result.subscribed;

            if (onSuccess) onSuccess( response, UserStore.getImmutableState() );
        }
    });
};

UserStore.sendInquireSubscription = function ( subscriptionCode, onSuccess ) {
    let params = {
        subscriptionCode: subscriptionCode
    }
    sendRequest('/user/subscription/inquire', params, events.InquireSubscription, onSuccess);
}

UserStore.sendCreateSubscription = function ( subscriptionCode, token, onSuccess, handleOwnError ) {
    let params = {
        subscriptionCode: subscriptionCode,
        token: token,
        default: true
    }
    sendRequest('/user/subscription/create', params, events.CreateSubscription, onSuccess, handleOwnError);
}

UserStore.sendAuthorizeSubscription = function ( subscriptionCode, forwardUrl, onSuccess ) {
    let params = {
        subscriptionCode: subscriptionCode,
        forwardUrl: forwardUrl
    }
    sendRequest('/user/subscription/authorize', params, events.SubscriptionAuthorized, onSuccess);
}

UserStore.getCardList = function ( onSuccess ) {
    sendRequest('/user/subscription/card/list', {}, events.CardList, onSuccess);
}

UserStore.addCard = function ( token, onSuccess ) {
    let params = {
        token: token,
        default: true
    }
    sendRequest('/user/subscription/card/add', params, events.AddCard, onSuccess);
}

// UserStore.sendExecuteSubscription = function ( client, subscriptionCode, cardToken, onSuccess ) {
//     let params = {
//         client: client,
//         type: "execute",
//         subscriptionCode: subscriptionCode,
//         cardToken: cardToken
//     }
//     // Note: This path is not a mistake. It is /authorize but we send type: execute.
//     sendRequest('/user/subscription/authorize', params, events.SubscriptionExecuted, onSuccess);
// }

UserStore.sendCancelSubscription = function( subscriptionToken, cancellationNote, cancellationReason, onSuccess ) {
    let params = {
        subscriptionToken: subscriptionToken,
        cancellationNote: cancellationNote,
        cancellationReason: cancellationReason
    }
    sendRequest( 'user/subscription/cancel', params, events.SubscriptionCanceled, onSuccess );
}

UserStore.hasUsedTrial = function() {
    return userState.userDetails.payment && userState.userDetails.payment.trialUsed;
}

// END SUBSCRIPTION STUFF


UserStore.listLeads = function( productTag, optionalCampaignHash ) {
    var rpcRequestParams = {
        tag: productTag
    };
    if (optionalCampaignHash) {
        rpcRequestParams.campaignHash = optionalCampaignHash;
    }
    sendRequest( 'user/product/lead/list', rpcRequestParams, events.LeadListRetrieved);
}

UserStore.leadExport = function( dataSet, format, optionalCampaignHash ) {
    var rpcRequestParams = {
        dataSet: dataSet,
        format: format
    };
    if (optionalCampaignHash) {
        rpcRequestParams.campaignHash = optionalCampaignHash;
    }
    sendRequest( 'user/product/lead/export', rpcRequestParams, events.LeadExport);
}

UserStore.deleteLead = function ( leads ) {
    // If a single lead is passed in, wrap it in an array for the server.
    if (typeof leads === "string") {
        leads = [ leads ];
    }
    sendRequest( 'user/product/lead/delete', { leads: leads }, events.DeleteLead  );
}

UserStore.getAuthToken = function () {
    var headers = portalConnection.getHeaders();
    if (headers && 'session-token' in headers) {
        return headers['session-token'];
    }
    return null;
};

UserStore.isAuthenticated = function () {
    return this.getAuthToken();
};

UserStore.verifyAuthToken = function () {
    if ( !this.isAuthenticated() ) {
        UserStore.dispatchEvent( events.RequestLogin );
    }
};

UserStore.removeAuthentication = function () {
    portalConnection.deleteHeaders();
};

UserStore.endLiveChat = function () {
    if ( window.$zopim && window.$zopim.livechat ) {
        window.$zopim.livechat.clearAll();
        window.$zopim.livechat.hideAll();
        var chat = document.getElementById( 'launcher' );
        if ( chat ) { chat.style.display = 'none'; }
    }
};

UserStore.onSubscription = function () {
    return false;
};

/**
 * Private method, Generic Send Request for all UserStore requests
 */
var sendRequest = function (method, requestParams, requestEvent, onSuccess, handleOwnError) {
    var onSuccessResponse = function (responseData) {
        if(responseData.result) {
            // Store the User Details
            if(responseData.result.details) {
                userState.userDetails = responseData.result.details;

                if ( !window.$zopim && ConfigStore.getLiveHelpEnabled() ) {
                    LiveChat.initialize( function ( $zopim ) {
                        $zopim( function () {
                            $zopim.livechat.setName(userState.userDetails.firstName + " " + userState.userDetails.lastName);
                            $zopim.livechat.setEmail(userState.userDetails.email);
                            var chat = document.getElementById( 'launcher' );
                            if ( chat ) { chat.style.display='block' }
                        } );
                    } );
                }

                if ( userState.userDetails.lang ) {
                    i18n.setLocale( userState.userDetails.lang );
                }
            }
        }

        // Notify that the request was responded to successfully
        UserStore.dispatchEvent(requestEvent, {
            state: UserStore.getImmutableState(),
            response: responseData
        });

        if (onSuccess) {
            onSuccess( responseData, UserStore.getImmutableState() );
        }
    };

    portalConnection.sendImmediate( {
        method: method, 
        params: requestParams, 
        onSuccess: onSuccessResponse,
        handleOwnError: handleOwnError
    } );
};
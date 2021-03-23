var _ = require('underscore');
var EventDispatcher = require('../dispatcher/EventDispatcher');
var GUID = require('../util/guid');
var SaveState = require('../components/common/SaveState');
import ConfigStore from './ConfigStore';

var i18n = require( './i18nStore' );

var campaignEvents = EventDispatcher.hashFromArray([
    'CampaignListRetrieved',
    'FullCampaignListRetrieved',
    'CampaignGameInfoRetrieved',
    'CampaignDetailsRetrieved',
    'CampaignRegistered',
    'CampaignUpdated',
    'CampaignStatusUpdated',
    'CampaignStateChanged',
    'CampaignTransition',
    'CampaignSupressAutosave',
    'CampaignUrlChecked',
    'CampaignSkillQuestionRetrieved',
    'MailingListRetrieved',
    'MailingFieldsRetrieved',
    'AweberAuthenticationUrl',
    'CampaignPriceReceived',
    'PaymentRequestCompleted',
    'PaymentExecuted',
    'PaymentCancelled',
    'Bitlified',
    'LinksStatsReceived',
    'CampaignStatsRetrieved',
    'PriceListRetrieved',
    'NotificationTestEmailSent',
    'CampaignCloned',
    'AwardsListRetrieved'
]);

var campaignState = {};
var CampaignStore = EventDispatcher.createDispatcher( module.exports, campaignEvents );

var _pages = {
    'edit': {
        required: [],
        validation: []
    },
    'game': {
        required: [],
        validation: [ 'selectedGame', 'selectedGame.game-type' ]
    },
    'prizes': {
        required: [ 'prizes' ],
        validation: [ 'prizes', 'prizes.getLength()', 'prizes.prizeValidate()' ]
    },
    'theme': {
        required: [],
        validation: [ 'themeInfo', 'themeInfo.name' ]
    },
    'social': {
        required: [],
        validation: []
    },
    'site': {
        required: [],
        validation: [ 'visit', 'visit.site.truthy()' ]
    },
    'tracking': {
        required: [],
        validation: []
    },
    'notifications': {
        required: [],
        validation: []
    },
    'communication': {
        required: [],
        validation: []
    },
    'legal': {
        required: [],
        validation: [ 'legal', 'legal.companyname', 'legal.companyemail', 'legal.entryagetype' ]
    },
    'purchase': {
        required: [],
        validation: [ 'billing', 'billing.firstname', 'billing.lastname', 'billing.email', 'billing.phone', 'billing.country', 'billing.zipcode', 'billing.city', 'billing.address', 'readOnly', 'readOnly.paymentInfo', 'readOnly.paymentInfo.paymentConfirmId' ]
    }
};

// var _nav = {
//     'basic': [ 'game', 'theme', 'site', 'legal', 'purchase' ],
//     'go': [ 'game', 'theme', 'site', 'legal', 'purchase' ],
//     'lite': [ 'game', 'prizes', 'theme', 'site', 'notifications', 'legal', 'purchase' ],
//     'plus': [ 'game', 'prizes', 'theme', 'site', 'notifications', 'legal', 'purchase' ],
//     'pro': [ 'game', 'prizes', 'theme', 'site', 'tracking', 'notifications', 'communication', 'legal', 'purchase' ],
//     'all': [ 'game', 'prizes', 'theme', 'site', 'tracking', 'notifications', 'communication', 'legal', 'purchase' ]
// };

// TODO: Consider having a constants class for global formats
CampaignStore.dateInputFormat = "YYYY/MM/DD HH:mm";
CampaignStore.dateOnlyInputFormat = "YYYY/MM/DD";
CampaignStore.timeOnlyInputFormat = "HH:mm";
CampaignStore.fullDateDisplayFormat = "MMM Do, YYYY, h:mm a z";
CampaignStore.fullDateWithOffsetDisplayFormat = "MMM Do, YYYY, h:mm a z / [GMT](Z)";
CampaignStore.dateDisplayFormat = "MMM Do, YYYY";
CampaignStore.timeDisplayFormat = "h:mm a z";
CampaignStore.dateTimePickerDateFormat = "MMMM D, YYYY";
CampaignStore.dateTimePickerTimeFormat = "h:mm a";

CampaignStore.STATUS_INACTIVE = 'UNSCHEDULED';
CampaignStore.STATUS_UNSHEDULED = 'UNSCHEDULED';
CampaignStore.STATUS_ACTIVE = 'RUNNING';
CampaignStore.STATUS_RUNNING = 'RUNNING';
CampaignStore.STATUS_SCHEDULED = 'SCHEDULED';
CampaignStore.STATUS_DELETED = 'DELETED';
CampaignStore.STATUS_CANCELLED = 'CANCELLED';
CampaignStore.STATUS_SUSPENDED = 'SUSPENDED';
CampaignStore.STATUS_ENDED = 'ENDED';

CampaignStore.isActive = function ( status ) {
    return status === 'RUNNING' || status === "SCHEDULED";
};

CampaignStore.isComplete = function ( status ) {
    return status === 'DELETED' || status === "CANCELLED" || status === "SUSPENDED" || status === "ENDED";
};

CampaignStore.isUnscheduled = function ( status ) {
    return status === 'UNSCHEDULED';
};

CampaignStore.isNotUnscheduled = function ( status ) {
    return status !== 'UNSCHEDULED';
};


// Store a list of campaigns that should be filtered on.

CampaignStore.campaignFilter = undefined;

CampaignStore.setCampaignFilter = ( campaignHashArray ) => {
    window.sessionStorage.setItem("campaignFilter", campaignHashArray);
}

CampaignStore.getCampaignFilter = () => {
    return window.sessionStorage.getItem("campaignFilter") ? window.sessionStorage.getItem("campaignFilter").split(",") : undefined;
}

// CampaignStore.clearState = function () {
//     campaignState = {};
// };

// CampaignStore.getNav = function ( type, features ) {
//     if ( !features ) { features = []; }
//     // return _.clone( _nav[ type || 'all' ] || _nav[ 'all' ] );
//     // return _nav.pro.filter( function ( page ) { return hasFeatures( _pages[ page ].required, features ); } );
//     return ConfigStore.get( 'campaign' ).nav.filter( function ( page ) { return hasFeatures( _pages[ page ].required, features ); } );
// };

CampaignStore.getAvailableFeatures = function () {
    return ConfigStore.getCampaignFeatures();
};

// CampaignStore.campaignValidate = function (page, details) {
//     details = details ? details : ( campaignState && campaignState.details ) ? campaignState.details : {};
//     var serverKeys = { 'edit': 'getStarted', 'data': 'dataCollection', 'communication': 'mailingList', 'site': 'campaignSite' };

//     if ( !details.progress ) { return false; }

//     if (page === 'all') {
//         var pages = ['edit', 'prizes', 'data', 'theme', 'game', 'legal', 'purchase', 'communication', 'summary', 'preview', 'site' ];
//         for (var i = 0; i < pages.length; i++) {
//             var pg = pages[i];
//             if (!check(pg)) { return false; }
//         }
//         return true;
//     } else {
//         return details.type ? details.progress[ page ] && details.progress[ page ] === 'true' : check( page );
//     }

//     function check(page) {
//         if ( !details || !details.progress ) { return false; }
//         return details.progress[ serverKeys[ page ] ? serverKeys[ page ] : page ] === 'true';
//     }

// };

CampaignStore.validate = function ( pages, details ) {
    //if ( !pages ) { pages = CampaignStore.getNav( '', campaignState.details.features ); }
    if ( !Array.isArray( pages ) ) { pages = [ pages ]; }
    if ( !details ) { details = campaignState.details; }

    var res = pages.filter( function ( page ) {
        var result = validateFields( details, _pages[ page ].validation );
        return !result;
        // return !( validateFields( details, requiredFields[ details.type || 'all' ][ page ] ) );
    } );
    return res.length <= 0;
};

// function hasFeatures ( required, feats ) {
//     return required.filter( function ( feat ) { return !feats[ feat ] || ( feats[ feat ] && !feats[ feat ].enabled ); } ).length === 0;
// }

function validateFields ( data, fields ) {
    if ( !data || !fields ) { return false; }

    let fieldsOfFields = [ [] ];

    fields.forEach( k => {
        if ( k === 'OR' || k === '||' ) {
            fieldsOfFields.push( [] );
        } else {
            fieldsOfFields[ fieldsOfFields.length -1 ].push( k );
        }
    } );

    return fieldsOfFields.map( ( fields ) => fields.filter( f => !( traverseObject( data, f ) ) ).length <= 0 ).indexOf( true ) !== -1;

    // var res = fields.filter( function ( field ) {
    //     var result = traverseObject( data, field );
    //     return !result;
    // } );
    // return res.length <= 0;
}

function traverseObject ( obj, path ) {
    var paths = path.split( '.' );
    var data = obj;
    var methods = { getLength: getLength, truthy: truthy, falsey: falsey, prizeValidate: prizeValidate };
    paths.forEach( function ( key ) {
        if ( key.includes( '()' ) ) {
            var _func = key.split( '()' )[ 0 ];
            data = methods[ _func ]( data );
        } else {
            data = data[ key ] ? data[ key ] : false;
        }
    }, this );
    return data;
}

function getLength ( obj ) {
    switch ( getTypeOf( obj ) ) {
        case 'Object':
            return Object.keys( obj ).length;
        case 'Array':
        case 'String':
        default:
            return obj.length || 0;
    }
}

function falsey ( val ) {
    return !val;
}

function truthy ( val ) {
    return val && ( val === 'true' || val === true );
}

function getTypeOf ( obj ) {
    return Object.prototype.toString.call( obj ).slice( 8, -1 );
}

function prizeValidate ( prizes ) {
    let totalWinPercent = 0;
    let hasInstantPrizes = 0;

    let res = typeof prizes === 'object' && Object.keys( prizes ) && Object.keys( prizes ).filter( hash => {
        let prize = prizes[ hash ];

        if ( prize && prize.type === 'instant' ) {
            hasInstantPrizes++;
            if ( prize.winPercent && parseFloat( prize.winPercent ) ) {
                totalWinPercent += parseFloat( prize.winPercent );
            }

            return prize.winPercent === 'undefined' || prize.winPercent === null || parseFloat( prize.winPercent ) < 0
        }

        if ( prize && prize.type !== 'instant' ) {
            return prize.oneInNumber || prize.unlimited;
        }
    } );

    // check to make sure all prizes are filtered out because they're valid and that there
    return ( hasInstantPrizes && totalWinPercent > 0 || !hasInstantPrizes ) && res.length === 0;
}

// function updateProgress ( campaignDetails ) {
//     var progress = {};
//     var pages = ConfigStore.get( 'campaign' ).nav; //_.clone( _nav[ campaignDetails.type || 'all' ] );
//     pages.forEach( function ( page ) {
//         // console.log( 'updateProgress ', page, ' = ', CampaignStore.validate( page, campaignDetails ) );
//         progress[ page ] = '' + CampaignStore.validate( page, campaignDetails );
//     } );
//     return progress;
// }

// CampaignStore.getProgress = function ( pages, campaignDetails ) {
//     if ( !pages ) { return; }
//     if ( !Array.isArray( pages ) ) { pages = [ pages ]; }
//     if ( !campaignDetails ) { campaignDetails = campaignState.details; }

//     return pages.filter( function ( p ) { return !( truthy( campaignDetails.progress[ p ] ) ); } ).length <= 0;
// };

// CampaignStore.permissionEdit = function () {
//     // import JSON from server and then check based on fields, for now...basic check on status.
//     return campaignState.status === 'UNSCHEDULED';
// };

// CampaignStore.newPrize = function () {
//     return {
//         id: GUID.guid(),
//         title: '',
//         description: '',
//         product_type: 'physical',
//         type: '',
//         value: '0',
//         // quantity: '1',
//         // unlimited: false,
//         show: 'true',
//         // winPercent: 0,
//         // weight: 0
//         // oneInNumber: '1',
//     };
// };

CampaignStore.bitlify = function ( campaignHash, channelCode ) {
    sendRequest( 'campaign/generate-url', { campaignHash: campaignHash, channelCode: channelCode }, campaignEvents.Bitlified );
};

// CampaignStore.getCampaignPrice = function ( campaignHash, params ) {
//     if ( !params ) { params = {}; }
//     params.campaignHash = campaignHash;
//     sendRequest( 'campaign/payment/inquire', params, campaignEvents.CampaignPriceReceived );
// };

// CampaignStore.getPriceList = function () {
//     sendRequest( 'campaign/payment/list', {}, campaignEvents.PriceListRetrieved );
// };

// CampaignStore.createPaymentRequest = function ( campaignHash, params ) {
//     params = _.extend( {}, { campaignHash: campaignHash, provider: 'paypal' }, params );
//     sendRequest( 'campaign/payment/authenticate', params, campaignEvents.PaymentRequestCompleted );
// };

// CampaignStore.executePayment = function ( campaignHash, payerid, paymentid ) {
//     var params = {
//         campaignHash: campaignHash,
//         paymentId: paymentid,
//         details: {
//             paymentToken: payerid
//         }
//     };
//     sendRequest( 'campaign/payment/execute', params, campaignEvents.PaymentExecuted );
// };

// CampaignStore.cancelPayment = function ( campaignHash ) {
//     sendRequest( 'campaign/payment/cancel', { campaignHash: campaignHash }, campaignEvents.PaymentCancelled );
// }

// CampaignStore.getLinksStats = function ( params ) {
//     sendRequest( 'campaign/generate-url-stats', params, campaignEvents.LinksStatsReceived );
// };

CampaignStore.getState = function () {
    return JSON.parse( JSON.stringify( campaignState ) );
};

// NOTE: Product tag is not required if you want all campaigns but it's not a godd idea to allow that through this method.
// If product tag is optional, it can lead to bugs where you get campaigns yo u werent expecting.
// If we need a method to get all campaigns, write a separate getFullCmpaignList method instead.
CampaignStore.getCampaignList = function ( productTag, onSuccess ) {
    let params = {};

    if (productTag) {
        params.tag = productTag;
    } else {
        throw "Product Tag is required to list campaigns";
    }

    sendRequest( 'campaign/user/list-campaigns', params, campaignEvents.CampaignListRetrieved, onSuccess );
};

CampaignStore.getFullCampaignList = function ( onSuccess ) {
    sendRequest( 'campaign/user/list-campaigns', {}, campaignEvents.FullCampaignListRetrieved, onSuccess );
};

CampaignStore.getAweberAuthenticationUrl = function ( integration, appUrl ) {
    let params = {
        "product": "dashboard",
        "integration": integration,
        "service": "AWEBER",
        "forwardUrl": appUrl
    }
    sendRequest( 'mail/oauth/authenticate', params, campaignEvents.AweberAuthenticationUrl );
}

CampaignStore.getMailingList = function ( serviceName, params ) {
    sendRequest( 'mail/validate-service', { serviceName: serviceName, serviceParams: params }, campaignEvents.MailingListRetrieved );
};

CampaignStore.getMailingFields = function ( serviceName, params ) {
    sendRequest( 'mail/list-fields', { serviceName: serviceName, serviceParams: params }, campaignEvents.MailingFieldsRetrieved );
};

// CampaignStore.getSkillQuestion = function () {
//     sendRequest( 'campaign/generate-question', {}, campaignEvents.CampaignSkillQuestionRetrieved );
// };

CampaignStore.getCampaignStats = function ( campaigns, statKeys ) {
    if (!Array.isArray(campaigns)) {
        campaigns = [campaigns];
    }

    if (!Array.isArray(statKeys)) {
        statKeys = [statKeys];
    }

    let params = {
        campaigns: campaigns,
        types: statKeys
    }

    let onSuccess = (responseData) => {
        // The result of this request is in a really unfriendly format. 
        // I'm going to re-structure the information and add a modified version that restructures all the info by campaign instead of by stat.
        let modifiedResult = {}

        _.keys( responseData.result ).forEach( statKey => {
            _.keys( responseData.result[statKey] ).forEach( campaignHash => {
                modifiedResult[campaignHash] = modifiedResult[campaignHash] || {};
                modifiedResult[campaignHash][statKey] = responseData.result[statKey][campaignHash];
            } );
        });

        responseData.modifiedResult = modifiedResult;

        CampaignStore.dispatchEvent( campaignEvents.CampaignStatsRetrieved, { response: responseData } );
    }
    sendRequest( 'campaign/statistic/type', params, campaignEvents.CampaignStatsRetrieved, onSuccess )
};

CampaignStore.clone = function ( campaignHash, name, onSuccess ) {
    sendRequest( 'campaign/clone', { campaignHash: campaignHash, name: name }, campaignEvents.CampaignCloned, onSuccess );
}

CampaignStore.sendCampaignRegister = function (details, productTag) {
    // Build Request template first, and fill out later
    var rpcRequestParams = {
        details: {},
        version: 0,
        tag: productTag
    }
    // Fill in the details into the Template
    fillCampaignTemplate( rpcRequestParams, details );
    sendRequest( 'campaign/register', rpcRequestParams, campaignEvents.CampaignRegistered );
};

// NOTE: The onSuccess handler is optional.
// If not provided, the standard onCampaignUpdated event fires.
// This can be problematic if there are multiple listeners active so passing a function for onSuccess will override that behaviour.
CampaignStore.sendCampaignUpdateStatus = function (campaignHash, status, version, onSuccess) {
    var rpcRequest = { campaignHash: campaignHash, status: status, version: version };
    sendRequest('campaign/update-status', rpcRequest, campaignEvents.CampaignStatusUpdated, onSuccess);
};

// NOTE: The onSuccess handler is optional.
// If not provided, the standard onCampaignStatusUpdated event fires.
// This can be problematic if there are multiple listeners active so passing a function for onSuccess will override that behaviour.
CampaignStore.sendCampaignUpdate = function ( campaignHash, details, version, onSuccess ) {
    SaveState.dispatchSaveStateUpdate( { state: SaveState.STATE_SAVING } );
    // Build Request template first, and fill out later
    var rpcRequestParams = {
        details: {},
        version: version,
        campaignHash: campaignHash
    }
    // Fill in the details into the Template
    //details.progress = updateProgress( details );
    fillCampaignTemplate( rpcRequestParams, details );

    sendRequest( 'campaign/update', rpcRequestParams, campaignEvents.CampaignUpdated, onSuccess );
};

// NOTE: The onSuccess handler is optional.
// If not provided, the standard onCampaignDetailsRetrieved event fires.
// This can be problematic if there are multiple listeners active so passing a function for onSuccess will override that behaviour.
CampaignStore.sendGetCampaignDetails = function ( campaignHash, onSuccess ) {
    sendRequest( 'campaign/details', { "campaignHash": campaignHash }, campaignEvents.CampaignDetailsRetrieved, onSuccess );
};

// CampaignStore.sendNotificationTestEmail = function ( campaignHash, type ) {
//     sendRequest( 'campaign/lead/email-preview', { campaignHash: campaignHash, email: type }, campaignEvents.NotificationTestEmailSent );
// };

// CampaignStore.notifyCampaignFormStateChange = function ( state ) {
//     CampaignStore.dispatchEvent( campaignEvents.CampaignStateChanged, { state: state } );
// };

// CampaignStore.notifyCampaignTransition = function ( transition ) {
//     CampaignStore.dispatchEvent( campaignEvents.CampaignTransition, { transition: transition } );
// };

// CampaignStore.notifyCampaignSupressAutosave = function ( supress ) {
//     CampaignStore.dispatchEvent( campaignEvents.CampaignSupressAutosave, { supress: supress } );
// };

CampaignStore.getAwardsList = function (campaignHash) {
    sendRequest('campaign/award/winner/list', {campaignHash: campaignHash}, campaignEvents.AwardsListRetrieved);
};

function sendRequest ( method, requestParams, requestEvent, onSuccess ) {
    var onSuccessResponse = onSuccess || function (responseData) {
        // Store the Campaign Details
        if (responseData && responseData.result && responseData.result.details) {
            campaignState = responseData.result;
        }

        // Notify that the request was responded to successfully
        CampaignStore.dispatchEvent( requestEvent, { state: CampaignStore.getState(), response: responseData } );
    };
    portalConnection.send( {
        method: method, 
        params: requestParams, 
        onSuccess: onSuccessResponse, 
        onError: function ( res ) {
            CampaignStore.dispatchEvent( { requestEvent, response: {
                hasErrors: function () {
                    return true;
                },
                hasAjaxError: function () {
                    return true;
                },
                res
            } } );
        }
    } );
}

function fillCampaignTemplate ( campaignTemplate, details ) {
    // Add in all details NOT pregame and postgame forms
    _.map( details, function ( value, key ) {
        campaignTemplate.details[ key ] = value;
    }, null );
}

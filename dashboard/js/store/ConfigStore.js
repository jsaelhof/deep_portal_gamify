import EventDispatcher from '../dispatcher/EventDispatcher';
import $ from 'jquery';
import _ from 'underscore';
import i18n from '../store/i18nStore';
import deepmerge from 'deepmerge';

let _events = EventDispatcher.hashFromArray( [
    'ConfigLoaded',
    'ConfigLoadError',
    'GuideConfigLoaded',
    'GuideConfigLoadError',
    'AppIdRetrieved',
    'StripeAPIKeyRetrieved'
] );

let config;
let guideConf;

let store = EventDispatcher.createDispatcher( module.exports, _events );

store.getIntegrationType = function () {
    // Parse the integration from the URL. The format of the URL is "<protocol>://<domain>/dashboard/<product>/<integration>/....".
    // This is used to determine which config file to load.
    let integrationRegEx = /\/dashboard\/(\w+)\/(\w+)/g;
    let integration = integrationRegEx.exec(window.location.href);
    return integration ? integration[2] : undefined;
}

store.getProductType = function () {
    // Parse the product from the URL. The format of the URL is "<protocol>://<domain>/dashboard/<product>/<integration>/....".
    // This is used to determine which config file to load.
    let productRegEx = /\/dashboard\/(\w+)\/(\w+)/g;
    let product = productRegEx.exec(window.location.href);
    return product ? product[1] : undefined;
}

store.INTEGRATION;
store.APP_ID = undefined;

store.initialize = function ( context ) {
    this.addOneTimeEventListener( {
        onConfigLoaded: function ( e ) {
            context.next();
        },
        onConfigLoadError: function ( e ) {
            context.fail( e );
        }
    } );

    store.INTEGRATION = store.getIntegrationType();

    loadConfig( store.INTEGRATION );
};

store.productConf = function ( product ) {
    return config.productConfig[ product || store.getProductType()];
}

function loadConfig ( integration ) {
    let defaultGameConfig, defaultTemplateConfig;

    // LOAD THE DEFAULT GAME CONFIG
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: '/dashboard/assets/defaultgameconfig.json',
        success: function ( gameConfigData ) {
            defaultGameConfig = gameConfigData;

            // LOAD THE DEFAULT TEMPLATE CONFIG
            $.ajax( {
                type: 'GET',
                contentType: 'application/json',
                dataType: 'json',
                url: '/dashboard/assets/defaulttemplateconfig.json',
                success: function ( templateConfigData ) {
                    defaultTemplateConfig = templateConfigData;

                    // LOAD THE INTEGRATION CONFIG
                    $.ajax( {
                        type: 'GET',
                        contentType: 'application/json',
                        dataType: 'json',
                        url: '/dashboard/conf/' + integration + '.json',
                        success: function ( data ) {
                            try {
                                for (let productKey in data.productConfig) {
                                    // Insert the default game configuration into the config.
                                    // If the config has game info already, merge it over top of the default info.
                                    let integrationGameConfig = data.productConfig[productKey].games || {};
                                    data.productConfig[productKey].games = deepmerge( defaultGameConfig[productKey], integrationGameConfig );
                
                                    // Insert the default template/theme configuration into the config.
                                    // If the config has tempalte/theme info already, merge it over top of the default info.
                                    let integrationTemplateConfig = data.productConfig[productKey].templates || {};
                                    data.productConfig[productKey].templates = deepmerge( defaultTemplateConfig[productKey], integrationTemplateConfig );
                                } 
                
                                config = data;
                
                                // LOADING COMPLETE SUCCESS
                                store.dispatchConfigLoaded( { state: data } );
                            } catch ( e ) {
                                store.dispatchConfigLoadError( { state: { error: 'error_loading_integration_config' } } );
                            }
                        },
                        error: function ( xhr, status, error ) {
                            store.dispatchConfigLoadError( { state: { error: 'error_loading_integration_config' } } );
                        }
                    } );
                },
                error: function ( xhr, status, error ) {
                    store.dispatchConfigLoadError( { state: { error: 'error_loading_defaulttemplate_config' } } );
                }
            } );
        },
        error: function ( xhr, status, error ) {
            store.dispatchConfigLoadError( { state: { error: 'error_loading_defaultgame_config' } } );
        }
    } );
}


// --- Custom getters for Gamify Config format ---

store.getCampaignFeatures = function () {
    return config.campaign.features;
}

store.getFeatures = function () {
    return config.features;
}


store.getNavEnabled = function () {
    return config.topbar.nav.enabled;
}

// Checks if at least one menu item is enabled.
store.navHasEnabledItems = function () {
    return _.some(config.topbar.nav.menu, item => item.enabled) || config.topbar.nav.customMenuItems["en-us"].length > 0;
}

store.getMenuDisplay = function () {
    return config.topbar.nav.menuDisplay;
}

store.isMenuItemEnabled = function ( id ) {
    return (config.topbar.nav.menu[id]) ? config.topbar.nav.menu[id].enabled : false;
}

store.getCustomMenuItems = function () {
    // Get the custom menu items.
    // If it exists, expect each key will be a language code with the menu items for the languge.
    // If there isn't one for this langauge, try to fallback to english.
    // If that doesn't exist, the whole thing isn't properly formatted and just returns an empty list.
    if (config.topbar.nav.customMenuItems) {
        if (config.topbar.nav.customMenuItems[i18n.LANGUAGE]) {
            return config.topbar.nav.customMenuItems[i18n.LANGUAGE];
        } else if (config.topbar.nav.customMenuItems["en-us"]) {
            return config.topbar.nav.customMenuItems["en-us"];
        }
    }
    
    // Nothing valid found, return empty
    return [];
}

store.getIntegrationTag = function () {
    return config.integration.tag;
}

store.getIntegrationDisplayName = function () {
    return config.integration.displayName;
}

store.getIntegrationSnippetInject = function () {
    return config.integration.snippetInject;
}

store.getAllowSubscribe = function () {
    return config.integration.allowSubscribe;
}

store.isProductEnabled = function ( product ) {
    return store.productConf(product) && store.productConf(product).product.enabled;
}

store.getProductTag = function ( product ) {
    return store.productConf( product ).product.tag;
}

store.getThemeDefaultLayout = function () {
    return store.productConf().theme.default.layout;
}

store.getThemeDefaultName = function () {
    return store.productConf().theme.default.name;
}

store.getLiveHelpEnabled = function () {
    return config.livehelp.enabled;
}

// shopUrl and adminUrl come from the user object. If it's not applicable, it will be undefined. The appUrl may not use all tokens.
store.getAppUrl = function ( userDetails ) {
    let url;
    if (store.isIFramed()) {
        url = config.integration.appUrl;
        url = url.replace("{adminUrl}",userDetails.adminUrl);
        url = url.replace("{shopUrl}",userDetails.shopUrl);
        url = url.replace("{appId}",store.APP_ID);
    } else {
        url = store.getDashboardRoute();
    }
    return url;
}

store.isIFramed = function () {
    return config.integration.iframed;
}

store.getLoginType = function () {
    return config.login.type;
}

store.previewUsesExternalSite = function ( product ) {
    return config.preview.useExternalSite;
}

store.isMailIntegrationDisabled = function ( id ) {
    return config.mailintegration && config.mailintegration.disabled && config.mailintegration.disabled.indexOf(id) >= 0;
}

store.getEditorSectionEnabled = function ( section, subsection ) {
    // Sections are enabled by default
    let enabled = true;

    if (subsection) {
        // If a subsection specifically sets the value, use it. If it doesn't, the default stays enabled.
        if (store.productConf().editor && store.productConf().editor[section] && store.productConf().editor[section][subsection] && store.productConf().editor[section][subsection].enabled !== undefined) {
            enabled = store.productConf().editor[section][subsection].enabled;
        }
    } else {
        // If a section specifically sets the value, use it. If it doesn't, the default stays enabled.
        if (store.productConf().editor && store.productConf().editor[section] && store.productConf().editor[section].enabled !== undefined) {
            enabled = store.productConf().editor[section].enabled;
        }
    }

    return enabled;
}

store.getThemePreviewUrlParams = function ( product ) {
    return store.productConf(product).editor.theme.previewUrlParams;
}

store.getPermission = function ( module, feature ) {
    if ( config.permissions[module] && config.permissions[module][feature] !== undefined) {
        return config.permissions[module][feature];
    } else {
        throw "Permission for " + product + " / " + module + " / " + feature + " not found";
    }
}

store.showLeadBar = function () {
    return config.dashboard.leadbar.enabled;
}

store.showLeadBarNewLeads = function () {
    return config.dashboard.leadbar.newleads;
}

store.showLeadBarLast30Days = function () {
    return config.dashboard.leadbar.last30days;
}

store.showLeadBarAllTime = function () {
    return config.dashboard.leadbar.alltime;
}

store.showLeadBarViewLeads = function () {
    return config.dashboard.leadbar.viewleads;
}

store.showLeadBarMailIntegration = function () {
    return config.dashboard.leadbar.mailintegration;
}

store.getDefaultTheme = function () {
    return store.productConf().template.defaultTheme;
}

store.getDefaultTemplate = function () {
    return store.productConf().template.defaultTemplate;
}

store.isGameExcluded = function ( gameId ) {
    return store.productConf().games[gameId] && store.productConf().games[gameId].excluded;
}

store.isSkinExcluded = function ( gameId, skinId ) {
    return store.productConf().games[gameId] && store.productConf().games[gameId].skins && store.productConf().games[gameId].skins[skinId] && store.productConf().games[gameId].skins[skinId].excluded
}

store.getGameDefaultSkin = function ( gameId ) {
    let defaultSkin = store.productConf().games[gameId] ? store.productConf().games[gameId].defaultSkin : undefined;

    // If the skin set as the default is excluded, then search for the first non-excluded skin that can be found and use that.
    if (store.isSkinExcluded(gameId, defaultSkin)) {
        for (let g in store.productConf().games[gameId].skins) {
            if (!store.isSkinExcluded(gameId, g)) {
                defaultSkin = g;
                break;
            }
        }
    }

    return defaultSkin;
}

store.getGameDisplayOrder = function ( gameId ) {
    return store.productConf().games[gameId] ? store.productConf().games[gameId].displayOrder : 1000;
}

store.getSkinDisplayOrder = function ( gameId, skinId ) {
    return store.productConf().games[gameId] && store.productConf().games[gameId].skins && store.productConf().games[gameId].skins[skinId] ? store.productConf().games[gameId].skins[skinId].displayOrder : 1000;
}

store.getGameSkinTags = function ( gameId, skinId ) {
    return store.productConf().games[gameId] && store.productConf().games[gameId].skins && store.productConf().games[gameId].skins[skinId] ? store.productConf().games[gameId].skins[skinId].tags : [];
}

store.getPrizeMessage = function ( key ) {
    return store.productConf().prizes && store.productConf().prizes.messages ? store.productConf().prizes.messages[key] : undefined;
}




store.isTemplateExcluded = function ( templateId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].excluded;
}

store.isTemplateSkinExcluded = function ( templateId, skinId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].skins && store.productConf().templates[templateId].skins[skinId] && store.productConf().templates[templateId].skins[skinId].excluded
}

store.getTemplateDefaultSkin = function ( templateId ) {
    let defaultSkin = store.productConf().templates[templateId] ? store.productConf().templates[templateId].defaultSkin : undefined;

    // If the skin set as the default is excluded, then search for the first non-excluded skin that can be found and use that.
    if (store.isTemplateSkinExcluded(templateId, defaultSkin)) {
        for (let g in store.productConf().templates[templateId].skins) {
            if (!store.isTemplateSkinExcluded(templateId, g)) {
                defaultSkin = g;
                break;
            }
        }
    }

    return defaultSkin;
}

store.getTemplateDisplayName = function ( templateId ) {
    return store.productConf().templates[templateId] ? store.productConf().templates[templateId].displayName : templateId;
}

store.getTemplateDisplayOrder = function ( templateId ) {
    return store.productConf().templates[templateId] ? store.productConf().templates[templateId].displayOrder : 1000;
}

store.getTemplateSkinDisplayName = function ( templateId, skinId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].skins && store.productConf().templates[templateId].skins[skinId] ? store.productConf().templates[templateId].skins[skinId].displayName : skinId;
}

store.getTemplateSkinDisplayOrder = function ( templateId, skinId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].skins && store.productConf().templates[templateId].skins[skinId] ? store.productConf().templates[templateId].skins[skinId].displayOrder : 1000;
}

store.getTemplateSkinDefaultPrize = function ( templateId, skinId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].skins && store.productConf().templates[templateId].skins[skinId] ? store.productConf().templates[templateId].skins[skinId].defaultPrize : undefined;
}

store.getTemplateSkinTags = function ( templateId, skinId ) {
    return store.productConf().templates[templateId] && store.productConf().templates[templateId].skins && store.productConf().templates[templateId].skins[skinId] ? store.productConf().templates[templateId].skins[skinId].tags : [];
}

// --- Guide Config ---

store.loadGuideConfig = function () {
    if (!guideConf) {
        $.ajax( {
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: 'https://static.deepmarkit.com/gamify/guides/guides.json',
            success: function ( data ) {
                try {
                    guideConf = data;
                    store.dispatchGuideConfigLoaded( data );
                } catch ( e ) {
                    store.dispatchGuideConfigLoadError( { state: { error: 'error_loading_integration_config' } } );
                }
            },
            error: function ( xhr, status, error ) {
                store.dispatchGuideConfigLoadError( { state: { error: 'error_loading_integration_config' } } );
            }
        } );
    }
}

store.getGuideConfig = function () {
    return guideConf;
}

store.showColoumnForWinnersPage = function ( column ) {
    return config.winnersPage.columns.indexOf( column ) >= 0;
}

// --- Utility ---

store.getBaseRoute = function ( product ) {
    return "/dashboard/"+(product ? product : store.getProductType())+"/"+store.INTEGRATION;
}

store.buildRoutePath = function ( path, product ) {
    return store.getBaseRoute( product ) + "/" + path;
}

store.getDashboardRoute = function () {
    return store.getBaseRoute( "portal" );
}

// --- Server (Async) Config ---

// This is a unique id associated with the app in certain integrations. We'll always ask for it on startup (See Gamify.jsx) 
// and will save the result if any in store.APP_ID.
store.getAppId = function () {
    sendRequest( 'config', { "key": "integrations."+store.INTEGRATION+".appId" }, _events.AppIdRetrieved, response => {
        if (response.result && response.result["integrations."+store.INTEGRATION+".appId"]) {
            store.APP_ID = response.result["integrations."+store.INTEGRATION+".appId"];
        }
    } );
};

store.getStripeAPIKey = function ( onSuccess ) {
    sendRequest( 'config', { "key": "payment.stripe.clientKey" }, _events.StripeAPIKeyRetrieved, response => {
        if (response.result && response.result["payment.stripe.clientKey"]) {
            onSuccess(response.result["payment.stripe.clientKey"]);
        } else {
            onSuccess(undefined);
        }
    } );
};


function sendRequest(method, requestParams, requestEvent, onSuccess) {
    var onSuccessResponse = onSuccess || function (responseData) {
        // Notify that the request was responded to successfully
        store.dispatchEvent( requestEvent, { response: responseData } );
    };

    var onErrorResponse = function (responseData) {
        console.log("Error",responseData);
    };

    portalConnection.send( {
        method: method, 
        params: requestParams, 
        onSuccess: onSuccessResponse, 
        onError: onErrorResponse
    } );
}
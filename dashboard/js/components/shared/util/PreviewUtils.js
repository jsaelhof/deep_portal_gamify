var ConfigStore = require('../../../store/ConfigStore');
var UserStore = require('../../../store/UserStore');
var Constants = require('../Constants');
var _ = require("underscore");

function getDemoStoreUrl ( campaignHash, featureAuth ) {
    let server = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');

    // Set our default fake store url.
    let demoStoreUrl = "/dashboard/preview/slideout/preview.html";

    // Check if the user object includes a shopUrl that we can demo on.
    if (ConfigStore.previewUsesExternalSite(Constants.PRODUCT_SLIDEOUT) && UserStore.get("shopUrl")) {
        demoStoreUrl = UserStore.get("shopUrl"); 
    }

    // Get the url to redirect back to the app if the user activates the campaign from the preview
    let appRedirect = ConfigStore.getAppUrl(UserStore.getImmutableState().userDetails);

    // Create the final url.
    return demoStoreUrl + "?server=" + encodeURIComponent(server) + "&integration="+ ConfigStore.INTEGRATION +"&campaignHash=" + campaignHash + "&app=" + encodeURIComponent( appRedirect ) + "&featureAuth=" + featureAuth;
}

function getUrl ( campaignHash, featureAuth ) {
    // Get the url to redirect back to the app if the user activates the campaign from the preview
    let appRedirect = ConfigStore.getAppUrl(UserStore.getImmutableState().userDetails);
    
    let url = "/campaign/" + campaignHash + "/main?mode=preview&app=" + encodeURIComponent( appRedirect ) + "&featureAuth=" + featureAuth;

    // Check if the config specifies that we pass additional params to the preview. If so, add them.
    let params = ConfigStore.getThemePreviewUrlParams(Constants.PRODUCT_SOCIAL);
    _.mapObject( params, ( val, key ) => {
        url += "&" + key + "=" + encodeURIComponent(val);
    } );

    return url;
}

module.exports = {
    
    getDemoStorePreviewUrl: function ( product, campaignHash, isRedirected, featureAuth ) {
        if (isRedirected) {
            return "/dashboard/preview/previewredirect.html?"+encodeURIComponent( getDemoStoreUrl(campaignHash, featureAuth) );
        } else {
            return getDemoStoreUrl(campaignHash, featureAuth);
        }
    },

    getPreviewUrl: function ( product, campaignHash, isRedirected, featureAuth ) {
        if (isRedirected) {
            return "/dashboard/preview/previewredirect.html?"+encodeURIComponent( getUrl(campaignHash, featureAuth) );
        } else {
            return getUrl(campaignHash, featureAuth);
        }
    }

}
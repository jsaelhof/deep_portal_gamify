var UserStore = require("../../store/UserStore.js");
var TimezoneStore = require("../../store/TimezoneStore.js");
var i18n = require('../../store/i18nStore');
var CampaignStore = require('../../store/CampaignStore');

function defaultDetails () {
    // ***
    // TIMEZONE
    // Figure out this user's timezone. This is not required for creating a new campaign but is needed if we want the timezone to default to the user's timezone (Nice to have)
    let user = UserStore.get();
    
    // Get their default timezone
    let timezone = TimezoneStore.getTimezoneByOffset( i18n.moment.parseZone( new Date() ).utcOffset() / 60 );

    // If they have a timezone set in their user object, use that instead.
    // If after that timezone is still undefined, just get the GMT zone.
    if ( user.userDetails.timezone && TimezoneStore.getTimezoneByCID( user.userDetails.timezone ) ) {
        timezone = TimezoneStore.getTimezoneByCID( user.userDetails.timezone );
    } else if (!timezone) {
        timezone = TimezoneStore.getTimezoneByOffset(0);
    }
    // END TIMEZONE
    // ***

    // Ask the campaign store for the available features.
    // This in turn asks the ConfigStore for the information.
    // I don't know where the ConfigStore gets it, when ConfigStore is initialized, or how it knows what is enabled.
    let availableFeatures = CampaignStore.getAvailableFeatures();

    var campaignDetails = {
        name: i18n.stringFor( 'label_new_promotion_title' ),
        description: '',
        prizes: {}, // Not required to create the campaign but we need the default empty object for the portal UI to function. 
        timezone: timezone.cid,
        timezoneName: timezone.time,
        features: { // Not required to actually create the campaign on the server, but the game core needs this to operate the games so it needs to be included.
            leaderboard: { enabled: availableFeatures.indexOf("leaderboard") >= 0 },
            prizes: { enabled: availableFeatures.indexOf("prizes") >= 0 }
        },
        timestamps: {
            creation: Date.now(),
            modified: Date.now()
        },
        communication: { settings: { subscription: 'subscribed' } },
        forms: {}
    };

    return campaignDetails;
}

module.exports = {
    defaultDetails: defaultDetails
}
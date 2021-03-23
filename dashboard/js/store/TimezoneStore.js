var _               = require( 'underscore' );
var $               = require('jquery');
var EventDispatcher = require('../dispatcher/EventDispatcher');
var i18n            = require('../store/i18nStore');

var state = { timezones: [] };

var TimezoneStore = EventDispatcher.createDispatcher( module.exports, [
    "TimezonesLoaded",
    "TimezonesLoadError"
] );

TimezoneStore.initialize = function ( context ) {
    this.addOneTimeEventListener( {
        onTimezonesLoaded: function( e ) { context.next(); },
        onTimezonesLoadError: function( e ) { context.fail( e ); }
    } );
    loadTimezones( this );
};

TimezoneStore.getTimezones = function() { 
    return _.clone( state.timezones ); 
};

TimezoneStore.getTimezoneByCID = function ( timezoneCID ) {
    return _.where(state.timezones,{ "cid": timezoneCID })[0];
}

TimezoneStore.getTimezoneByOffset = function ( timezoneOffset ) {
    return _.where(state.timezones,{ "offset": timezoneOffset })[0];
}

TimezoneStore.getMomentInTimezone = function ( campaignDateString, timezoneCID ) {
    if (campaignDateString !== undefined) campaignDateString = campaignDateString.replace(/\//g, '-');
    return i18n.moment.tz( campaignDateString, timezoneCID );
}

function loadTimezones ( context ) {
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/timezones.json",
        success: function ( data ) {
            try {
                // parse the incoming timezone data and add the offset and formatted name to it.
                // We can't hardcode the offset because it changes based on daylight savings time.
                // Instead we'll get it from moment timezone lib.
                state.timezones = _.map( data, timezone => {
                    var offset = ( i18n.moment.tz.zone( timezone.cid ).offset( new Date() ) ) / ( -60 );
                    timezone.offset = offset;

                    var offsetStr = offset.toString();
                    var negative = offsetStr.indexOf( '-' ) !== -1;
                    var hours = parseInt( offsetStr.split( '.' )[ 0 ] );
                    var minutes = parseFloat( '0.' + ( offsetStr.split( '.' )[ 1 ] ) ) * 60;
                
                    if ( hours < 10 && hours > -1 ) {
                        hours = '+0' + hours;
                    } else if ( hours > -10 && hours < 0 ) {
                        hours = '-0' + hours.toString().split( '-' )[ 1 ];
                    } else {
                        if ( !negative ) {
                            hours = '+' + hours;
                        }
                    }
                    minutes = ( minutes < 10 ? '0' + minutes : minutes );
                
                    timezone.time = "GMT(" + hours + ':' + minutes + ") " + timezone.name;
                    return timezone;
                } );
                
                context.dispatchTimezonesLoaded( { state: state } );
            } catch ( e ) {
                state = { error: "Error parsing timezones file: " + e };
                context.dispatchTimezonesLoadError( { state: state } )
            }
        }.bind( this ),
        error: function ( xhr, status, error ) {
            state = {error: "Error parsing timezones file"};
            context.dispatchTimezonesLoadError( { state: state } )
        }.bind( context )
    } );
}
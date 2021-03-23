var $ = require('jquery');
var YAML = require('yamljs');
var CountryStore = require('./CountryStore');
var EventDispatcher = require('../dispatcher/EventDispatcher');
var moment = require('moment');
var zh_cn = require( 'moment/locale/zh-cn' );
var zh_tw = require( 'moment/locale/zh-tw' );
var moment_timezone = require( 'moment-timezone' );
var momentLocalizer = require( 'react-widgets-moment' );
var Mustache = require ( 'mustache' );

var state = {};

var i18nStore = EventDispatcher.createDispatcher(module.exports, [
    "i18nLoaded",
    "i18nLoadError"
]);


i18nStore.LANGUAGE = 'en-us'; //later we can load value from server to decide what the language should be.
i18nStore.moment = moment;
i18nStore.timezone = moment_timezone;

i18nStore.setLocale = function ( code ) {
    i18nStore.LANGUAGE = code;
    i18nStore.loadLanguage( code );
    moment.locale( i18nStore.LANGUAGE );
    momentLocalizer();
};

i18nStore.getCurrency = function (){
    var lang = i18nStore.getLocale();
    return CountryStore.getUsersCurrency(lang);
};

i18nStore.getLocale = function () {
    return i18nStore.LANGUAGE;
};

i18nStore.stringFor = function ( code, key, values ) {
    if ( code in state ) {
        var data = key ? state[ code ][ key ] : state[ code ];

        if ( values ) {
            data = Mustache.render( data, values );
        }

        return data;
    }
    if ( code ) {
       // console.error( 'i18nStore - code not found,', code );
    }
    return code;
};

i18nStore.date = function ( date, format, timezone ) {
    return timezone ? moment( new Date( date ) || moment() ).tz( timezone ).format( format || 'LLL' ) : moment( date || moment() ).format( format || 'LLL' );
};

i18nStore.timezone = function ( date ) {
    return moment_timezone.tz( date ).zoneAbbr();
};

i18nStore.currency = function ( number, currency ) {
    if ( !currency ) { currency = i18nStore.getCurrency(); }
    return parseFloat( number ).toLocaleString( i18nStore.LANGUAGE , { style: 'currency', currency: currency } );
};

i18nStore.currencySymbol = function ( currency ) {
    if ( !currency ) { return; }
    return i18nStore.currency( 1, currency ).split( '1' )[ 0 ];
};

i18nStore.initialize = function (context) {
    this.addOneTimeEventListener({
        oni18nLoaded: function(e) {
            context.next();
        },
        oni18nLoadError: function(e) {
            context.fail(e);
        }
    });
    this.setLocale( this.LANGUAGE );
};

i18nStore.loadLanguage = function ( locale ) {
    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: "/dashboard/language/" + locale + ".yaml",
        success: function (data) {
            try {
                state = YAML.parse(data) || {};
                this.dispatchi18nLoaded({state: state})
            } catch (ex) {
                state = {error: "Error parsing language file for locale: " + locale};
                this.dispatchi18nLoadError({state: state})
            }
        }.bind(this),
        error: function (xhr, status, error) {
            state = {error: "Error loading language file for locale: " + locale};
            this.dispatchi18nLoadError({state: state})
        }.bind(this)
    });
};

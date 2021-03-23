var _               = require( 'underscore' );
var $               = require('jquery');
var EventDispatcher = require('../dispatcher/EventDispatcher');

var state = { countries : [], provinces: [] };

var CountryStore = EventDispatcher.createDispatcher(module.exports, [
    "CountriesLoaded",
    "CountriesLoadError",
    "ProvincesLoaded",
    "ProvincesLoadError",
    "ProvincesRetrieved"
]);

CountryStore.initialize = function (context) {
    this.addOneTimeEventListener({
        onCountriesLoaded: function(e) {
            context.next();
        },
        onCountriesLoadError: function(e) {
            context.fail(e);
        },
        onProvincesLoaded: function(e) {
            context.next();
        },
        onProvincesLoadError: function(e) {
            context.fail(e);
        }
    });
    loadCountries( this );
    loadProvinces( this );
};

CountryStore.getCountries = function ( params ) {

    let _countries = _.sortBy( _.sortBy( state.countries, 'countryName' ), 'mainCountryOrder' ); // sort Alphabetically and then by mainCountryOrder key

    if ( !params ) { return _countries; }

    let res = [];

    _.forEach( params, function ( value, param ) {
        switch ( param ) {
            case 'countryCodes':
                if ( !Array.isArray( value ) ) { value = [ value ]; }
                res = _.filter( _countries, function ( country ) { return value.indexOf( country.countryCodeAlpha2 ) !== -1 } );
                break;
            case 'filter':
                if ( !Array.isArray( value ) ) { value = [ value ]; }
                res = _.filter( _countries, function ( country ) { return value.indexOf( country.countryCodeAlpha2 ) === -1 } );
                break;
            default:
                res = _countries;
                break;
        }
    } );

    return res;
};

CountryStore.getCountry = function ( cc, getCountryName ) {
    var result = false;
    _.map( state.countries, function ( country ) {
        if ( country.countryCodeAlpha2 === cc ) {
            if(getCountryName){
                result = country.countryName;
            } else {
                result = country.countryCodeAlpha2;
            }
        }
    });
    return result;
};

CountryStore.getUsersCurrency = function ( cc ) {
    var result = "";
    _.forEach( state.countries, function ( value, key, list ) {
        for ( var i = 0; i < value.languages.length; i++ ) {
            if ( value.languages[ i ].toLowerCase() === cc ) {
                result = value.currencyCode;
            }
        }
    } );
    return result;
};

CountryStore.getProvinces = function ( params ) {
    if ( !params ) { return state.provinces; }
    var res = [];
    _.forEach( params, function ( value, param ) {
        switch ( param ) {
            case 'countryCodes':
                if ( !Array.isArray( value ) ) { value = [ value ]; }
                res = _.filter( state.provinces, function ( province ) { return value.indexOf( province.cc ) !== -1 } );
                break;
            case 'provinceCodes':
                if ( !Array.isArray( value ) ) { value = [ value ]; }
                res = _.filter( state.provinces, function ( province ) { return value.indexOf( province.sd ) !== -1 } );
                break;
            default:
                res = state.provinces;
                break;
        }
    });
    return res;
};

function loadCountries(context) {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/countries.json",
        success: function (data) {
            try {
                state.countries = data;
                context.dispatchCountriesLoaded({state: state});
            } catch (ex) {
                state = {error: "Error parsing countries file: " + ex};
                context.dispatchCountriesLoadError({state: state})
            }
        }.bind(this),
        error: function (xhr, status, error) {
            state = {error: "Error parsing countries file"};
            context.dispatchCountriesLoadError({state: state})
        }.bind(context)
    });
}

function loadProvinces ( context ) {
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/provinces.json",
        success: function ( data ) {
            try {
                state.provinces = data;
                context.dispatchProvincesLoaded( { state: state } );
            } catch (ex) {
                state = { error: "Error parsing provinces file: " + ex };
                context.dispatchProvincesLoadError( { state: state } );
            }
        }.bind( this ),
        error: function (xhr, status, error) {
            state = { error: "Error parsing provinces file" };
            context.dispatchProvincesLoadError( { state: state } );
        }.bind( context )
    });
}
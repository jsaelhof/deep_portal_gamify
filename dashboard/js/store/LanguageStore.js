var _               = require( 'underscore' );
var $               = require( 'jquery' );
var EventDispatcher = require( '../dispatcher/EventDispatcher' );

var state = { languages: [] };

var LanguageStore = EventDispatcher.createDispatcher( module.exports, [
    "LanguagesLoaded",
    "LanguagesLoadError",
]);

LanguageStore.initialize = function (context) {
    this.addOneTimeEventListener( {
        onLanguagesLoaded: function () { context.next(); },
        onLanguagesLoadError: function ( e ) { context.fail( e ); }
    } );
    loadLanguages( this );
};

LanguageStore.getLanguages = function ( params ) {
    if ( !params ) { return state.languages; }
    var res = [];
    _.forEach( params, function ( value, param ) {
        switch ( param ) {
            case 'languageCodes':
                if ( !Array.isArray( value ) ) { value = [ value ]; }
                res = _.filter( state.languages, function ( lang ) { return value.indexOf( lang.code ) !== -1 } );
                break;
            default:
                res = state.languages;
                break;
        }
    } );
    return res;
};

LanguageStore.getLanguage = function ( code ) {
    var result = false;
    _.map( state.languages, function ( lang ) {
        if ( lang.code === code ) {
            result = language;
        }
    });
    return result;
};

function loadLanguages ( context ) {
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/languages.json",
        success: function ( data ) {
            try {
                state.languages = data;
                context.dispatchLanguagesLoaded( { state: state } );
            } catch ( e ) {
                state = { error: "Error parsing languages file: " + e };
                context.dispatchLanguagesLoadError( { state: state } );
            }
        }.bind( this ),
        error: function ( xhr, status, error ) {
            state = { error: "Error parsing languages file" };
            context.dispatchLanguagesLoadError( { state: state } );
        }.bind( context )
    } );
}
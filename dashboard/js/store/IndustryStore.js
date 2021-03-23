var $               = require( 'jquery' );
var EventDispatcher = require( '../dispatcher/EventDispatcher' );

var state = { industries: [] };

var IndustryStore = EventDispatcher.createDispatcher( module.exports, [
    "IndustriesLoaded",
    "IndustriesError"
] );

IndustryStore.initialize = function ( context ) {
    this.addOneTimeEventListener( {
        onIndustriesLoaded: function ( e ) {
            context.next();
        },
        onIndustriesError: function ( e ) {
            context.fail( e );
        },
    } );
    loadIndustries( this );
};

IndustryStore.getIndustries = function () { return state.industries; };

function loadIndustries ( context ) {
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/industries.json",
        success: function ( data ) {
            try {
                state.industries = data;
                context.dispatchIndustriesLoaded( { state: state } );
            } catch ( ex ) {
                state = { error: "Error parsing industries file: " + ex };
                context.dispatchIndustriesError( {state: state } );
            }
        }.bind( this ),
        error: function ( xhr, status, error ) {
            state = { error: "Error loading countries file" };
            context.dispatchIndustriesError( { state: state } )
        }.bind( context )
    } );
}
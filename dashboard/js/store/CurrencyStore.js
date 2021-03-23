var _               = require( 'underscore' );
var $               = require('jquery');
var EventDispatcher = require('../dispatcher/EventDispatcher');

var state = { currencies: [] };

var CurrencyStore = EventDispatcher.createDispatcher(module.exports, [
    "CurrenciesLoaded",
    "CurrenciesError"
]);

CurrencyStore.initialize = function (context) {
    this.addOneTimeEventListener({
        onCurrenciesLoaded: function(e) {
            context.next();
        },
        onCurrenciesError: function(e) {
            context.fail(e);
        },
    });
    loadCurrencies( this );
};

CurrencyStore.getAllCurrencies = function ( cc ) {
    var alphaSortedCurrencies = _.sortBy(state.currencies, 'curCode');
    var commonCurrenciesFirst = _.sortBy(alphaSortedCurrencies, 'commonCurrencyOrder');
    var currencies = [];
    _.map(commonCurrenciesFirst, function(currency, key){
        currencies.push(currency);
    });
    return currencies;
};


function loadCurrencies(context) {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/dashboard/assets/currencies.json",
        success: function (data) {
            try {
                state.currencies = data;
                context.dispatchCurrenciesLoaded({state: state});
            } catch (ex) {
                state = {error: "Error parsing countries file: " + ex};
                context.dispatchCurrenciesError({state: state})
            }
        }.bind(this),
        error: function (xhr, status, error) {
            state = {error: "Error parsing countries file"};
            context.dispatchCurrenciesError({state: state})
        }.bind(context)
    });
}
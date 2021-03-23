var reactGa = {
    loadScript: function () {
        ( function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m);
        } )( window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga' );
    },
    initialize: function ( id, options ) { ga( 'create', id, ( options ? options : {} ) ); },
    pageView: function ( path, name ) { if ( typeof ga === 'function' ) { ga( ( name ? name + '.' : '' ) + 'send', 'pageview', path ); } },
    event: function(params){
        ga('send', params);
        console.log(params);
    },
    ecommerce: {
        load: function () {
            ga( 'require', 'ecommerce' );
        },
        addItem: function ( params ) {
            if ( typeof ga === 'function' ) {
                ga( 'ecommerce:addItem', params );
            }
        },
        addTransaction: function ( params ) {
            if ( typeof ga === 'function' ) {
                ga( 'ecommerce:addTransaction', params );
            }
        },
        send: function () {
            if ( typeof ga === 'function' ) {
                ga( 'ecommerce:send' );
            }
        }
    }
};

module.exports = reactGa;
import $ from 'jquery';
window.$ = window.jQuery = $;
import 'babel-polyfill';

import React from 'react';
import { browserHistory as History, Router } from 'react-router';
import Routes from './routes/Routes.jsx';
import ReactDom from 'react-dom';

import FBQ from './components/common/FacebookPixel.jsx';
import RpcConnection from './rpc/RpcConnection';
import Initializer from './dispatcher/Initializer';
import i18n from './store/i18nStore';
//import CurrencyStore from './store/CurrencyStore';
import CountryStore from './store/CountryStore';
import TimezoneStore from './store/TimezoneStore';
import UserStore from './store/UserStore';
//import LanguageStore from './store/LanguageStore';
//import IndustryStore from './store/IndustryStore';
import ConfigStore from './store/ConfigStore';
import ErrorStore from './store/ErrorStore';
import ErrorPage from './components/shared/ErrorPage.jsx';

JSON.clone = function ( obj ) {
    return JSON.parse( JSON.stringify( obj ) );
};

let Main = {
    onInitCompleted ( e ) {
        FBQ.loadScript();
        let fbqinit = FBQ.load();
        fbqinit( 'init', '1550225785286611' );

        // if ( window.$zopim && window.$zopim.livechat ) {
        //     window.$zopim.livechat.sendVisitorPath();
        // }

        ReactDom.render( <Router history={History}>{Routes}</Router>, document.getElementById( 'react-target' ) );
    },
    onInitFailed ( e ) {
        let message = e && e.error && e.error.message ? i18n.stringFor( e.error.message ) : i18n.stringFor( e.error.state.error );

        let error = ErrorStore.setError( message.error_desc, message.error_code, e, undefined, undefined, { hideDashboardButton: true } );

        ReactDom.render(
            <div>
                <ErrorPage error={error} />
            </div>,
            document.body
        );
    },
    onAjaxError ( e ) {
        ReactDom.render( <h2>Error: {e}</h2>, document.body );
    },
    run () {
        $.getScript("https://js.stripe.com/v3/");

        let initializer = new Initializer();

        initializer.addOneTimeEventListener( this );

        initializer.addInitializer( i18n );
        
        // Only initialize the config store if this is not the external error route.
        // If it tries to init the config, it will fail to find the config file and will throw a different error before the external error page can load.
        // I really don't like this but it'll have to do for the moment until i re=work the error system.
        if (!window.location.pathname.match(/\/dashboard\/(\w*)\/error$/)) initializer.addInitializer( ConfigStore );

        initializer.addInitializer( { initialize: function ( context ) {
            window.portalConnection = new RpcConnection("/portal/api/");
            if ( portalConnection.error ) {
                context.fail( portalConnection.error );
            } else {
                window.portalConnection.setHeaderKey( ConfigStore.getIntegrationType() );

                // Now that the portal connection is set up, ask the server for the app id. This is used by some integrations (shopify, big commerce)
                ConfigStore.getAppId();

                context.next();
            }
        } } );

        //initializer.addInitializer( CurrencyStore );
        initializer.addInitializer( CountryStore );
        initializer.addInitializer( TimezoneStore );
        //initializer.addInitializer( UserStore );
        //initializer.addInitializer( LanguageStore );
        //initializer.addInitializer( IndustryStore );
        initializer.initialize();
    }
};

Main.run();
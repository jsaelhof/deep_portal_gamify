import React from 'react';
import UncaughtException from '../common/UncaughtException.jsx';
import UserStore from '../../store/UserStore';
import LoginModal from '../user/LoginModal.jsx';
import TopBar from '../shared/nav/TopBar.jsx';
import ErrorStore from '../../store/ErrorStore';
import ErrorPage from './ErrorPage.jsx';
import {browserHistory as History} from 'react-router';
import CampaignStore from '../../store/CampaignStore';
import Tour from '../portal/tour/Tour.jsx';

class Console extends React.Component {
    constructor( props ) {
        super( props );
        this.state = { 
            showLogin: false,
            init: true
        };
    }

    componentWillUnmount () {
        portalConnection.removeEventListener( this );
        UserStore.removeEventListener( this );
        ErrorStore.removeEventListener( this );
    }

    componentWillMount () {
        ErrorStore.addEventListener( this );
        portalConnection.addEventListener( this );
        UserStore.addEventListener( this );

        // If there was a filter passed on the query string, store it so that later this can be applied.
        // This was built for ITN (Tradeshow) so that they could pass in a campaignHash and restrict the dashboard to only displaying that one campaign.
        if (this.props.location.query.campaignFilter) {
            CampaignStore.setCampaignFilter(this.props.location.query.campaignFilter.split(","));
        }

        // Check if we need to handle login via token.
        // The first case is if the URL has a t=<token> query string parameter on it. In that case, always ignore everything else and just log in.
        // Once logged in, we need to strip the token from the query and refresh the page to the same URL minus the token.
        // The second case is if there is a token in the local storage AND we don't have user details yet.
        // In this case, we need to log the user in so we get the user details first.
        // In both cases, we need to make sure that none of the children of the route attempt to render before we get user details because some depend on it.
        // If neither case exists, then the user is logged in or there was no session and the user needs to log in.
        // All paths eventually lead to initComplete.
        if (this.props.location.query && this.props.location.query.t) {
            UserStore.tokenLogin( this.props.location.query.t, () => {
                this.initComplete();
            } );
        } else if ( UserStore.isAuthenticated() && !UserStore.getImmutableState().userDetails ) {
            UserStore.tokenLogin( UserStore.isAuthenticated(), () => {
                this.initComplete();
            } );
        } else {
            this.initComplete();
        }
    }
    // Initialization is complete. If there's a token in the query, we need to strip it and then redirect to the url.
    // This prevents the page from logging in every time the page is refreshed.
    // If there's no token, move ahead with the standard login check to validate and handle displaying the login form if needed.
    initComplete () {
        if (this.props.location.query && this.props.location.query.t) {
            // Rebuild the query without the t param
            let search = [];

            for (let key in this.props.location.query) {
                if (key !== "t") {
                    search.push( key + "=" + this.props.location.query[key] );
                }
            }

            let redirect = this.props.location.pathname + ( search.length > 0 ? "?" + search.join("&") : "" );

            // DO NOT USE HISTORY HERE. 
            // Using window.location causes this component to re-mount which is what we need in order for check login state to execute with the argument to grab the subscription
            window.location.href = redirect;
        } else {
            this.checkLoginState();
        }
    }

    /**
     * Check here if the user is authenticated.
     * It's not good enough to do this in componentWillMount because when you switch from one route to another, this component does not re-mount, it just updates with new children.
     */
    componentWillReceiveProps ( newProps ) {
        this.checkLoginState();
    }

    checkLoginState ( getSubscription ) {
        if ( !this.state.error && !UserStore.isAuthenticated() ) { 
            this.setState( { showLogin: true, init: false } );
        } else {
            // Ask the server for the available plans if they are now logged in AND we haven't got this information already.
            // We do this right away so that when we want to show the subscription dialog (triggered at various places)
            // we will have the information available immediately.
            // We arent going to do anything with the information here...the UserStore caches it internally 
            // and makes it available by calling UserStore.getAvailablePlanList()
            if (!UserStore.hasAvailablePlanList()) {
                UserStore.getSubscriptionPlanList( planResponse => {
                    // Ask for this users plan status
                    UserStore.getSubscriptionInfo( infoResponse => {
                        this.setState( { showLogin: false, init: false } );
                    } );
                } );
            } else {
                this.setState( { showLogin: false, init: false } );
            }
        }
    }

    onRequestDone ( e ) {
        // HandleOwnError is a bit of a hack i put in. The global handler always pops up the temp tech difficulties box if there's an error regardless of whether the code wants to handle it
        // So i added this flag in tp tell the gobal handler to skip it because the code initiating the request is going to display the error itself.
        if ( e.response && e.response.hasErrors() && !e.handleOwnError ) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState( { lastResponse: null } );
        }

        if ( !UserStore.isAuthenticated() ) {
            if ( !this.state.showLogin ) {
                this.setState( { showLogin: true } );
            }
        }
    }

    onUserAuthenticated ( e ) {
        if ( e.response && !e.response.hasErrors() ) {
            UserStore.getSubscriptionInfo( () => {
                this.setState( { showLogin: false }, () => {
                    portalConnection.executeFailedRequests();
                } );
            } );
        }
    }

    dismissError () {
        this.setState( { lastResponse: null } );
    }

    onRequestLogin () {
        this.setState( { showLogin: true } ); 
    }

    onHeadersUpdated (e) {
        if ( !UserStore.isAuthenticated() ) { 
            this.setState( { showLogin: true } ); 
        } 
    }

    // Called by the login modal when it is hidden. Nothing currnetly to do here.
    onLoginHide () {}

    // Called by the login modal when the user logs in successfully.
    onAuthentication () { 
        this.setState( { showLogin: false } ); 
    }

    

    // Handle errors set using the ErrorStore.
    // These errors could come from any child component and may be several components deep.
    // Display the first error even though there may be more errors logged in the ErrorStore.
    // This prevents additional errors from causing flashing error screens.
    // Also, the first error is likely the real problem...additional errors are often a result of the first.
    onError ( error ) {
        let fe = ErrorStore.getFirstError();

        // Check if the error is due to a session problem that can be fixed by just logging in again.
        // FIXME: These two errors (session-token and request) are due to session expired and session missing respectively. We need to refactor the system to send these as application errors and not validation errors. When we do, this needs to be changed along with the RPC module itself.
        if (fe.data && fe.data.hasValidationErrors && fe.data.hasValidationErrors() && fe.data.errors.validation_errors.filter( ve => ve.field === "session-token" || ve.field === "request" ).length > 0) {
            this.setState({ showLogin: true });
        } else {
            this.setState({ error: fe });
        }
    }

    // The ErrorStore has been cleared, reset any error display.
    onClearErrors () {
        this.setState({ error: undefined });
    }

    // Allows the nav in the TopBar component to send out events
    onNavEvent ( eventName ) {
        switch (eventName) {
            case "tour":
                this.setState({ forceTour: true });
                break;
        }
    }

    render () {
        if (this.state.init) return null;

        return (
            <div id="console">
                <div className="notification-area">
                    <UncaughtException response={this.state.lastResponse} onDismiss={this.dismissError.bind( this )} />
                </div>

                {
                    this.state.error ?
                        <div>
                            <ErrorPage error={this.state.error} />
                        </div>
                        :
                        this.state.showLogin ? 
                            <LoginModal show={this.state.showLogin} onHide={this.onLoginHide.bind( this )} onAuthentication={this.onAuthentication.bind( this )} lastResponse={this.state.lastResponse} /> 
                            :
                            <div>
                                {/* Create a spacer to move the content down below the  */}
                                <div className="top-bar-spacer"></div>
                                { this.props.children }
                                <TopBar onNavEvent={this.onNavEvent.bind(this)} />

                                <Tour 
                                    forceTour={this.state.forceTour}
                                    onTourComplete={ () => {
                                        this.setState({ forceTour: false });
                                    } }
                                />
                            </div>
                }
            </div>
        );
    }
}

module.exports = Console;
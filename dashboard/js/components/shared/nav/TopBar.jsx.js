import React from 'react';
import UserStore from '../../../store/UserStore';
import SubscriptionUtils from '../util/SubscriptionUtils';
import i18n from '../../../store/i18nStore';
import NavMenu from './NavMenu.jsx';
import ConfigStore from '../../../store/ConfigStore';
import _ from 'underscore';


class TopBar extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            subscriptionSupported: undefined,
            subscriptionPending: false,
            hasSubscription: false,
            accountName: this.formatAccountName(UserStore.getImmutableState().userDetails)
        }
    }

    componentWillMount () {
        UserStore.addEventListener( this );
        //UserStore.getSubscriptionInfo( ConfigStore.getProductTag() );
    }

    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }

    // This gets called when the user is routed back from paypal and their subscription is activated by our system.
    // We'll use this to know that the user now has a subscription
    // onSubscriptionExecuted ( event ) {
    //     UserStore.getSubscriptionInfo( ConfigStore.getProductTag() );
    // }

    onUserUpdateInfo ( event ) {
        if (event.state && event.state.userDetails) {
            this.setState( { accountName: this.formatAccountName(event.state.userDetails) } )
        }
    }

    // onSubscriptionListRetrieved ( event ) {
    //     if (event.response && event.response.hasErrors()) {
    //         // TODO: Handle the error.
    //     } else {
    //         // First check to see if subscriptions are supported by the product (sent as the tag on the request).
    //         // If it comes back "UNSUPPORTED" then this product doesn't use subscriptions. Just set it to false and move on.
    //         // If the response is NOT unsupported, then check if the response has a pending subscription. If so, the user is being subscribed.
    //         // Set has subscription to true while we wait for it to complete, then try again in a second.
    //         if (event.response.result.status === "UNSUPPORTED") {
    //             this.setState( { subscriptionSupported: false } );
    //         } else if (event.response.result.status === "PENDING") {
    //             this.setState( { 
    //                 subscriptionPending: true,
    //                 subscriptionSupported: true
    //             } );
    //             setTimeout( () => { UserStore.getSubscriptionInfo( ConfigStore.getProductTag() ) }, 1000 );
    //         } else if (event.response.result.subscribed && event.response.result.subscribed.length > 0) {
    //             // Get the first subscription.
    //             // Gamify should only ever have one.
    //             this.setState( {
    //                 hasSubscription: true,
    //                 subscriptionSupported: true,
    //                 extendedSubscriptionInfo: SubscriptionUtils.getExtendedSubscriptionInfo(event.response.result.subscribed[0])
    //             } );
    //         }
    //     }
    // }

    formatAccountName ( user ) {
        let accountName = "Menu";
        
        if (ConfigStore.getMenuDisplay()) {
            accountName = i18n.stringFor(ConfigStore.getMenuDisplay());
        } else if (user) {
            if (user.firstName && user.lastName) {
                accountName = user.firstName + " " + user.lastName.charAt(0) + ".";
            } else if (user.firstName) {
                accountName = user.firstName;
            }
        }

        return accountName;
    }

    openNav () {
        this.setState( { showNav: true } );
    }

    closeNav () {
        this.setState( { showNav: false });
    }

    render() {
        return (
            <div id="topbar" className="top-bar">
                <div className="top-bar-logo">
                    <img src="/dashboard/images/nav/deepmarkit.png"/>
                </div>

                { this.state.hasSubscription && this.state.extendedSubscriptionInfo && this.state.extendedSubscriptionInfo.isInTrial ?
                    <div className="top-bar-notice">
                        {this.state.extendedSubscriptionInfo.trialEndsToday ? i18n.stringFor("label_trial_ends_today") : i18n.stringFor("label_trial_days_remaining").replace("{0}", this.state.extendedSubscriptionInfo.trialDaysRemaining) }
                    </div>
                    : 
                    null 
                }

                { !ConfigStore.getNavEnabled() || !ConfigStore.navHasEnabledItems() ?
                    null
                    :
                    <div className="top-bar-nav">
                        <div className={ this.state.showNav ? "top-bar-account menu-open" : "top-bar-account menu-closed" } onClick={this.openNav.bind(this)}>
                            <div className="account-wrapper">
                                <div className="account-icon material-icons">account_circle</div>
                                <div className="account-name">{this.state.accountName}</div>
                                <div className="account-arrow material-icons">{ this.props.menuOpen ? "keyboard_arrow_up" : "keyboard_arrow_down" }</div>
                            </div>
                        </div>
                    </div>
                }

                { this.state.showNav ? 
                    <NavMenu 
                        onNavMenuClose={this.closeNav.bind(this)} 
                        onNavEvent={this.props.onNavEvent}
                        showSubscribe={!this.state.subscriptionPending && !this.state.hasSubscription && this.state.subscriptionSupported} />
                    : 
                    null 
                }
            </div>
        );
    }
}

module.exports = TopBar;
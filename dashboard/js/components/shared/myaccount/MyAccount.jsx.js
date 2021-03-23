import React from 'react';
import ActionBar from '../nav/ActionBar.jsx';
import UserDetails from './UserDetails.jsx';
import Subscription from './SubscriptionStatus.jsx';
import ChangePassword from './ChangePassword.jsx';
import Welcome from './Welcome.jsx';
import UserStore from '../../../store/UserStore';
import SubscriptionManager from '../payment/SubscriptionManager.jsx';
import ConfigStore from '../../../store/ConfigStore';
import ErrorStore from '../../../store/ErrorStore';
import StripePaymentDialog from '../payment/StripePaymentDialog.jsx';
import Loading from '../Loading.jsx';
import _ from 'underscore';

class MyAccount extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            subscriptionPlans: undefined,
            cards: undefined,
            showStripePaymentDialog: false,
            showProcessing: false
        }
    }

    componentDidMount () {
        UserStore.getSubscriptionInfo( this.handleSubscriptionInfo.bind(this) );
    }

    handleSubscriptionInfo ( response ) {
        if (response.hasErrors()) {
            ErrorStore.rpcResponseError(response);
        } else {
            // First check if the response has a pending subscription. If so, the user is being subscribed. Retry until it succeeds or fails.
            if (response.result.status === "PENDING") {
                setTimeout( () => { UserStore.getSubscriptionInfo( this.handleSubscriptionInfo ) }, 1000 );
            } else if (response.result.subscribed && response.result.subscribed.length > 0) {
                // Loop through all subscriptions. If all subs are value = 0.00 then they are on FREE and we should show the subscribe button
                // If there's at least one sub with a value > 0, then show the details. Currently there can only be one so it's safe to jsut use that.
                // If we ever add a second tier, then we'd need to rethink the interface and figure out how to show everything they are subscribed to.
                let paidPlan = false;

                if (response.result.subscribed) {
                    response.result.subscribed.forEach( plan => {
                        let planValue = parseFloat(plan.subscriptionInfo.details.amount.value);
                        if (planValue > 0) paidPlan = plan;
                    } );
                }

                // Save their subscription list, and info about whether they are paying or not
                this.setState( {
                    isFreeSubscription: !paidPlan,
                    paidPlan: paidPlan,
                    subscriptionPlans: response.result.subscribed
                }, () => {
                    this.updateCards();
                } );
            } else {
                this.setState( {
                    subscriptionPlans: undefined
                } )
            }
        }
    }

    updateCards ( onComplete ) {
        // If this isn't shopify and they are subscribed, get the list of credit cards
        // TODO: Maybe make a config value to indicate if the integration uses it's own payment system or our stripe system.
        if (ConfigStore.getIntegrationType() !== "shopify" && !this.state.isFreeSubscription) {
            UserStore.getCardList( response => {
                if (response.hasErrors()) {
                    ErrorStore.rpcResponseError(response);
                } else {
                    this.setState( {
                        cards: response.result.cards
                    }, () => {
                        if (onComplete) onComplete();
                    });
                }
            } );
        }
    }

    onCancelSubscription () {
        this.setState( {
            subscriptionPlans: undefined
        } );
        UserStore.getSubscriptionInfo( this.handleSubscriptionInfo.bind(this) );
    }

    onSubscribe () {
        // Show subscribe dialog
        this.subscriptionManager.showSubscribeDialog();
    }

    onSubscribed () {
        UserStore.getSubscriptionInfo( this.handleSubscriptionInfo.bind(this) );
    }

    onAddCard () {
        this.setState({ showStripePaymentDialog: true });
    }

    onCancelAddCard () {
        this.setState({ showStripePaymentDialog: false });
    }

    onCardToken ( cardToken ) {
        this.setState({ showStripePaymentDialog: false, showProcessing: true }, () => {
            UserStore.addCard( cardToken, response => {
                if (response.hasErrors()) {
                    ErrorStore.rpcResponseError(response);
                } else {
                    this.updateCards( () => {
                        this.setState({ showProcessing: false });
                    } );
                }
            } );
        });
    }

    render () {
        return (
            <div className="m-b-4">
                <ActionBar buttonGroup="myaccount" />
                <div className="action-bar-spacer"/>

                <Welcome />

                { ConfigStore.getPermission("account","subscription") ?
                    <Subscription 
                        subscriptionPlans={this.state.subscriptionPlans}
                        cards={this.state.cards}
                        isFreeSubscription={this.state.isFreeSubscription}
                        paidPlan={this.state.paidPlan}
                        onSubscribe={this.onSubscribe.bind(this)}
                        onCancelSubscription={this.onCancelSubscription.bind(this)}
                        onAddCard={this.onAddCard.bind(this)}
                    />
                    :
                    null
                }
            
                { ConfigStore.getPermission("account","user") ?
                    <UserDetails />
                    :
                    null
                }
            
                { ConfigStore.getPermission("account","password") ?
                    <ChangePassword />
                    :
                    null
                }

                <SubscriptionManager
                    onSubscribed={this.onSubscribed.bind(this)}
                    ref={(subscriptionManager) => { this.subscriptionManager = subscriptionManager; }}
                />

                {/* This is kept on-screen all the time and toggled internally because strip loads it's 
                    component in an iframe and it takes a second. By doing this it's ready when we display this. */}
                <StripePaymentDialog
                    show={this.state.showStripePaymentDialog}
                    primaryButton="Add Card"
                    onCardToken={this.onCardToken.bind(this)}
                    onCancel={this.onCancelAddCard.bind(this)}
                />

                {
                    this.state.showProcessing ?
                        <Loading modal={true} title="Updating Your Payment Method" />
                        :
                        null
                }
            </div>
        )
    }

}

module.exports = MyAccount;
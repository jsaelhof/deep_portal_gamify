import React from 'react';
import UserStore from '../../../store/UserStore';
import ConfigStore from '../../../store/ConfigStore';
import ErrorStore from '../../../store/ErrorStore';
import Loading from '../Loading.jsx';
import SubscriptionConfirmDialog from './SubscriptionConfirmDialog.jsx';
import StripePaymentDialog from './StripePaymentDialog.jsx';
import BillingInformation from './BillingInformation.jsx';
import Confirm from '../Confirm.jsx';


class SubscriptionManager extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            showSubscribeDialog: false,
            showStripePaymentDialog: false,
            showProcessing: false,
            showRedirecting: false,
            showCancelling: false,
            showBillingInformation: false,
            paidPlan: undefined,
            paymentDetails: undefined,
            retry: 0
        }
    }

    componentWillMount () {
        // Check if there are any messages left by the server in the User object.
        // If so, handle them as required.
        // This occurs if the payment was done in an external redirect like shopify's payment portal.
        for (let messageId in UserStore.getMessages()) {
            switch (messageId) {
                case "paymentComplete":
                    // Attempt to delete a paymentComplete key.
                    // If it exists, the user's payment is complete and it will be removed.
                    // If not, this call does nothing.
                    if (UserStore.hasMessage( "paymentComplete" )) {
                        let paymentComplete = UserStore.getMessage("paymentComplete");
                        switch (paymentComplete.status) {
                            case "success":
                                this.setState( { showPaymentComplete: true } );
                                break;
                            case "cancel":
                                this.setState( { showPaymentCancelled: true } );
                                break;
                        }
                        
                        UserStore.removeMessage( "paymentComplete" );
                    }
                    break;
            }
        }
    }

    // Public mehtods called from outside this class

    showSubscribeDialog () {
        let plans = UserStore.getAvailablePlanList();

        // Look for a paid plan.
        // At the moment we only have one option > 0.
        if (plans) {
            let paidPlan = undefined;

            plans.forEach( plan => {
                if (parseFloat(plan.details.amount.value) > 0) {
                    paidPlan = plan;
                }
            } );

            this.setState( { 
                paidPlan: paidPlan,
                showSubscribeDialog: true
            } );
        } else {
            // If for some reason the plans were not retrieved yet, get them and then recall this function.
            // This should never happen but i had seen issues when this code was in componentWillMount so i moved it here
            // to be on-demand when the user invokes the subscription dialog and added this fallback.
            // This could create an endless loop if there's a problem getting plans.
            this.setState( { retry: this.state.retry + 1 }, () => {
                if (this.state.retry < 10) {
                    UserStore.getSubscriptionPlanList( () => { this.showSubscribeDialog() } );
                }
            } );
        }
    }

    // End public methods

    onWillSubscribe () {
        if (ConfigStore.getIntegrationType() === "shopify") {
            this.setState( { showRedirecting: true, showSubscribeDialog: false }, () => {
                UserStore.sendAuthorizeSubscription ( this.state.paidPlan.code, ConfigStore.getAppUrl(UserStore.getImmutableState().userDetails), authorizeResponse => {
                    if (authorizeResponse.hasErrors()) {
                        ErrorStore.rpcResponseError( authorizeResponse );
                    } else {
                        if (authorizeResponse.result.redirect) {
                            // Redirect to the external paymnet page.
                            // This leaves the app entirely.
                            // Until the external portion is completed the user will be off-site

                            //if in an iframe, redirect the parent
                            if ( window.top ) { 
                                window.top.location.href = authorizeResponse.result.redirect;
                            } else {
                                window.location.replace( authorizeResponse.result.redirect );
                            }
                        } else {
                            ErrorStore.setError("No payment redirection url was found");
                        }
                    }
                } );
            } );
        } else {
            this.setState( { showBillingInformation: true, showSubscribeDialog: false } );
        }
    }

    onCardToken ( cardToken ) {
        this.setState({ showStripePaymentDialog: false, showProcessing: true }, () => {
            UserStore.sendCreateSubscription( this.state.paidPlan.code, cardToken, createResponse => {
                if (createResponse.hasErrors()) {
                    if (createResponse.hasApplicationError() && createResponse.errors.application_error.errorCode === "error_unknown_payment_execution" ) {
                        this.setState({ 
                            showProcessing: false,
                            cardError: createResponse.errors.application_error
                        })
                    } else {
                        ErrorStore.rpcResponseError( createResponse );
                    }
                } else {
                    UserStore.getSubscriptionInfo( () => {
                        if (this.props.onSubscribed) this.props.onSubscribed();
                        this.setState({ showPaymentComplete: true, showProcessing: false });
                    } );
                }
            }, true);
        });
    }

    onCancel () {
        this.setState( {
            showStripePaymentDialog: false,
            showSubscribeDialog: false,
            showBillingInformation: false
        }, () => {
            if (this.props.onSubscriptionDialogCancel) this.props.onSubscriptionDialogCancel();
        } );
    }

    onConfirmPaymentComplete () {
        this.setState({ showPaymentComplete: false });
    }

    onConfirmPaymentCancelled () {
        this.setState({ showPaymentCancelled: false });
    }

    onBillingInformationComplete () {
        UserStore.sendInquireSubscription(this.state.paidPlan.code, inquireResponse => {
            // Make sure to put the payment details in the list of state updates before the showStripePayment otherwise it never gets the update.
            this.setState({ 
                paymentDetails: inquireResponse.result,
                showBillingInformation: false, 
                showStripePaymentDialog: true
            });
        } );
    }

    onCardErrorConfirm () {
        this.setState( { 
            cardError: undefined,
            showStripePaymentDialog: true 
        } );
    }

    onCardErrorSupport () {
        window.open("https://support.deepmarkit.com/hc/en-us/requests/new", "_blank")
    }
    
    render() {
        if (!this.state.paidPlan) return null;

        return (
            <div>
                { 
                    this.state.showSubscribeDialog ?
                        <SubscriptionConfirmDialog
                            paidPlan={this.state.paidPlan}
                            onConfirm={this.onWillSubscribe.bind(this)}
                            onCancel={this.onCancel.bind(this)}
                        />
                        :
                        null
                }

                {
                    this.state.showBillingInformation ?
                        <BillingInformation
                            onComplete={this.onBillingInformationComplete.bind(this)}
                            onCancel={this.onCancel.bind(this)}
                        />
                        :
                        null
                }

                {/* This is kept on-screen all the time and toggled internally because strip loads it's 
                    component in an iframe and it takes a second. By doing this it's ready when we display this. */}
                <StripePaymentDialog
                    show={this.state.showStripePaymentDialog}
                    paymentDetails={this.state.paymentDetails}
                    primaryButton="Submit Payment"
                    onCardToken={this.onCardToken.bind(this)}
                    onCancel={this.onCancel.bind(this)}
                >
                    {
                        this.state.paymentDetails ?
                            <div className="m-t-4 m-b-8">
                                <div className="payment-form-row">
                                    <div>Subtotal</div>
                                    <div>{"$"+this.state.paymentDetails.amount}</div>
                                </div>
                                <div className="payment-form-row">
                                    <div>Applicable Tax { this.state.paymentDetails.taxType && this.state.paymentDetails.taxType.length > 0 ? "(" + this.state.paymentDetails.taxType + ")" : null }</div>
                                    <div>{"$"+this.state.paymentDetails.tax}</div>
                                </div>
                                <div className="payment-form-row payment-total">
                                    <div>Total</div>
                                    <div><span className="payment-currency">USD</span> {"$"+this.state.paymentDetails.total} <span className="payment-per-month">/mo</span></div>
                                </div>
                            </div>
                            :
                            null
                    }
                </StripePaymentDialog>

                {
                    this.state.showRedirecting ?
                        <Loading modal={true} title="Redirecting to Payment Portal" />
                        :
                        null
                }

                {
                    this.state.showProcessing ?
                        <Loading modal={true} title="Processing Your Payment" />
                        :
                        null
                }

                {
                    this.state.showCancelling ?
                        <Loading modal={true} title="Cancelling Payment" />
                        :
                        null
                }

                {
                    this.state.showPaymentComplete ?
                        <Confirm 
                            title="Thank You!"
                            message="Your subscription was processed successfully"
                            onConfirm={ this.onConfirmPaymentComplete.bind(this) }
                        />
                        :
                        null
                }

                {
                    this.state.showPaymentCancelled ?
                        <Confirm 
                            title="Payment Cancelled"
                            message="Your subscription payment was cancelled"
                            onConfirm={ this.onConfirmPaymentCancelled.bind(this) }
                        />
                        :
                        null
                }

                {
                    this.state.cardError ?
                    <Confirm 
                        title="We're sorry..."
                        message="There was a problem completing your credit card purchase. Please try again. If the problem persists, please contact our support team and we will help resolve your issue."
                        onConfirm={ this.onCardErrorConfirm.bind(this) }
                        onCancel={ this.onCardErrorSupport.bind(this) }
                        cancelText="Support"
                    />
                    :
                    null
                }
            </div>
        );
    }
}

module.exports = SubscriptionManager;
import React from 'react';

import i18n from '../../../store/i18nStore';

import String from '../../common/String.jsx';
import Modal from '../../common/Modal.jsx';
import UserStore from '../../../store/UserStore';
import Loading from '../../shared/Loading.jsx';

class PaymentForm extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            packages: [],
            loading: true,
            paid: false,
            error: false,
            redirecting: false,
            showActivationError: false
        };
    }
    componentWillMount () {
        UserStore.addEventListener( this );
    }

    componentDidMount () {
        if ( this.props.charge_id ) {
            if ( this.props.action === 'execute' ) {
                UserStore.executeSubscription( { subscriptionToken: this.props.charge_id } );
            } else {
                //assume declined
                this.setState( { showActivationError: 'label_payment_request_cancelled', loading: false } );
            }
        } else {
            UserStore.getSubscriptionPlanList();
        }
    }

    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }

    onSubscriptionPlanListRetrieved ( e ) {
        if ( e.response && !e.response.hasErrors() ) {
            this.setState( { packages: e.response.result.available, loading: false } );
        }
    }
    onSubscriptionActivated ( e ) {
        if ( e.response && !e.response.hasErrors() ) {
            this.setState( { paid: true, loading: false } );
        } else {
            console.log(e);
            //this.setState( { error: { message: 'label_payment_request_failed' }, loading: false } );
            this.setState( { showActivationError: 'label_payment_request_failed', loading: false } );
        }
    }
    onHide () {
        //console.log( 'PaymentModal.hide' );
    }
    onConfirm ( e ) {
        //console.log( 'PaymentModal.confirm', e );
    }
    select ( code ) {
        this.setState( { redirecting: true }, () => {
            UserStore.createSubscriptionRequest( { subscriptionCode: code } );
        } );
    }
    onSubscriptionCreated ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            //this.setState( { error: { message: 'label_payment_request_failed' }, loading: false } );
            this.setState( { showActivationError: 'label_payment_request_failed', loading: false } );
        } else {
            if ( window.top ) { //if in an iframe, redirect the parent
                window.top.location.href = e.response.result.redirect
            } else {
                window.location.replace( e.response.result.redirect );
            }
        }
    }
    closePaymentComplete () {
        this.props.close( { success: true, paid: true } );
    }

    onCloseError () {
        // Once this window has been handled, werite the charge id to local storage. This gets used by the CampaignActivator to determine if the charge id has been handled or not on page reload.
        if (window.localStorage) {
            window.localStorage.setItem("gamifyHandledChargeId",this.props.charge_id);
        }

        if (this.props.close) this.props.close();
    }

    render () {
        if ( this.state.loading ) {
            return <Loading modal={true} title="Loading..."/>
        } else if ( this.state.redirecting ) {
            return <Loading modal={true} title="Redirecting to Payment Portal" message="One moment please..." />
        }

        let body = null;
        let footer = null;

        if ( this.state.showActivationError ) {
            body = (
                <div className="modal-body modal-center">
                    <div><h2>{i18n.stringFor( 'label_payment_request_failed' )}</h2></div>
                    <br />
                </div>
            );
            footer = (
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary round modal-button" onClick={this.onCloseError.bind(this)}>{i18n.stringFor( 'label_ok' )}</button>
                </div>
            );
        } else if ( this.state.paid ) {
            body = (
                <div className="modal-body modal-center">
                    <div><h1><i className="material-icons">check</i>&nbsp;&nbsp;{i18n.stringFor( 'label_payment_processed_before_link' )}</h1></div>
                </div>
            );
            footer = (
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary round modal-button" onClick={this.closePaymentComplete.bind( this )}>{i18n.stringFor( 'label_ok' )}</button>
                </div>
            );
        } else {
            // Until we have multiple tiers, we are just getting and presenting the lowest price tier after sorting (0-th element).
            let plan = this.state.packages.sort(function(a,b){return a.details.amount.value - b.details.amount.value;})[0];

            body = (
                <div className="modal-body modal-center">
                    <div>
                        <div><h1>Complete Your Subscription</h1></div>
                        <div><span className="payment-price">{i18n.currency( plan.details.amount.value ) + ' ' + plan.details.amount.currency}</span><span>/mo</span></div>
                        { plan.details.trialDays ? <div className="payment-trial">{ plan.details.trialDays + ' ' + i18n.stringFor( 'label_days_trial' ) }</div> : null }
                    </div>
                </div>
            );
            
            footer = (
                <div className="modal-footer">
                    <button type="button" className="btn btn-default round modal-button" onClick={this.props.close}>{i18n.stringFor( 'label_cancel' )}</button>
                    <button type="button" className="btn btn-primary round modal-button" onClick={this.select.bind( this, plan.code )}>Subscribe</button>
                </div>
            );
        }

        return (
            <Modal show={this.props.show} onHide={this.props.close} className="sh-modal payment-modal">
                { body }
                { footer }
            </Modal>
        )
    }
}

module.exports = PaymentForm;
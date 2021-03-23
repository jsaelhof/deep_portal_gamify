import _ from 'underscore';
import React from 'react';

import CampaignStore from '../../../store/CampaignStore';
import UserStore from '../../../store/UserStore';
import ConfigStore from '../../../store/ConfigStore';
import String from '../../common/String.jsx';
import Modal from '../../common/Modal.jsx';
import i18n from '../../../store/i18nStore';
import PaymentForm from '../sub_section/PaymentForm.jsx';
import CampaignGamePreview from '../../shared/CampaignGamePreview.jsx';

class CampaignActivator extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            campaignList: [],
            activeCampaign: undefined,
            showPaymentModal: false,
            paymentParams: undefined
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        UserStore.addEventListener( this );
    }

    //  NOTE IMPORTANT !!!!!!!!!!!!!!!!!!!!!
    // This all used to be done when the dahsboard loaded. Now that I'm centralizing this for all pages in this component, i'm not getting all the campaigns up front. I'm waiting for one to be activated, then 
    // checking the subscription status and getting all the campaigns. I assume that the logic commented out here about returning from the payment page will still need to be handled somehow.
    //
    componentDidMount () {
        if ( this.props.location && this.props.location.query && this.props.location.query.charge_id ) {
            this.setState( { cb: function ( active ) {
                //console.log( 'CampaignList.mounted.getSubscriptionStatus.then', active );
                if ( !active ) {

                    // Decide whether to show the payment modal to the user.
                    // Normally we do if there is a charge_id on the query string.
                    // If they accept or decline the charge we will handle it accordingly.
                    // BUT if they then reload the page, we will try to handle it again and it's unexpected for the user.
                    // This isn't foolproof since it relies on local storage but when the charge is handled, the charge id is written to a local storage key.
                    // If we see this key in local storage AND it matches the one on the query string, then we've already handled this charge id and don't need to do it again.
                    // If it exists but doesn't match, just remove it. It could only be from a previous attempt to subscribe that was declined and now the user is subscribing a second time.
                    let ignore = false;
                    if (window.localStorage) {
                        let handledChargeId = window.localStorage.getItem("gamifyHandledChargeId");
                        if (handledChargeId) {
                            if (handledChargeId === this.props.location.query.charge_id) {
                                ignore = true;
                            } else {
                                // There's a chargeId on the query string but it's not the one in the local storage. 
                                // The one in local storage must be old so we'll just clean it up.
                                window.localStorage.removeItem("gamifyHandledChargeId");
                            }
                        }
                    }

                    if (!ignore) {
                        this.setState( { 
                            cb: false, 
                            paymentParams:{ 
                                charge_id: this.props.location.query.charge_id, 
                                action: this.props.location.query.action 
                            }, 
                            showPaymentModal: true 
                        }, () => {
                            if (this.props.onPaymentModalActivated) this.props.onPaymentModalActivated();
                        } );
                    }
                }
            }.bind( this ) }, function () {
                //console.log( 'CampaignList.mounted.check.then.call.getSubscriptionStatus' );
                UserStore.getSubscriptionStatus();
            } );
        } else {
            this.setState( { cb: false } );
        }   
    }
    
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        UserStore.removeEventListener( this );
    }

    // NOTE: This method gets exposed by using a ref so that it can be called directly rather than trying to pass in a bunch of props and compare them
    // the way I was doing in the componentWillReceiveProps method before.
    // To call this method, add this as a property to this component when creating it:
    //     ref={ (activator) => { this.activator = activator } }
    activate ( campaign ) {
        this.onActivate( campaign.campaignHash );
    }

    handleCampaignList ( response ) {
        if ( response.hasErrors() ) {
            // TODO: Handle the error
        } else {
            let campaigns = response.result.campaignList;
            let list = _.sortBy( response.result.campaignList, ( details ) => details.name ).map( campaign => {
                return { 
                    details: { 
                        name: campaign.details.name, 
                        prizes: campaign.details.prizes, 
                        selectedGame: campaign.details.selectedGame,
                        timestamps: campaign.details.timestamps
                    }, 
                    status: campaign.status, 
                    campaignHash: campaign.campaignHash 
                };
            } );

            this.setState( { campaigns: campaigns, campaignList: list, initLoad: false }, function () {
                // This function figures out what campaign is active from the new list and then calls the appropriate callback if assigned.
                var activeCampaign = undefined;
                response.result.campaignList.forEach( campaign => {
                    if ( campaign.status === CampaignStore.STATUS_ACTIVE ) {
                        activeCampaign = campaign;
                    }
                } );

                this.setState( 
                    { activeCampaign: activeCampaign }, 
                    () => {
                        if ( this.state.campaignListRetrievedHandler ) {
                            this.state.campaignListRetrievedHandler();
                        }
                    }                
                );
            } );
        }
    }

    onCampaignStatusUpdated ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // FIXME: Handle the error
        } else {
            // Based on the new status, send either an onActivated or onDeactivated call.
            switch (e.state.status) {
                case CampaignStore.STATUS_RUNNING:
                    if (this.props.onActivated) this.props.onActivated( e.state.campaignHash );
                    break;
                case CampaignStore.STATUS_SUSPENDED:
                case CampaignStore.STATUS_CANCELLED:
                case CampaignStore.STATUS_ENDED:
                case CampaignStore.STATUS_DELETED:
                case CampaignStore.STATUS_INACTIVE:
                    if (this.props.onDeactivated) this.props.onDeactivated( e.state.campaignHash );
                    break;
            }

            if ( this.state.cb ) {
                this.state.cb();
            }
        }
    }

    onActivate ( campaignHash ) {
        // if ( active ) {
            this.setState( { cb: function ( paymentStatusActive ) {
                if ( paymentStatusActive ) {

                    this.setState( { campaignListRetrievedHandler: function () {
                            // Remove this callback as the handler for the campaignListRetrieved event
                            this.setState( { campaignListRetrievedHandler: undefined }, () => {
                                // Get the campaign info before dealing with activation
                                let campaign = this.findCampaignByHash( campaignHash );

                                if (campaign) {
                                    // Check and see if there isnt a campaign active already.
                                    // If not, just activate it. Otherwise, another campaign is active and we need to ask the user if they 
                                    // want to deactivate the current campaign for this one.
                                    if (this.state.activeCampaign === undefined) {
                                        this.activateCampaign( campaignHash );
                                    } else if ( this.state.activeCampaign.campaignHash !== campaignHash ) {
                                        if (this.props.onConflict) this.props.onConflict( campaignHash, this.state.activateCampaign );
                                        this.setState( { showConfirmMessage: true, pendingCampaign: campaign, cb: function () {
                                            this.cancelCampaign( this.state.activeCampaign, true, function () {
                                                this.activateCampaign( campaignHash );
                                                this.setState({ pendingCampaign: undefined });
                                            }.bind( this ) );
                                        }.bind( this ) } );
                                    }
                                } else {
                                    // TODO: Handle what to do if this campaign wasn't found for some reason
                                }
                            } )
                        }.bind(this) 
                    }, () => {
                        CampaignStore.getCampaignList(ConfigStore.getProductTag(this.props.product), this.handleCampaignList.bind(this));
                    } );
                } else {
                    //show payment modal
                    this.setState( { showPaymentModal: true }, function () {
                        if (this.props.onPaymentModalActivated) this.props.onPaymentModalActivated();
                        // try to store the requested campaign activation in localStorage so we can attempt to activate it after user has completed subscription
                        try {
                            window.localStorage.setItem( 'intents', JSON.stringify( [ { request: 'activate', campaignHash: campaignHash } ] ) );
                        } catch ( e ) {
                            console.error( 'CampaignList.setIntent.localStorage.failed', e );
                        }
                    } );
                }
            }.bind( this ) }, function () {
                // check to make sure user is on valid subscription before activating campaign
                UserStore.getSubscriptionStatus();
            } );
        // } else {
        //     this.setState( { campaignListRetrievedHandler: function () {
        //         // Remove this callback as the handler for the campaignListRetrieved event
        //         this.setState( { campaignListRetrievedHandler: undefined }, () => {
        //             this.cancelCampaign( campaignHash );
        //         } );
        //     }.bind(this) }, () => {
        //         CampaignStore.getCampaignList(ConfigStore.getProductTag(this.props.product), this.handleCampaignList.bind(this));
        //     } );
        // }
    }

    onConfirmCampaignActivation ( confirm ) {
        this.setState( { showConfirmMessage: false }, function () {
            if ( confirm ) {
                this.state.cb();
            } else {
                this.setState( { cb: false } );
                if (this.props.onCancelActivation) this.props.onCancelActivation();
            }
        } );
    }

    onSubscriptionStatusReceived ( e ) {
        if ( e.response && !e.response.hasErrors() ) {
            if ( this.state.cb ) { this.state.cb( e.response.result.active ); }
        } else {
            // TODO: Handle the error
            console.error( 'CampaignList.onSubscriptionStatusReceived.failed', e );
        }
    }

    /**
     * 
     * @param {*} campaignHash 
     * @param {*} duringActivation This param indicates if the suspension is part of the activation of another campaign. If so, we need to handle UI things slightly different.
     * @param {*} cb 
     */
    cancelCampaign ( campaign, duringActivation, cb ) {
        if ( campaign ) {
            if (this.props.onWillDeactivate) this.props.onWillDeactivate(campaign.campaignHash, duringActivation);
            if ( campaign.status === CampaignStore.STATUS_ACTIVE ) {
                this.setState( { cb: function () {
                    if (cb) cb();
                }.bind( this ) }, function () {
                    CampaignStore.sendCampaignUpdateStatus( campaign.campaignHash, CampaignStore.STATUS_CANCELLED, campaign.version );
                } );
            } else {
                // TODO: Handle the error
                // console.error( 'cancelCampaign.failed, campaign not in a state that can be suspended ', campaign.status );
            }
        } else {
            // TODO: Handle the error
            // console.error( 'cancelCampaign.failed, could not find campaign, ', campaignHash );
        }
    }



    activateCampaign ( campaignHash, cb ) {
        var campaign = this.findCampaignByHash( campaignHash );

        // have to set nested call backs since we're using events
        if ( campaign ) {
            if ( campaign.status === CampaignStore.STATUS_UNSHEDULED ) {
                if (this.props.onWillActivate) this.props.onWillActivate(campaignHash);
                this.setState( { cb: function () {

                    this.setState( { campaignListRetrievedHandler: function () {
                        // Remove this callback as the handler for the campaignListRetrieved event
                        this.setState( { campaignListRetrievedHandler: undefined }, () => {
                            var campaign = this.findCampaignByHash( campaignHash ); // grab the campaign again to get the updated version
    
                            if ( campaign ) {
                                this.setState( { cb: cb }, () => {
                                    CampaignStore.sendCampaignUpdateStatus( campaignHash, CampaignStore.STATUS_ACTIVE, campaign.version );
                                } );
                            } else {
                                this.setState( { cb: false }, function () {
                                    // TODO: Handle the error
                                    //console.error( 'activateCampaign.failed, could not find campaign from new campaign list, ', campaignHash );
                                } );
                            }
                        } );
                    }.bind( this ) }, function () {
                        CampaignStore.getCampaignList(ConfigStore.getProductTag(this.props.product), this.handleCampaignList.bind(this));
                    } );

                }.bind( this ) }, function () {
                    CampaignStore.sendCampaignUpdateStatus( campaignHash, CampaignStore.STATUS_SCHEDULED, campaign.version );
                } );
            } else if ( [ CampaignStore.STATUS_SCHEDULED, CampaignStore.STATUS_SUSPENDED ].indexOf( campaign.status ) !== -1 ) {
                // if campaign is Suspended or already Scheduled, we can directly go to ACTIVE
                if (this.props.onWillActivate) this.props.onWillActivate(campaignHash);
                this.setState( { cb: false }, () => {
                    CampaignStore.sendCampaignUpdateStatus( campaignHash, CampaignStore.STATUS_ACTIVE, campaign.version );
                } );
            } else {
                // TODO: Handle the error
                // console.error( 'activateCampaign.failed, campaign not in a state that can be activated ', campaign.status );
            }
        } else {
            // TODO: Handle the error
            // console.log( 'activateCampaign.failed, campaign not found, ', campaignHash );
        }
    }

    findCampaignByHash ( campaignHash ) {
        for ( var campaign of this.state.campaigns ) {
            if (campaign.campaignHash === campaignHash) {
                return campaign;
            }
        };

        // If not found, return undefined
        return undefined;
    }

    closePaymentModal ( res ) {
        if ( res && res.paid ) {
            try {
                let _intents = JSON.parse( window.localStorage.getItem( 'intents' ) ) || [];

                _intents.forEach( ( intent, i ) => {
                    if ( intent.request === 'activate' ) {
                        this.onActivate( intent.campaignHash );
                        _intents.splice( i, 1 );//remove once processed
                    }
                }, this );

                window.localStorage.setItem( 'intents', JSON.stringify( _intents ) );
            } catch ( e ) {
                // TODO: Handle the error
                // console.error( 'CampaignList.closePaymentModal.read.intents.failed', e );
            }
        } else {
            //empty intents if they decide to close paymentModal, don't want lingering intents that get fired later on and potentially cause unintended activations
            window.localStorage.setItem( 'intents', JSON.stringify( [] ) );

            // Clear the payment params that were saved. This makes sure if the try to activate a second time, those old payment params are not re-used.
            // This situtation was happening if the went to the shopify page and declined the charge then tried to activate again...the state would have payment params from their first attempt.
            this.setState({ paymentParams: undefined });

            if (this.props.onCancelPayment) this.props.onCancelPayment();
        }

        this.setState( { showPaymentModal: false }, () => {
            if (this.props.onPaymentModalDeactivated) this.props.onPaymentModalDeactivated();
        } );
    }

    render () {
        return (
            <div className="container-fluid dashboard">
                {
                    this.state.showPaymentModal ?
                        <PaymentForm 
                            show={true} 
                            close={this.closePaymentModal.bind( this )} 
                            charge_id={ this.state.paymentParams ? this.state.paymentParams.charge_id : false } 
                            action={ this.state.paymentParams ? this.state.paymentParams.action : false } /> : null
                }
                {
                    this.state.showConfirmMessage ?
                        <ConfirmChangeActiveCampaign 
                            show={true} 
                            onConfirm={this.onConfirmCampaignActivation.bind( this )} 
                            title={i18n.stringFor("sh_label_deactivate_modal_title")}
                            message = {<div>
                                <div className="m-b-1">{i18n.stringFor("sh_label_deactivate_modal_message")}</div>
                                <div className="m-b-1">{i18n.stringFor("sh_label_deactivate_modal_activate").replace("{0}",this.state.pendingCampaign.details.name)}</div>
                                <div>{i18n.stringFor("sh_label_deactivate_modal_deactivate").replace("{0}",this.state.activeCampaign.details.name)}</div>
                            </div>}
                        /> : null
                }
            </div>
        )
    }
}

class ConfirmChangeActiveCampaign extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {}
    }
    onConfirm ( bool ) {
        if ( typeof this.props.onConfirm === 'function' ) {
            this.props.onConfirm( bool );
        }
    }
    render () {
        return (
            <Modal show={true} className="sh-modal">
                { this.props.title ? <div className="modal-header-large modal-center"><div className="modal-title">{this.props.title}</div></div> : null }
                { this.props.message ? <div className="modal-body modal-center"><div className="modal-message">{this.props.message}</div></div> : null }
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary round modal-button" onClick={this.onConfirm.bind( this, true )}><String code="label_yes" /></button>
                    <button type="button" className="btn btn-default round modal-button" onClick={this.onConfirm.bind(this, false )}><String code="label_cancel" /></button>
                </div>
            </Modal>
        );
    }
}

module.exports = CampaignActivator;

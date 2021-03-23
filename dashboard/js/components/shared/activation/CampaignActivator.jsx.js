import _ from 'underscore';
import React from 'react';

import ConfigStore from '../../../store/ConfigStore';
import CampaignStore from '../../../store/CampaignStore';
import TimezoneStore from '../../../store/TimezoneStore';
import ErrorStore from '../../../store/ErrorStore';
import UserStore from '../../../store/UserStore';
import SocialReviewActivationPrompt from '../../social/dialog/ReviewActivationPrompt.jsx';
import SlideoutReviewActivationPrompt from '../../slideout/dialog/ReviewActivationPrompt.jsx';
import EmailBannerReviewActivationPrompt from '../../emailbanner/dialog/ReviewActivationPrompt.jsx';
import Confirm from '../Confirm.jsx';
import i18n from '../../../store/i18nStore';
import Loading from '../Loading.jsx';
import Constants from '../Constants';
import SubscriptionManager from '../payment/SubscriptionManager.jsx';

class CampaignActivator extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            showReviewActivationPrompt: false,
            isActivating: false,
            activationComplete: false,
            campaign: undefined,
            cancelCampaignHash: undefined
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        UserStore.addEventListener( this );
    }
    
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        UserStore.removeEventListener( this );
    }


    // "Public" methods called directly from outside via a ref

    activate ( campaign, product ) {
        this.setState( { 
            campaign: campaign,
            product: product,
            showReviewActivationPrompt: true
        } );
    }

    cancelCampaign ( campaign, product ) {
        this.setState( { 
            showCancelWarning: true, 
            campaign: campaign,
            product: product
        } );
    }

    // End Public methods
    

    changeStatusToRunning () {
        // Call #1 - Update Status to Scheduled
        CampaignStore.sendCampaignUpdateStatus( 
            this.state.campaign.campaignHash, 
            CampaignStore.STATUS_SCHEDULED, 
            this.state.campaign.version,
            ( scheduledUpdateResponse) => {
                // Handle #1 - Handle the response from changing the campaign to scheduled.
                if (scheduledUpdateResponse.hasErrors()) {
                    ErrorStore.rpcResponseError( scheduledUpdateResponse );
                } else { 
                    // Save the updated campaign to state so we have the lastest.
                    this.setState( { 
                        campaign: scheduledUpdateResponse.result
                    }, () => {
                        // Call #2 - Campaign Status is updated. Campaign is now scheduled...move it to running.
                        CampaignStore.sendCampaignUpdateStatus( 
                            this.state.campaign.campaignHash, 
                            CampaignStore.STATUS_RUNNING, 
                            this.state.campaign.version,
                            ( runningUpdateResponse ) => {
                                // Handle #2 - Handle the response from changing the campaign to running.
                                if (runningUpdateResponse.hasErrors()) {
                                    ErrorStore.rpcResponseError( runningUpdateResponse );
                                } else { 
                                    // Save the updated campaign to state so we have the lastest.
                                    this.setState( { 
                                        isActivating: false,
                                        activationComplete: true,
                                        campaign: runningUpdateResponse.result
                                    }, () => {
                                        if (this.props.onActivated) this.props.onActivated( this.state.campaign.campaignHash, this.state.product );
                                    } );
                                }
                            }
                        );
                    } );
                }
            }
        );
    }

    changeStatusToScheduled () {
        CampaignStore.sendCampaignUpdateStatus( 
            this.state.campaign.campaignHash, 
            CampaignStore.STATUS_SCHEDULED, 
            this.state.campaign.version,
            response => {
                // Campaign Status is updated. Activation is now complete.
                this.setState( { 
                    isActivating: false, 
                    activationComplete: true 
                }, () => {
                    if (response.hasErrors()) {
                        ErrorStore.rpcResponseError( response );
                    } else {
                        if (this.props.onActivated) this.props.onActivated( this.state.campaign.campaignHash, this.state.product );
                    }
                } );
            }
        );
    }

    onConfirmReviewSchedule () {
        if (this.props.onWillActivate) this.props.onWillActivate( this.state.campaignHash, this.state.product );


        // Based on the product, the activation process is a bit different
        this.setState( { showReviewActivationPrompt: false, isActivating: true }, () => {
            if (this.state.product === Constants.PRODUCT_SOCIAL || this.state.product === Constants.PRODUCT_SURVEY) {
                // Set the campaign to scheduled. The server will set it to running later when the sceduled start date occurs.
                this.changeStatusToScheduled();
            } else if (this.state.product === Constants.PRODUCT_EMAIL_BANNER || this.state.product === Constants.PRODUCT_SLIDEOUT) {
                // Set the campaign to scheduled and then running.
                this.changeStatusToRunning();
            } else {
                this.setState( {
                    isActivating: false
                }, () => {
                    throw "Unable to figure out how to activate @ onConfrimReviewSchedule";
                } );
            }
        } );
    }

    onCancelReviewSchedule () {
        this.setState( { showReviewActivationPrompt: false } );
        if (this.props.onCancelActivation) this.props.onCancelActivation( this.state.campaign.campaignHash, this.state.product );
    }

    onConfirmActivation () {
        this.setState( { activationComplete: false } );
        if (this.props.onConfirmActivation) this.props.onConfirmActivation( this.state.campaign.campaignHash, this.state.product );
    }

    onConfirmCancelCampaign () {
        this.setState( { showCancelWarning: false }, () => {
            CampaignStore.sendCampaignUpdateStatus( 
                this.state.campaign.campaignHash, 
                CampaignStore.STATUS_CANCELLED, 
                this.state.campaign.version, 
                (e) => {
                    if (e.errors) {
                        ErrorStore.rpcResponseError(e);
                    } else {
                        this.setState( { 
                            showCampaignCancelled: true
                        } );
                    }
                } );
        } );
    }

    onCancelCancelCampaign () {
        this.setState( { showCancelWarning: false, campaign: undefined } );
    }

    onConfirmCampaignCancelled () {
        if (this.props.onCancelled) this.props.onCancelled( this.state.campaign.campaignHash, this.state.product ); 
        this.setState( {
            showCampaignCancelled: false,
            campaign: undefined
        } )
    }

    onGoToIntegration () {
        if (this.props.onGoToIntegration) this.props.onGoToIntegration( this.state.product );
    }

    getReviewActivationPrompt ( product ) {
        switch (product) {
            case Constants.PRODUCT_SOCIAL:
                return <SocialReviewActivationPrompt 
                    onConfirm={ this.onConfirmReviewSchedule.bind(this) }
                    onCancel={ this.onCancelReviewSchedule.bind(this) }
                />
                break;
            case Constants.PRODUCT_SLIDEOUT:
                return <SlideoutReviewActivationPrompt 
                    onConfirm={ this.onConfirmReviewSchedule.bind(this) }
                    onCancel={ this.onCancelReviewSchedule.bind(this) }
                />
                break;
            case Constants.PRODUCT_EMAIL_BANNER:
                return <EmailBannerReviewActivationPrompt 
                    onConfirm={ this.onConfirmReviewSchedule.bind(this) }
                    onCancel={ this.onCancelReviewSchedule.bind(this) }
                />
                break;
            default:
                throw "Missing product at getReviewActivationPrompt";
                break;
        }
    }

    getActivationCompletePrompt ( product ) {
        switch (product) {
            case Constants.PRODUCT_SOCIAL:
            case Constants.PRODUCT_SURVEY:
                return <Confirm 
                    onConfirm={this.onConfirmActivation.bind(this)} 
                    title={i18n.stringFor("sh_label_campaign_activated_message")} 
                    message={ 
                        i18n.stringFor("sh_label_campaign_activated_message_social")
                            .replace("{0}",TimezoneStore.getMomentInTimezone(this.state.campaign.details.startDate,this.state.campaign.details.timezone).format(CampaignStore.dateDisplayFormat))
                            .replace("{1}",TimezoneStore.getMomentInTimezone(this.state.campaign.details.startDate,this.state.campaign.details.timezone).format(CampaignStore.timeDisplayFormat))
                    } 
                />
                break;
            case Constants.PRODUCT_SLIDEOUT:
            case Constants.PRODUCT_EMAIL_BANNER:
                return <Confirm 
                    modal={true} 
                    title={i18n.stringFor("sh_label_campaign_activated_title")} 
                    onConfirm={this.onConfirmActivation.bind(this)}
                >
                    <div className="modal-body modal-center">
                        { ConfigStore.getIntegrationSnippetInject() === "manual" ?
                            <div className="modal-message">Don't forget to install your DeepMarkit app code! <a href="#" onClick={this.onGoToIntegration.bind(this)}>Get It Here</a></div>
                            :
                            <div className="modal-message">{i18n.stringFor('sh_label_campaign_activated_message')}</div>
                        }
                    </div>
                </Confirm>
                break;
            default:
                throw "Missing product at getActivationCompletePrompt";
                break;
        }
    }
 
    render () {
        return (
            <div>
                {
                    this.state.showReviewActivationPrompt ? this.getReviewActivationPrompt( this.state.product ) : null
                }

                {
                    this.state.isActivating ?
                        <Loading modal={true} title={i18n.stringFor("sh_label_campaign_activating")} /> 
                        : null
                    }

                {
                    this.state.activationComplete ? this.getActivationCompletePrompt( this.state.product ) : null
                }

                {
                    this.state.showCancelWarning ?
                    <Confirm 
                        title={i18n.stringFor("sh_label_campaign_cancel_title")}
                        onConfirm={ this.onConfirmCancelCampaign.bind(this) }
                        onCancel={ this.onCancelCancelCampaign.bind(this) }
                    >
                        <div>
                            {i18n.stringFor("sh_label_campaign_cancel_message").replace("{0}",this.state.campaign.details.name)}
                            { this.state.campaign.details.multiDrawEvents && this.state.campaign.details.multiDrawEvents.length > 0 ?
                                <div className="m-t-3">{i18n.stringFor("sh_label_campaign_cancel_draw_message")}</div>
                                :
                                null
                            }
                        </div>
                    </Confirm>
                    :
                    null
                }

                {
                    this.state.showCampaignCancelled ?
                    <Confirm
                        title={i18n.stringFor("sh_label_campaign_cancelled_title")}
                        message={i18n.stringFor("sh_label_campaign_cancelled_message").replace("{0}",this.state.campaign.details.name)}
                        onConfirm={this.onConfirmCampaignCancelled.bind(this)}
                    />
                    :
                    null
                }

                <SubscriptionManager
                    onSubscribed={ ()=> { this.forceUpdate() } }
                    ref={(subscriptionManager) => { this.subscriptionManager = subscriptionManager; }}
                />
            </div>
        )
    }
}

module.exports = CampaignActivator;

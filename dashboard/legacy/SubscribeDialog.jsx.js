import React from 'react';
import Modal from '../../common/Modal.jsx';
import UserStore from '../../../store/UserStore';
import ConfigStore from '../../../store/ConfigStore';
import ErrorStore from '../../../store/ErrorStore';
import Loading from '../Loading.jsx';
import LocalStorageStore from '../../../store/LocalStorageStore';


class SubscribeDialog extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            showInitSubscription: true,
            showProcessing: false,
            showCancelling: false,
            paidPlan: undefined
        }
    }

    componentWillMount () {
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
                paidPlan: paidPlan 
            } );
        }
    }

    onConfirm () {
        // User wants to subscribe
        // Process is:
        // send the authorize with redirect url 
        // wait to be redirected back to the app
        // Check User object for payment completion message
        // Show success
        // Go to dashboard 

        this.setState( { showInitSubscription: false, showProcessing: true }, () => {
            if (this.state.paidPlan) {
                // Authorize the subscription for this plan
                UserStore.sendAuthorizeSubscription( ConfigStore.getPaymentClient(), this.state.paidPlan.code, ConfigStore.getAppUrl(UserStore.getImmutableState().userDetails), authorizeResponse => {
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
            } else {
                ErrorStore.setError("No available paid plans");
            }   
        });     
    }

    onCancel () {
        if (this.props.onCancel) this.props.onCancel();
    }

    scrollToCompare () {
        var myElement = document.getElementById('compareFeatures');
        var topPos = myElement.offsetTop;
        $('.modal-dialog').animate({scrollTop:topPos},'100');
    }
    
    render() {
        if (!this.state.paidPlan) return null;

        return (
            <div>
                { 
                    this.state.showInitSubscription ?
                        <Modal show={true} onHide={this.onCancel.bind(this)} className="sh-modal subscribe-modal">
                            <div className="subscribe-banner">
                                <div className="subscribe-title">
                                    <div>One Toolkit. One Price. Everything you Need!</div>
                                    { ConfigStore.getAllowSubscribe() ?
                                        <button 
                                            type="button" 
                                            className="btn btn-primary round modal-button" 
                                            onClick={this.onConfirm.bind( this )}
                                        >
                                            {"Subscribe for $" + this.state.paidPlan.details.amount.value + "/mo"}
                                        </button> 
                                        :
                                        <button 
                                            type="button" 
                                            className="btn btn-primary round modal-button" 
                                            onClick={this.onCancel.bind( this )}
                                        >
                                            Coming Soon!
                                        </button> 
                                    }
                                    <div className="subscribe-banner-compare" onClick={ this.scrollToCompare.bind(this) }>Compare Features</div>
                                </div>

                                <div className="subscribe-close" onClick={ this.onCancel.bind(this) }>X</div>
                            </div>

                            <div className="subscribe-section-title subscribe-premium-title">Why go Premium?</div>

                            <div className="subscribe-benefits">
                                <div className="subscribe-benefit">
                                    <div className="subscribe-benefit-image">
                                        <img src="/dashboard/images/subscribe/benefit_reward.png"/>
                                    </div>
                                    <div className="subscribe-benefit-features">
                                        <div>Offer More Rewards</div>
                                        <div>Draw Prizes</div>
                                        <div>Physical Prizes</div>
                                        <div>Grand Prize Draw (DeepMarkit Pays the Prize)</div>
                                    </div>
                                </div>

                                <div className="subscribe-benefit">
                                    <div className="subscribe-benefit-image">
                                        <img src="/dashboard/images/subscribe/benefit_website.png"/>
                                    </div>
                                    <div className="subscribe-benefit-features">
                                        <div>More Website Displays</div>
                                        <div>Pop-ups</div>
                                        <div>Banners</div>
                                        <div>Full Page</div>
                                    </div>
                                </div>

                                <div className="subscribe-benefit">
                                    <div className="subscribe-benefit-image">
                                        <img src="/dashboard/images/subscribe/benefit_customize.png"/>
                                    </div>
                                    <div className="subscribe-benefit-features">
                                        <div>Enhanced Customization</div>
                                        <div>Scheduling</div>
                                        <div>White Labeling</div>
                                        <div>Background Images</div>
                                    </div>
                                </div>

                                <div className="subscribe-benefit">
                                    <div className="subscribe-benefit-image">
                                        <img src="/dashboard/images/subscribe/benefit_social.png"/>
                                    </div>
                                    <div className="subscribe-benefit-features">
                                        <div>Social Media Promotions</div>
                                        <div>Run Gamified Ads</div>
                                        <div>12 Premium Games</div>
                                        <div>Custom Data Collection</div>
                                    </div>
                                </div>

                                <div className="subscribe-benefit">
                                    <div className="subscribe-benefit-image">
                                        <img src="/dashboard/images/subscribe/benefit_survey.png"/>
                                    </div>
                                    <div className="subscribe-benefit-features">
                                        <div>Surveys &amp; Quizzes</div>
                                        <div>Valuable Customer Insights</div>
                                        <div>Gamified Experience and Rewards</div>
                                        <div>Pre-Built Templates</div>
                                    </div>
                                </div>
                            </div>
                        
                            <div className="subscribe-compare" id="compareFeatures">
                                <div className="subscribe-section-title">Convert customers for free or subscribe to DeepMarkit Premium</div>
                                <div className="subscribe-compare-cards">
                                    <div className="subscribe-compare-card">
                                        <div className="subscribe-compare-card-header">
                                            <div>DeepMarkit Free</div>
                                            <div>$0.00 <span className="subscribe-per-month">/ month</span></div>
                                        </div>
                                        <div className="subscribe-divider"/>
                                        <div className="subscribe-compare-card-body">
                                            <ul>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Campaigns</li>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Emails Collected</li>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Game Impressions</li>
                                            <li className="compare-active">&nbsp;&nbsp;Gamified Slideouts</li>
                                            <li className="compare-active">&nbsp;&nbsp;Email Sync &amp; Integration</li>
                                            <li className="compare-active">&nbsp;&nbsp;Smart Triggers</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Premium Display Types</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Draw Prizes</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Physical Prizes</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Scheduling</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Background Images</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Remove DeepMarkit Branding</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Grand Prizes Draw</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Social Media Campaigns with 12 Premium Games</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Custom Data Collection</li>
                                            <li className="compare-inactive">&nbsp;&nbsp;Surveys &amp; Quizzes</li>
                                            </ul>
                                            <div className="subscribe-compare-button">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-default round modal-button" 
                                                    onClick={this.onCancel.bind( this )}
                                                >
                                                    Free
                                                </button> 
                                            </div>
                                        </div>
                                    </div>
                                    <div className="subscribe-compare-card">
                                        <div className="subscribe-compare-card-header">
                                            <div>DeepMarkit Premium</div>
                                            <div>{"$" + this.state.paidPlan.details.amount.value} <span className="subscribe-per-month">/ month</span></div>
                                        </div>
                                        <div className="subscribe-divider"/>
                                        <div className="subscribe-compare-card-body">
                                            <ul>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Campaigns</li>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Emails Collected</li>
                                            <li className="compare-active">&nbsp;&nbsp;Unlimited Game Impressions</li>
                                            <li className="compare-active">&nbsp;&nbsp;Gamified Slideouts</li>
                                            <li className="compare-active">&nbsp;&nbsp;Email Sync &amp; Integration</li>
                                            <li className="compare-active">&nbsp;&nbsp;Smart Triggers</li>
                                            <li className="compare-active">&nbsp;&nbsp;Premium Display Types</li>
                                            <li className="compare-active">&nbsp;&nbsp;Draw Prizes</li>
                                            <li className="compare-active">&nbsp;&nbsp;Physical Prizes</li>
                                            <li className="compare-active">&nbsp;&nbsp;Scheduling</li>
                                            <li className="compare-active">&nbsp;&nbsp;Background Images</li>
                                            <li className="compare-active">&nbsp;&nbsp;Remove DeepMarkit Branding</li>
                                            <li className="compare-active">&nbsp;&nbsp;Grand Prizes Draw</li>
                                            <li className="compare-active">&nbsp;&nbsp;Social Media Campaigns with 12 Premium Games</li>
                                            <li className="compare-active">&nbsp;&nbsp;Custom Data Collection</li>
                                            <li className="compare-active">&nbsp;&nbsp;Surveys &amp; Quizzes</li>
                                            </ul>
                                            <div className="subscribe-compare-button">
                                                { ConfigStore.getAllowSubscribe() ?
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-primary round modal-button" 
                                                        onClick={this.onConfirm.bind( this )}
                                                    >
                                                        {"Subscribe for $"+this.state.paidPlan.details.amount.value+"/mo"}
                                                    </button> 
                                                    :
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-primary round modal-button" 
                                                        onClick={this.onCancel.bind( this )}
                                                    >
                                                        Coming Soon!
                                                    </button> 
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                        :
                        null
                }

                {
                    this.state.showProcessing ?
                        <Loading modal={true} title="Redirecting to Payment Portal" />
                        :
                        null
                }

                {
                    this.state.showCancelling ?
                        <Loading modal={true} title="Cancelling Payment" />
                        :
                        null
                }
            </div>
        );
    }
}

module.exports = SubscribeDialog;
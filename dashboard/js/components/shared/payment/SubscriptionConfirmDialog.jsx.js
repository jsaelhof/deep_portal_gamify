import React from 'react';
import Modal from '../../common/Modal.jsx';
import UserStore from '../../../store/UserStore';


class SubscribeDialog extends React.Component {
    constructor( props ) {
        super( props );
    }

    onConfirm () {
        if (this.props.onConfirm) this.props.onConfirm();
    }

    onCancel () {
        if (this.props.onCancel) this.props.onCancel();
    }
    
    render() {
        return (
            <div>
                <Modal show={true} onHide={this.onCancel.bind(this)} className="sh-modal subscribe-modal">
                    <div className="subscribe-banner">
                        <div className="subscribe-title">
                            <div>One Toolkit. One Price. Everything you Need!</div>

                            { UserStore.hasUsedTrial() ?
                                <div>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary round modal-button" 
                                        onClick={this.onConfirm.bind( this )}
                                    >
                                        {"Subscribe for $" + this.props.paidPlan.details.amount.value + "/mo"}
                                    </button> 
                                </div>
                                :
                                <div>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary round modal-button" 
                                        onClick={this.onConfirm.bind( this )}
                                    >
                                        {"Start Your 7 Day FREE Trial!"}
                                    </button> 
                                    <div className="subscribe-banner-compare">{"You will be charged $" + this.props.paidPlan.details.amount.value + "/mo when your trial ends. Cancel anytime."}</div>
                                </div>
                            }
                        </div>

                        <div className="subscribe-close" onClick={ this.onCancel.bind(this) }>X</div>
                    </div>

                    <div className="subscribe-section-title subscribe-premium-title">Subscribe Now</div>

                    <div className="subscribe-benefits">
                        <div className="subscribe-benefit">
                            <div className="subscribe-benefit-image">
                                <img src="/dashboard/images/subscribe/benefit_unlimited.png"/>
                            </div>
                            <div className="subscribe-benefit-features">
                                <div>Unlimited Usage</div>
                                <div>Unlimited Campaigns</div>
                                <div>Unlimited Email Collection</div>
                                <div>Unlimited Game Impressions</div>
                                <div>Unlimited Surveys &nbsp; Quizzes</div>
                            </div>
                        </div>

                        <div className="subscribe-benefit">
                            <div className="subscribe-benefit-image">
                                <img src="/dashboard/images/subscribe/benefit_website.png"/>
                            </div>
                            <div className="subscribe-benefit-features">
                                <div>Premium Website Displays</div>
                                <div>Pop-ups</div>
                                <div>Banners</div>
                                <div>Full Page</div>
                                <div>Gamified Slide-outs</div>
                            </div>
                        </div>

                        <div className="subscribe-benefit">
                            <div className="subscribe-benefit-image">
                                <img src="/dashboard/images/subscribe/benefit_social.png"/>
                            </div>
                            <div className="subscribe-benefit-features">
                                <div>Social Media Promotions</div>
                                <div>Run Gamified Ads</div>
                                <div>12 Customizable Games</div>
                                <div>Custom Data Collection</div>
                                <div>Landing Pages</div>
                            </div>
                        </div>
                        
                        <div className="subscribe-benefit">
                            <div className="subscribe-benefit-image">
                                <img src="/dashboard/images/subscribe/benefit_customize.png"/>
                            </div>
                            <div className="subscribe-benefit-features">
                                <div>Trigger and Integrations</div>
                                <div>Smart Triggers</div>
                                <div>Tracking Links</div>
                                <div>Email Sync &amp; Integrations</div>
                                <div>Scheduling</div>
                            </div>
                        </div>

                        <div className="subscribe-benefit">
                            <div className="subscribe-benefit-image">
                                <img src="/dashboard/images/subscribe/benefit_reward.png"/>
                            </div>
                            <div className="subscribe-benefit-features">
                                <div>Multiple Reward Options</div>
                                <div>Physical &amp; Draw Prizes</div>
                                <div>Coupon Codes</div>
                                <div>Grand Prize Draw (DeepMarkit Pays the Prize)</div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

module.exports = SubscribeDialog;
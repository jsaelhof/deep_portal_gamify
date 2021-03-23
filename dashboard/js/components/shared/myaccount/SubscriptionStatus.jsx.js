import React from 'react';
import i18n from '../../../store/i18nStore';
import UserStore from '../../../store/UserStore';
import CancelSubscription from './CancelSubscription.jsx';

class SubscriptionStatus extends React.Component {
    constructor ( props ) {
        super( props );
    }

    getNextBillingDate () {
        // Get a moment representing now
        let todayMoment = i18n.moment();

        // Currently we aren't showing if they are in a trial but i'm leaving this here in case we add it.
        let isInTrial = false;
        if (this.props.paidPlan.details.trialEndDate) {
            // Is Trial Expired?
            isInTrial = (todayMoment.isBefore(this.props.paidPlan.details.trialEndDate));
        }


        // Pull the day of the month that the billing occurs on
        let billingDay = parseInt(/(\d{4})-(\d{2})-(\d{2})/g.exec(this.props.paidPlan.details.billingDate)[3]);
        
        // Get the current date of the month (1-31)
        let currentDay = todayMoment.date();

        // If the current day is less than billing day, then the user has an upcoming billing date this month.
        // If it is on or after the billing date, then the user will be billed in the following month.
        // Either way, state by taking today's moment and change it to the billing date for that month.
        // If the billing date is next month, add a month to this months billing date.
        if (currentDay < billingDay) {
            return todayMoment.date(billingDay).format("MMMM Do, YYYY");
        } else {
            return todayMoment.date(billingDay).add(1,"M").format("MMMM Do, YYYY");
        }
    }

    render () {
        if (!this.props.subscriptionPlans) return null;

        return (
            <div className="container">
                { 
                    this.props.subscriptionPlans ?
                        this.props.isFreeSubscription ?
                            // Subscribed with a free subscription
                            // Not Subscribed  
                            <div className="subscription">
                                <div className="subscription-item">
                                    <div><h2>Your Membership</h2></div>
                                    <div>Unsubscribed, Just Exploring For Now</div>
                                    <div className="form-group m-t-4">
                                        <button type="button" className="btn btn-primary round" onClick={this.props.onSubscribe}>Subscribe Now</button>
                                    </div>
                                    { UserStore.hasUsedTrial() ?
                                        null
                                        :
                                        <h4>7 Day Free Trial</h4>
                                    }
                                </div>
                            </div> 
                            :
                            // Subscribed
                            <div className="subscription">
                                <div className="subscription-item">
                                    <h2>Your Membership</h2>
                                    <div>Subscribed</div>
                                    <div className="subscription-subtext m-t-1">{this.props.paidPlan.subscriptionInfo.details.amount.currency} ${this.props.paidPlan.subscriptionInfo.details.amount.value}/mo</div>
                                    <div className="m-t-2">
                                        <CancelSubscription 
                                            paidPlan={this.props.paidPlan}
                                            onUpdate={this.props.onCancelSubscription} 
                                        />
                                    </div>
                                </div>

                                <div className="subscription-item">
                                    <h2>Next Billing Date</h2>
                                    <div>Your card will be charged on</div>
                                    <div className="m-t-2">{this.getNextBillingDate()}</div>
                                </div>

                                <div className="subscription-item">
                                    <h2>Payment Method</h2>
                                    { 
                                        this.props.cards ?
                                            this.props.cards.map( card => {
                                                if (card.default) {
                                                    return (
                                                        <div>
                                                            <div>{card.brand} ending in {card.last4}</div>
                                                            <div className="subscription-subtext m-t-1">Expires {card.expMonth.toString().length === 1 ? "0" + card.expMonth : card.expMonth}/{card.expYear}</div>
                                                            <div className="m-t-2"><a onClick={this.props.onAddCard}>Change</a></div>
                                                        </div>
                                                    )
                                                }
                                            } )
                                            :
                                            null
                                    }
                                </div>
                            </div>
                        :
                        null
                }
            </div>
        );
    }
}

module.exports = SubscriptionStatus;
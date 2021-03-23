var i18n = require('../../../store/i18nStore');

module.exports = {

    getExtendedSubscriptionInfo: function ( subscription ) {

        let extended = {
            isInTrial: false,
            momentActiveDate: activeDate
        }

        // Get the date the account was activated
        let activeDate = i18n.moment(subscription.details.activeDate);

        if (subscription.subscriptionInfo.details.trialDays) {
            // Get the number of days for the trial
            let trialDays = parseInt(subscription.subscriptionInfo.details.trialDays);

            // Add the number of days of the trial to the date the trial started (active date) to determine when the trial ends
            let trialEnd = activeDate.clone().add(trialDays, "days");

            extended.trialDays = trialDays;
            extended.trialDaysRemaining = trialEnd.diff(i18n.moment(),"days");
            extended.trialEndsToday = trialEnd.diff(i18n.moment(),"seconds") > 0 && trialEnd.diff(i18n.moment(),"seconds") < 86400;
            extended.momentTrialEnd = trialEnd;
        }

        return extended;
    }

}
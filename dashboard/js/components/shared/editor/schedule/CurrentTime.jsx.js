import React from 'react';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';

class CurrentTime extends React.Component {

    constructor ( props ) {
        super( props );
        this.intervalId;
    }

    componentWillMount () {
        // Create an interval to update the current time. I dont want to kill the page with renders so i'm only doing this once every few seconds.
        this.intervalId = setInterval( () => { this.forceUpdate() }, 5000 );
    }

    componentWillUnmount () {
        clearInterval(this.intervalId);
    }

    render () {
        return (
            <div>
                <h4>Current Time</h4>
                <div>
                    { i18n.moment( Date.now() ).tz( this.props.timezone ).format(CampaignStore.fullDateWithOffsetDisplayFormat) }
                </div>
            </div>
        )
    }

}

module.exports = CurrentTime;
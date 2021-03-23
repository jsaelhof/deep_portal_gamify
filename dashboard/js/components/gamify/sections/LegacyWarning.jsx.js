import React from 'react';
import LocalStorageStore from '../../../store/LocalStorageStore'
import {browserHistory as History} from 'react-router';
import ConfigStore from '../../../store/ConfigStore';
import Confirm from '../../shared/Confirm.jsx';

class LegacyWarning extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            showModal: false,
            showBanner: false
        }
    }

    componentWillMount () {
        let showModal = LocalStorageStore.get("legacyWarningShown") !== true;

         // UGLY HACK
        // There's a weird edge case where the user might see both the tour modal AND the legacy campaign warning on slideouts at the same time if they open the app to the legacy slideout editor via a bookmark etc.
        // I dont have any great way of communicating from that modal that it is showing so I'm just going to hack in a window var for now and clean it later somehow.
        if (window.deepmarkitTourShowing === true) showModal = false;

        this.setState( {
            showModal: showModal,
            showBanner: !showModal
        } ) 
    }

    onConfirm () {
        LocalStorageStore.set("legacyWarningShown", true);
        History.push( ConfigStore.buildRoutePath("create","portal") );
    }

    onCancel () {
        LocalStorageStore.set("legacyWarningShown", true);
        this.setState( { showModal: false, showBanner: true } );
    }

    onNewCampaign () {
        History.push( ConfigStore.buildRoutePath("create","portal") );
    }

    render () {
        return (
            <div>
                {
                    this.state.showModal ?
                        <Confirm 
                            okText="New Campaign" 
                            cancelText="Continue"
                            onConfirm={ this.onConfirm.bind(this) }
                            onCancel={ this.onCancel.bind(this) }
                            title="We've Got New Features For You!"
                        >
                            <div>We wanted to let you know that this is an older campaign which is not able to access many new features that we've recently added.</div>
                            <div style={{"textAlign":"left"}}>
                                <ul className="legacy-campaign-features">
                                    <li>
                                        <div>Custom Entry Form Fields</div>
                                        <div>Add custom fields to your entry form to collect additional information from each user</div>
                                    </li>
                                    <li>
                                        <div>Draw Prizes</div>
                                        <div>Offer draw prizes to everyone that signs up</div>
                                    </li>
                                    <li>
                                        <div>CASH CLUB 50/50 Sweepstakes</div>
                                        <div>Run the CASH CLUB 50/50 Sweepstakes on all your campaigns, encouraging increased participation and reward. All paid by DeepMarkit!</div>
                                    </li>
                                    <li>
                                        <div>Scheduling</div>
                                        <div>Schedule campaigns to appear only on certain days of the week</div>
                                    </li>
                                </ul>
                            </div>
                            <div>This campaign will continue to run properly or you can switch to a new one!</div>
                        </Confirm>
                        :
                        null
                }

                {
                    this.state.showBanner ?
                        <div className="settings">
                            <div className="container">
                                <div className="alert-warning legacy-campaign-warning">
                                    <div>
                                        <i className="material-icons">announcement</i>
                                    </div>
                                    <div>
                                        <div className="legacy-campaign-warning-title">This is an older campaign</div>
                                        <div>
                                            Create a new campaign to take advantage of new features like <span className="legacy-campaign-warning-highlight">Draw Prizes</span>, <span className="legacy-campaign-warning-highlight">Custom Entry Form Fields</span>, <span className="legacy-campaign-warning-highlight">Scheduling</span>, and the <span className="legacy-campaign-warning-highlight">CASH CLUB 50/50 Sweepstakes</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button className="btn btn-default round" onClick={ this.onNewCampaign.bind(this) }>New Campaign</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        null
                }
            </div>
        );
    }

}

module.exports = LegacyWarning;
import _ from 'underscore';
import React from 'react';

import CampaignStore from '../../../store/CampaignStore';
import i18n from '../../../store/i18nStore';
import Loading from '../../shared/Loading.jsx';
import SocialCampaignCard from '../../social/dashboard/CampaignCard.jsx';
import EmailBannerCampaignCard from '../../emailbanner/dashboard/CampaignCard.jsx';
import SlideoutCampaignCard from '../../gamify/sections/CampaignCard.jsx';
import Constants from '../../shared/Constants';

class CampaignList extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            sortedCampaigns: undefined
        }
    }

    componentDidMount () {
        this.sortCampaignList( this.props.campaigns, this.props.hideEnded );
    }

    componentWillReceiveProps ( newProps ) {
        this.sortCampaignList( newProps.campaigns, newProps.hideEnded );
    }

    sortCampaignList ( campaigns, hideEnded ) {
        // Sort the campaigns.
        // First, sort them by last modified time
        // TODO: After we get rid of old campaigns that don't have timestamps, we can remove the check.
        // Right now if there's no timestamp, treat it as 0 so it's the oldest.
        let timestampSorted = _.sortBy( campaigns, ( campaign ) => { return (campaign.details.timestamps) ? campaign.details.timestamps.modified : 0 } ).reverse();
        
        if (hideEnded) {
            timestampSorted = timestampSorted.filter( campaign => { 
                switch ( campaign.status ) {
                    case CampaignStore.STATUS_UNSHEDULED:
                    case CampaignStore.STATUS_SCHEDULED:
                    case CampaignStore.STATUS_RUNNING:
                        return true;
                        break;
                    default:
                        return false;
                        break;
                }
            } );
        }

        // Next, sort the timestampSorted campaigns into status groups.
        let draft = [];
        let active = [];
        let ended = [];

        timestampSorted.forEach( ( campaign ) => { 
            switch ( campaign.status ) {
                case CampaignStore.STATUS_UNSHEDULED:
                    draft.push( campaign );
                    break;
                case CampaignStore.STATUS_SCHEDULED:
                case CampaignStore.STATUS_RUNNING:
                    active.push( campaign );
                    break;
                case CampaignStore.STATUS_DELETED:
                case CampaignStore.STATUS_CANCELLED:
                case CampaignStore.STATUS_SUSPENDED:
                case CampaignStore.STATUS_ENDED:
                    ended.push( campaign );
                    break;
            }
        } )

        // Concat the status groups in the order they should appear on the dashboard.
        let statusSorted = active.concat( draft, ended );

        this.setState( { sortedCampaigns: statusSorted } );
    }

    render () {
        if (!this.state.sortedCampaigns) {
            return (
                <Loading 
                    modal={false} 
                    title={i18n.stringFor("sh_loading_title_campaigns")}
                    message={i18n.stringFor("sh_loading_message_campaigns")}
                />
            );
        }
        
        return (
            <div>
                <div className="social-dashboard">
                    { this.props.show ? 
                        _.size(this.props.campaigns) > 0 ?
                            this.state.sortedCampaigns.length === 0 ?
                                <div className="no-campaign-message">{"There are no " + this.props.displayName + " campaigns to display"}</div>
                                :
                                <div>
                                        {
                                            this.state.sortedCampaigns.map(
                                                campaign => {
                                                    // TODO: This is ugly...there's a better way to dynamically instantiate the relevant component without using a switch. I jsut don't have time to figure it out right now.
                                                    switch (this.props.product) {
                                                        case Constants.PRODUCT_SLIDEOUT:
                                                            return <SlideoutCampaignCard
                                                                campaignDetails={campaign.details}
                                                                key={campaign.campaignHash}
                                                                name={campaign.details.name}
                                                                status={campaign.status}
                                                                campaignHash={campaign.campaignHash}
                                                                lastModified={ (campaign.details.timestamps && campaign.details.timestamps.modified) ? campaign.details.timestamps.modified : 0 }
                                                                onActivate={this.props.onActivate.bind(this)}
                                                                onView={this.props.onView.bind(this)}
                                                                onCancel={this.props.onCancel.bind(this)}
                                                                onRefreshCampaignList={this.props.onRefreshCampaignList.bind(this)}
                                                                product={this.props.product}
                                                            />
                                                            break;
                                                        case Constants.PRODUCT_EMAIL_BANNER:
                                                            return <EmailBannerCampaignCard
                                                                campaignDetails={campaign.details}
                                                                key={campaign.campaignHash}
                                                                name={campaign.details.name}
                                                                status={campaign.status}
                                                                campaignHash={campaign.campaignHash}
                                                                lastModified={ (campaign.details.timestamps && campaign.details.timestamps.modified) ? campaign.details.timestamps.modified : 0 }
                                                                onActivate={this.props.onActivate.bind(this)}
                                                                onView={this.props.onView.bind(this)}
                                                                onCancel={this.props.onCancel.bind(this)}
                                                                onRefreshCampaignList={this.props.onRefreshCampaignList.bind(this)}
                                                                product={this.props.product}
                                                            />
                                                            break;
                                                        case Constants.PRODUCT_SOCIAL:
                                                            return <SocialCampaignCard
                                                                campaignDetails={campaign.details}
                                                                key={campaign.campaignHash}
                                                                name={campaign.details.name}
                                                                status={campaign.status}
                                                                campaignHash={campaign.campaignHash}
                                                                lastModified={ (campaign.details.timestamps && campaign.details.timestamps.modified) ? campaign.details.timestamps.modified : 0 }
                                                                onActivate={this.props.onActivate.bind(this)}
                                                                onView={this.props.onView.bind(this)}
                                                                onCancel={this.props.onCancel.bind(this)}
                                                                onRefreshCampaignList={this.props.onRefreshCampaignList.bind(this)}
                                                                product={this.props.product}
                                                            />
                                                            break;
                                                    }
                                                }, this
                                            )
                                        }
                                </div>
                            :
                            <div className="no-campaign-message">{"You haven't created any " + this.props.displayName + " campaigns yet"}</div>  
                        :
                        null
                    }
                </div>
            </div>
        )
    }
}

module.exports = CampaignList;
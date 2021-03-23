import React from 'react';
import CampaignStore from '../../../store/CampaignStore';
import ConfigStore from '../../../store/ConfigStore';
import UserStore from '../../../store/UserStore';
import { Link, browserHistory as History } from 'react-router';
import String from '../../common/String.jsx';

class LeadDashboard extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            stats: undefined,
            mailIntegration: undefined
        }
    }

    componentDidMount () {
        this.getStats();

        let userDetails = UserStore.getImmutableState().userDetails;
        if (userDetails.mailIntegration) {
            this.setState( { 
                mailIntegration: userDetails.mailIntegration
            } );
        }
    }

    // "Public" methods called directly from outside via a ref

    refresh () {
        this.getStats();
    }

    // End Public mehtods

    getStats () {
        let method = "user/product/lead/stats";
        let params = {
            "groupings": "0,30"
        };

        // If the campaign list is being filteredm only grab the stats for those campaigns.
        if (CampaignStore.getCampaignFilter()) {
            params.campaigns = CampaignStore.getCampaignFilter();
        }

        portalConnection.sendImmediate( {
            method: method, 
            params: params, 
            onSuccess: ( responseData ) => {
                if(responseData.result) {
                    this.setState( { stats: responseData.result } );
                }
            }
        });
    }

    onConfigureMail () {
        History.push(ConfigStore.buildRoutePath("mailintegration"));
    }

    getMailIntegrationServer () {
        return (
            this.state.mailIntegration && 
            this.state.mailIntegration.connected &&
            this.state.mailIntegration.communication && 
            this.state.mailIntegration.communication.mailinglist === "true" 
        ) ? this.state.mailIntegration.communication.server : undefined;
    }

    onViewLeads () {
        History.push(ConfigStore.buildRoutePath("leads"));
    }

    render () {

        let server = this.getMailIntegrationServer();
        
        let serverDisplay;
        switch (server) {
            case "mailchimp":
                serverDisplay = "MailChimp";
                break;
            case "klaviyo":
                serverDisplay = "Klaviyo";
                break;
            case "aweber":
                serverDisplay = "AWeber";
                break;
        }

        let mailIntegrationOff = {
            fontFamily: 'ProximaNova-Semibold,"Helvetica Neue",Arial,Helvetica,sans-serif',
            color: "#ff8e8b"
        }

        let mailIntegrationOn = {
            fontFamily: 'ProximaNova-Semibold,"Helvetica Neue",Arial,Helvetica,sans-serif',
            color: "#7cec91"
        }

        let integrationName = { fontSize: "1.3em", color: "#7cec91", padding: "10px 0" }
        let integrationImage = { width: "60px" }
        let editLinkIcon = { fontSize: "1.2em" }
        let editLinkLabel = { fontSize: "0.85em", verticalAlign: "20%" }
        let editLink = {
            cursor: "pointer",
            color: "#999"
        }

        // let allLeadCountsDisabled = !ConfigStore.showLeadBarNewLeads() && !ConfigStore.showLeadBarLast30Days() && !ConfigStore.showLeadBarAllTime();
        // let viewLeadsAndleadIntegrationDisabled = !ConfigStore.showLeadBarViewLeads() && !ConfigStore.showLeadBarMailIntegration();

        return (
            <div className="lead-bar">
                { ConfigStore.showLeadBarNewLeads() ?
                    <div className="lead-info lead-bar-pod">
                        <div className="lead-data">
                            <h3>{ this.state.stats && this.state.stats[0] !== undefined ? this.state.stats[0] : "-" }</h3>
                            <p><String code='sh_leaddash_today' /></p>
                        </div>
                    </div>
                    :
                    null
                }
                { ConfigStore.showLeadBarLast30Days() ?
                    <div className="lead-info lead-bar-pod">
                        <div className="lead-data">
                            <h3>{ this.state.stats && this.state.stats[30] !== undefined ? this.state.stats[30] : "-" }</h3>
                            <p><String code='sh_leaddash_month' /></p>
                        </div>
                    </div>
                    :
                    null
                }
                { ConfigStore.showLeadBarAllTime() ?
                    <div className="lead-info lead-bar-pod">
                        <div className="lead-data">
                            <h3>{ this.state.stats && this.state.stats.total !== undefined ? this.state.stats.total : "-" }</h3>
                            <p><String code='sh_leaddash_alltime' /></p>
                        </div>
                    </div>
                    :
                    null
                }
                { ConfigStore.showLeadBarViewLeads() ?
                    <div className="lead-download lead-bar-pod" onClick={this.onViewLeads.bind(this)}>
                        <div className="lead-data">
                            <i className="material-icons">list</i>
                            <p><String code='sh_leaddash_view' /></p>
                            {/* <i className="material-icons">list</i>
                            <div className="data-block">
                                <p><String code='sh_leaddash_view' /></p>
                                <button className="btn btn-primary round m-t-2"><String code='sh_leaddash_view_button' onClick={this.onViewLeads.bind(this)}/></button>
                            </div> */}
                        </div>
                    </div>
                    :
                    null
                }
                { ConfigStore.showLeadBarMailIntegration() ?
                    <div className="lead-mail lead-bar-pod" onClick={this.onConfigureMail.bind(this)}>
                        <div className="lead-data">
                            {/* { ( server ) ?
                                <img style={integrationImage} src={"/dashboard/images/leadintegration/"+server+"_icon.png"}/>
                                : */}
                                <i className="material-icons">mail</i>
                            {/* } */}

                            { ( server ) ?
                                <p><String code='sh_leaddash_mailintegration' /> <span style={ mailIntegrationOn }>{serverDisplay}</span></p>
                                : 
                                <p><String code='sh_leaddash_mailintegration' /> <span style={ mailIntegrationOff }><String code='sh_leaddash_mailintegration_not_setup' /></span></p>
                            }

                            {/* { ( server ) ?
                                <img style={integrationImage} src={"/dashboard/images/leadintegration/"+server+"_icon.png"}/>
                                :
                                <i className="material-icons">mail</i>
                            }
                            <div className="data-block">
                                { ( server ) ?
                                        <div>
                                            <p><String code='sh_leaddash_leads_connected' /></p>
                                            <div style={integrationName}>{serverDisplay}</div>
                                            <div>
                                                <Link onClick={this.onConfigureMail.bind(this)} style={editLink}>
                                                    <p className="material-icons" style={ editLinkIcon }>mode_edit</p>
                                                    <span style={editLinkLabel}> <String code='sh_leaddash_edit_integration' /></span>
                                                </Link>
                                            </div>
                                        </div>
                                :
                                    
                                        <div>
                                            <div><String code='sh_leaddash_mailintegration' /> <span style={ mailIntegrationStatus }><String code='sh_leaddash_mailintegration_not_setup' /></span></div>
                                            <button className="btn btn-danger round m-t-2" onClick={this.onConfigureMail.bind(this)}><String code='sh_leaddash_configure_integration' /></button>
                                        </div>
                                }
                            </div> */}
                        </div>
                    </div>
                    :
                    null
                }
            </div>
        )  
    }

}

module.exports = LeadDashboard
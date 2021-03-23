import React from 'react';
import {browserHistory as History} from 'react-router';
import ConfigStore from '../../../store/ConfigStore';
import CampaignStore from '../../../store/CampaignStore';
import i18n from '../../../store/i18nStore';

class ActionBar extends React.Component {
    constructor( props ) {
        super( props );
    }

    onNavButtonClick ( buttonConf ) {
        if (buttonConf.callback) {
            buttonConf.callback( buttonConf.id );
        } else if (buttonConf.href) {
            window.open(buttonConf.href, "_blank");
        }
    } 

    onDashboard () {
        History.push(ConfigStore.getDashboardRoute());
    }

    getButtonsForGroup ( group ) {

        let saveConfig = {
            id: "save",
            label: "Save",
            type: "primary",
            callback: this.props.onClick
        }

        let savePreviewConfig = {
            id: "savepreview",
            label: "Save & Preview",
            type: "default",
            callback: this.props.onClick
        }

        // Based on the group, create a pre-set configuration of buttons
        switch (group) {
            case "newcampaign":
            case "gamechange":
                return [
                    {
                        id: "cancel",
                        label: "Cancel",
                        type: "danger",
                        callback: this.props.onClick
                    }
                ];
                break;
            case "mailintegration":
                return [
                    saveConfig
                ];
                break;
            case "editor":
                return [
                    savePreviewConfig,
                    saveConfig
                ];
                break;
            case "editor_active":
                return [
                    {
                        id: "cancelcampaign",
                        label: "Cancel Campaign",
                        type: "danger",
                        callback: this.props.onClick
                    },
                    savePreviewConfig,
                    saveConfig
                ];
                break;
            default:
                return [];
                break;
        }
    }

    render() {

        let dashboardConfig = {
            id: "dashboard",
            label: "Dashboard",
            type: "default",
            callback: this.props.onClick
        }

        return (
            <div id="actionbar" className="action-bar">
                { this.props.hideDashboard ? null :
                    <div className="action-bar-dashboard">
                        <button key={dashboardConfig.id} className={"action-button btn-"+dashboardConfig.type} onClick={this.onDashboard.bind(this,dashboardConfig)}>{dashboardConfig.label}</button> 
                    </div>
                }

                {/* Only show the activate button or status if needed. This block is used by the editor */}
                { 
                    this.props.showActivateCampaign ? 
                        <div className="action-bar-cta">
                            { this.props.featureAuth ?
                                <button key={"activate"} className={"action-button btn-call-to-action"} onClick={this.props.onClick.bind(this,"activate")}>{ i18n.stringFor("editor_cta_button") }</button>
                                :
                                <button key={"activate"} className={"action-button btn-call-to-subscribe"} onClick={this.props.onClick.bind(this,"activate")}>{ i18n.stringFor("editor_cts_button") }</button>
                            }
                        </div>
                        : null
                }

                {/* Only show the status displays if status is provided AND showActivateCampaign is not (it overrides this area) */}
                {
                    !this.props.showActivateCampaign && CampaignStore.isActive(this.props.status) ?
                        <div className="activation-status-wrapper">
                            <div>This campaign is <span className="activation-status activation-status-active">Active</span></div>
                            <div className="activation-notice">Some campaign details cannot be changed</div>
                        </div>  
                        :
                        null
                }

                {
                    !this.props.showActivateCampaign && CampaignStore.isComplete(this.props.status) ?
                        <div className="activation-status-wrapper">
                            <div>This campaign is <span className="activation-status activation-status-ended">Ended</span></div>
                            <div className="activation-notice">Campaign details cannot be changed or saved</div>
                        </div>  
                        :
                        null
                }

                { this.props.buttonGroup ? 
                    <div className="action-bar-buttons">
                        { 
                            this.getButtonsForGroup(this.props.buttonGroup).map( (buttonConf) => {
                                return <button key={buttonConf.id} className={"action-button btn-"+buttonConf.type} onClick={this.onNavButtonClick.bind(this,buttonConf)}>{buttonConf.label}</button>
                            } )
                        }
                    </div>
                    :
                    this.props.buttons ?
                        <div className="action-bar-buttons">
                            { 
                                this.props.buttons.map( (buttonConf) => {
                                    return <button key={buttonConf.id} className={"action-button btn-"+buttonConf.type} onClick={this.onNavButtonClick.bind(this,buttonConf)}>{buttonConf.label}</button>
                                } )
                            }
                        </div>
                        :
                        null
                }
            </div>
        );
    }
}

module.exports = ActionBar;
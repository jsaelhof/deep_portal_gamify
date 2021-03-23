import React from 'react';
import { browserHistory as History } from 'react-router';
import ErrorStore from '../../store/ErrorStore';
import ConfigStore from '../../store/ConfigStore';


class ErrorPage extends React.Component {

    constructor ( props ) {
        super( props );
    }

    onDashboard () {
        ErrorStore.clear();
        History.push(ConfigStore.getDashboardRoute());
    }

    onContact () {
        let subject = "DeepMarkit App Error"

        var body = "Please include any comments or information that you think would be helpful above this line."
        body += "\n\n";
        body += "----------------------------------------------------------------------------------";
        body += "\n\n";
        body += "Error Code: " + this.props.error.code;
        body += "\n\n";
        body += this.props.error.devMessage;
        body += "\n\n";
        body += "Data: " + JSON.stringify(this.props.error.data);
        body += "\n\n";
        body += "Time: " + this.props.error.timestamp;
        body += "\n";
        body += "Browser: " + window.navigator.userAgent;
        body += "\n";
        body += "Platform: " + window.navigator.platform;
        body += "\n";
        body += "AppName: " + window.navigator.appName;
        body += "\n";
        body += "AppCodeName: " + window.navigator.appCodeName;
        body += "\n";
        body += "AppVer: " + window.navigator.appVersion;
        body += "\n";
        body += "Vendor: " + window.navigator.vendor;
        body += "\n";
        body += "VendorSub: " + window.navigator.vendorSub;
        body += "\n";
        body += "Language: " + window.navigator.language;
        body += "\n";
        body += "URL: " + window.location.href;

        var mailToLink = "mailto:support@deepmarkit.com?subject="+ encodeURIComponent(subject) +"&body=" + encodeURIComponent(body);
        window.open(mailToLink);
    }

    render () {
        return (
            <div>
                <div id="topbar" className="top-bar">
                    <div className="top-bar-logo">
                        <img src="/dashboard/images/nav/deepmarkit.png"/>
                    </div>
                </div>

                <div className="gamify-error">
                    <div className="gamify-error-row">
                        <div className="gamify-error-image"><img src="/dashboard/images/error_robot.png"/></div>
                        <div className="gamify-error-desc">
                            <div className="gamify-error-title">{ this.props.error.userTitle ? this.props.error.userTitle : "Something went wrong&nbsp;&nbsp;: (" }</div>
                            <div className="gamify-error-user">
                                {
                                    this.props.error.userMessage.split("\n").map( message => {
                                        return <p>{message}</p>
                                    } )
                                }
                            </div>
                            <div className="gamify-error-buttons">
                                { this.props.error.flags.hideDashboardButton ? null : <button type="button" className="btn btn-default round modal-button" onClick={this.onDashboard.bind( this )}>Dashboard</button> }
                                <button type="button" className="btn btn-default round modal-button" onClick={this.onContact.bind( this )}>Let Us Know</button>
                            </div>
                        </div>
                    </div>
                    <div className="gamify-error-row">
                        <div className="gamify-error-dev">
                            <p>Geek Speak:</p>
                            <p>
                                {this.props.error.code + ": " + this.props.error.devMessage}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

module.exports = ErrorPage;
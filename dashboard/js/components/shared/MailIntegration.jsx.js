import React from 'react';
import String from '../common/String.jsx';
import ConfigStore from '../../store/ConfigStore';
import UserStore from '../../store/UserStore';
import ValidationError from '../common/ValidationError.jsx.js';
import i18n from '../../store/i18nStore';
import Loading from './Loading.jsx';
import MailChimp from '../common/EmailListConfiguration/MailChimp/MailChimpConfig.jsx.js';
import Klaviyo from '../common/EmailListConfiguration/Klaviyo/KlaviyoConfig.jsx.js';
import Aweber from '../common/EmailListConfiguration/Aweber/AweberConfig.jsx.js';
import MailChimpEmailListConfigurator from './mail/MailChimpEmailListConfigurator.jsx';
import KlaviyoEmailListConfigurator from './mail/KlaviyoEmailListConfigurator.jsx';
import AWeberEmailListConfigurator from './mail/AWeberEmailListConfigurator.jsx';
import ThemeStore from '../../store/ThemeStore';
import SaveStatus from './SaveStatus.jsx';
import _ from 'underscore';
import ActionBar from './nav/ActionBar.jsx';

class MailIntegration extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            loading: true,
            dirty: undefined,
            list: [],
            connected: false
            //template: undefined
        }

        this.rdcKey = "redirectCommunication";
    }

    componentWillMount () {
        this.addLeaveHooks();
        ThemeStore.addEventListener( this );
        UserStore.addEventListener( this );
    }

    componentWillUnmount () {
        this.removeLeaveHooks();
        ThemeStore.removeEventListener( this );
        UserStore.removeEventListener( this );
    }

    componentDidMount_ () {
        this.RESET();
    }

    componentDidMount () {
        let userDetails = UserStore.getImmutableState().userDetails;

        // Create the default state update if no user details exist.
        let stateUpdate = {
            communication: { 
                settings: { 
                    subscription: 'subscribed' 
                } 
            }
        };

        // Check if the user details has any saved mail integration info.
        if (userDetails.mailIntegration) {
            if (userDetails.mailIntegration.communication) stateUpdate.communication = userDetails.mailIntegration.communication;
            if (userDetails.mailIntegration.forms) stateUpdate.forms = userDetails.mailIntegration.forms;
            if (userDetails.mailIntegration.connected) stateUpdate.connected = userDetails.mailIntegration.connected;
        }

        // Check if the server has left any mesages in the User object about partially finshed mail integrations that use an external redirection
        // If found, overwrite any communication object in the userDetails.mailIntegration object.
        if (UserStore.hasMessage("aweber")) {
            // For aweber, join the message information with our own data to mark aweber as the selected integration.
            // This gets lost during the redirection because the user does not get to save before leaving our app and going to aweber.
            stateUpdate.communication = { 
                mailinglist: 'true',
                server: 'aweber',
                settings: UserStore.getMessage("aweber")
            }

            // Remove the message from the user object so it doesn't get handled again.
            UserStore.removeMessage( "aweber" );
        }

        this.setState( stateUpdate, () => {
            // If the user details had no forms.ENTRY_PAGE information then we have to go get it from the theme.
            // If it does, then we've already done this and saved it so we can skip all the loading.
            if (userDetails.mailIntegration && userDetails.mailIntegration.forms && userDetails.mailIntegration.forms.ENTRY_PAGE) {
                this.setState( { loading: false } );
            } else {

                // TODO: This is a hack to get us by until the we move mail integration back to the campaign level and add field mapping
                // For now we are just saying that every tempalte will use this email field info.
                // It worked (somehow...i dont understand how) with template 3 but new tempaltes don't use the theme properties file so this component was failing.
                // We used to do this by first finding out what theme was in use (not possible at the global level so we just went and got the first theme for template 3)
                // then we'd load the theme properties file for that theme and find this info in it. Since that's broken for new themes i had no choice but just hardcode it here
                // for now and see if we can make it work.
                this.setState( { 
                    forms: {
                        ENTRY_PAGE: {
                            "email": {
                                "type": "email",
                                "input": "email",
                                "label": "label_email",
                                "placeholder": "label_email_placeholder",
                                "keyField": "true",
                                "category": "contact",
                                "index": 0,
                                "validation": {
                                    "max": 254,
                                    "required": true
                                }
                            }
                        },
                        PRIZES_PAGE: {}
                    },
                    loading: false 
                } );
            }
        } );
    }

    addLeaveHooks () {
        // ***** HANDLE WARNING THE USER ABOUT UNSAVED CHANGES ********

        // Handle user trying to go to a different website
        window.onbeforeunload = (e) => {
            if ( this.state.dirty ) {
                let message = i18n.stringFor('sh_label_unsaved_changes');
                (e || window.event).returnValue = message; // IE
                return message; // Everyone else
            }
        }

        // Handle user changing react routes (which does not create an onbeforeunload event)
        this.unregisterLeaveHook = this.props.router.setRouteLeaveHook(
            this.props.route,
            ( next ) => {
                if (this.state.dirty) {
                    return i18n.stringFor('sh_label_unsaved_changes');
                } else {
                    return true;
                }
            }
        );
    }

    removeLeaveHooks () {
        window.onbeforeunload = undefined;
        this.unregisterLeaveHook = undefined;
    }

    RESET () {
        let userDetailsUpdate = {
            mailIntegration: {}
        }
        UserStore.sendUpdateUser( userDetailsUpdate, true );
    }

    onNavClick (id) {
        switch ( id ) {
            case "save":
                this.save();
                break;
        }
    }

    save () {
        if (this.state.dirty) {
            
            let userDetailsUpdate = {
                mailIntegration: {
                    connected: this.state.connected,
                    communication: { ...this.state.communication },
                    forms: { ...this.state.forms }
                }
            }

            UserStore.sendUpdateUser( userDetailsUpdate, true );
        }
    }

    onUserUpdateInfo ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState( { dirty: false } );
        }
    }
 
    // onThemeListRetrieved ( e ) {
    //     if ( e.response && e.response.hasErrors() ) {
    //         // TODO: Handle the error
    //         this.setState( { lastResponse: e.response } );
    //     } else {
    //         // Get the theme list so we can get the template key
    //         // Currently we are assuming there will be only ONE template so we will grab themes[0]
    //         this.setState( { 
    //             template: e.response.result.themes[0].templateKey
    //         }, () => {
    //             this.getThemeProperties();
    //         } );
    //     }
    // }

    // TODO: Since we're bringing in ThemeStore anyway, this could be moved there and given an event.
    // It would inherit some of the error handling too
    // getThemeProperties () {
    //     $.ajax( {
    //         type: 'GET',
    //         contentType: 'application/json',
    //         dataType: 'json',
    //         url: "/themes/"+this.state.template+"-common/themeproperties.json",
    //         success: function (data) {

    //             // UGLY MAPPING
    //             // The theme props stores the data as form_fields.entry and form_fields.claim.
    //             // The campaign details has to store it as forms.ENTRY_PAGE and forms.PRIZES_PAGE in order for the theme itself to actually read it at runtime.
    //             // So instead of being able to take the data from theme verbatim, we have to change the key names so that the theme can actually read it's own damn data.
    //             let remap = {
    //                 ENTRY_PAGE: data.form_fields.entry,
    //                 PRIZES_PAGE: data.form_fields.claim
    //             }

    //             this.setState( { 
    //                 forms: remap,
    //                 loading: false 
    //             } );
    //         }.bind( this ),
    //         error: function (xhr, status, error) {
    //             // TODO: Handle an error loading the theme
    //         }.bind( this )
    //     } );
    // }

    update(updatedCommunication, updatedForms, callback) {
        // Check if there are actually any changes.
        // If both objects are the same, then don't set a dirty state, don't make any updates and don't bother saving anything.
        // Note, this test is flaky at best...it'll say they aren't equal if the order changes but contents don't.
        // Underscore's isEqual is supposed to be a deep compare but fails often when these are the same.
        // Might have to look into a third-party function or something.
        // TODO: More robust deep comparison
        let commUnchanged = JSON.stringify(updatedCommunication) === JSON.stringify(this.state.communication);
        let formUnchanged = JSON.stringify(updatedForms) === JSON.stringify(this.state.forms);

        if (!commUnchanged || !formUnchanged) {
            this.setState( { dirty: true, communication: updatedCommunication, forms: updatedForms }, () => {
                if (callback) callback();
            } );
        } else if (callback) {
            // No change was made but there's a callback...call it to continue the flow.
            // NOTE: I don't know for sure if this case is ever actually hit. I'm just adding it in case. We should maybe do more testing on this.
            // Ideally, we would not have the module (AWeberConfig etc) sending out callbacks. This should be more event driven and handled
            // internally by the module itself.
            callback();
        }
    }

    formOnChange ( e ) {
        let communication = {...this.state.communication};
        communication[ e.target.name ] = e.target.value;
        this.update(communication, this.state.forms);
    }
    
    formOnSettingsChange ( e ) {
        let communication = {...this.state.communication};
        communication.settings[ e.target.name ] = e.target.value;
        this.update(communication, this.state.forms);
    }

    setServer ( type ) {
        let communication = {...this.state.communication};
        let forms = {...this.state.forms};

        if ( communication.mailinglist === 'true' ) {
            // If the connection is on, mark it disconnected now that's it being toggled off
            this.setState({ connected: false }, () => {
                communication.mailinglist = 'false';
                communication.settings = {};

                _.forEach( forms.ENTRY_PAGE, function ( field ) {
                    if ( field.key !== 'EMAIL' ) {
                        delete field.mailingListField;
                        delete field.mailingListFieldType;
                    }
                } );

                this.update(communication, this.state.forms);
            } );
        } else {
            // If the integration is enabled, we don't set connected yet. That comes later once the connection is actually made.
            communication.mailinglist = 'true';
            communication.server = type;
            this.update(communication, this.state.forms);
        }
    }

    onSettingsChange(settings, dataFields, save, callback) {
        let communication = {...this.state.communication} || {};
        communication.settings = settings;

        let forms = {...this.state.forms} || {};
        forms.ENTRY_PAGE = dataFields;

        this.update(communication, forms, callback);
    }

    onConnectedChange ( connected ) {
        if (connected !== this.state.connected) {
            this.setState({ dirty: true, connected: connected });
        }
    }

    onRedirectToExternalAuth () {
        this.removeLeaveHooks();
    }

    onClearSettings () {
        let communication = {...this.state.communication} || {};
        communication.server = undefined;
        communication.mailinglist = false;
        communication.settings = {};
        this.update( communication, this.state.forms );
    }

    isSelected(type) {
        return this.state.communication && this.state.communication.mailinglist === 'true' && this.state.communication.server === type;
    }
    isMailchimpSelected() {
        return this.state.communication.mailinglist === 'true' && this.state.communication.server === 'mailchimp';
    }
    isMailingListOff() {
        return !this.state.communication.mailinglist || this.state.communication.mailinglist === 'false';
    }
    isKlaviyoSelected() {
        return this.state.communication.mailinglist === 'true' && this.state.communication.server === 'klaviyo';
    }
    isAweberSelected() {
        return this.state.communication.mailinglist === 'true' && this.state.communication.server === 'aweber';
    }
    render() {
        if (this.state.loading) return <Loading modal={false} />;

        return (
            <div>
                <ActionBar buttonGroup="mailintegration" onClick={this.onNavClick.bind(this)} />
                <div className="action-bar-spacer"/>

                <div className="settings">
                    <div className="container">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <div className="panel-heading-label">
                                    <h1>
                                        <String code='sh_label_email_integration'/>
                                    </h1>
                                    <h3 className="subheading"><String code="sh_label_mailintegration_desc"/></h3>
                                </div>
                            </div>

                            <div className="panel-body">
                                <div>

                                    <div className="col-xs-12">
                                        <h2 className="sub-header">
                                            <String code='label_mailing_list'/>
                                        </h2>
                                    </div>

                                    <div className="col-xs-12 m-t-3">
                                        <p><String code='hint_email_required' /></p>
                                    </div>

                                    <div className="col-xs-12">
                                        <p><String code='hint_mailing_list'/></p>
                                    </div>

                                    <div className="clearfix"/>

                                    <div className="col-xs-12 m-t-1">
                                        <h2><String code="label_connect_to_mailing_list" /></h2>
                                    </div>

                                    <div className="col-xs-6">

                                        <div className="input-group mail-group p-t-2">
                                            {
                                                !ConfigStore.isMailIntegrationDisabled("mailchimp") && (this.isMailchimpSelected() || this.isMailingListOff()) ?
                                                    (
                                                        <label className="radio-inline mail-toggle">
                                                            <div className="pull-right m-t-2">
                                                                <span className="toggle">
                                                                    <input 
                                                                        type="checkbox"
                                                                        id={"toggle-mailchimp"}
                                                                        data-switch="color"
                                                                        disabled={false}
                                                                        name="activeToggle"
                                                                        onChange={this.setServer.bind(this, 'mailchimp')}
                                                                        checked={this.isSelected('mailchimp')}
                                                                    />
                                                                    <label htmlFor={"toggle-mailchimp"} className="m-b-0" />
                                                                </span>
                                                            </div>

                                                            <input type="radio" name="server" value="mailchimp" onChange={this.formOnChange.bind(this)}
                                                                checked={this.state.communication.mailinglist === 'true'}
                                                                disabled={this.state.communication.mailinglist === 'false'} />
                                                            <div style={{
                                                                backgroundImage: "url(/dashboard/images/leadintegration/mailchimp.png)",
                                                                height: "45px",
                                                                width: "150px",
                                                                backgroundSize: "contain",
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "left center"
                                                            }} />
                                                        </label>
                                                    ) : null
                                            }

                                            {
                                                !ConfigStore.isMailIntegrationDisabled("klaviyo") && (this.isKlaviyoSelected() || this.isMailingListOff()) ?
                                                    (
                                                        <label className="radio-inline mail-toggle">
                                                            <div className="pull-right m-t-2">
                                                                <span className="toggle">
                                                                    <input 
                                                                        type="checkbox"
                                                                        id={"toggle-klaviyo"}
                                                                        data-switch="color"
                                                                        disabled={false}
                                                                        name="activeToggle"
                                                                        onChange={this.setServer.bind(this, 'klaviyo')}
                                                                        checked={this.isSelected('klaviyo')}
                                                                    />
                                                                    <label htmlFor={"toggle-klaviyo"} className="m-b-0" />
                                                                </span>
                                                            </div>

                                                            <input type="radio" name="server" value="klaviyo" onChange={this.formOnChange.bind(this)}
                                                                checked={this.state.communication.mailinglist === 'true'}
                                                                disabled={this.state.communication.mailinglist === 'false'} />
                                                            <div style={{
                                                                backgroundImage: "url(/dashboard/images/leadintegration/klaviyo.png)",
                                                                height: "45px",
                                                                width: "150px",
                                                                backgroundSize: "contain",
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "left center"
                                                            }} />
                                                        </label>
                                                    ) : null
                                            }
                                            {
                                                !ConfigStore.isMailIntegrationDisabled("aweber") && (this.isAweberSelected() || this.isMailingListOff()) ?
                                                    (
                                                        <label className="radio-inline mail-toggle">
                                                            <div className="pull-right m-t-2">
                                                                <span className="toggle">
                                                                    <input 
                                                                        type="checkbox"
                                                                        id={"toggle-aweber"}
                                                                        data-switch="color"
                                                                        disabled={false}
                                                                        name="activeToggle"
                                                                        onChange={this.setServer.bind(this, 'aweber')}
                                                                        checked={this.isSelected('aweber')}
                                                                    />
                                                                    <label htmlFor={"toggle-aweber"} className="m-b-0" />
                                                                </span>
                                                            </div>

                                                            <input type="radio" name="server" value="aweber" onChange={this.formOnChange.bind(this)}
                                                                checked={this.state.communication.mailinglist === 'true'}
                                                                disabled={this.state.communication.mailinglist === 'false'} />

                                                            <div style={{
                                                                backgroundImage: "url(/dashboard/images/leadintegration/aweber.png)",
                                                                height: "45px",
                                                                width: "150px",
                                                                backgroundSize: "contain",
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "left center"
                                                            }} />
                                                        </label>
                                                    ) : null
                                            }
                                        </div>
                                        <ValidationError response={this.state.lastResponse} field="server"/>
                                    </div>
                                </div>

                                <div className="clearfix" />

                                <div className={this.state.communication.mailinglist === 'true' ? '' : 'hidden'}>
                                    {
                                        this.isMailchimpSelected() ?
                                            <MailChimp apiKey={this.state.communication.settings.apiKey}
                                                listId={this.state.communication.settings.listId}
                                                subscription={this.state.communication.settings.subscription}
                                                dataFields={this.state.forms.ENTRY_PAGE}
                                                clearSettings={this.state.clearSettings}
                                                readOnly={false} //CampaignStore.Ended() <-- This was using CampaignStore.ENDED in the pro portal. Since this is portal handles mail integration globably i dont think we've ever need to show this as read only.
                                                listConfigurator={MailChimpEmailListConfigurator}
                                                onChange={this.onSettingsChange.bind(this)} 
                                                onConnectedChange={this.onConnectedChange.bind(this)}
                                                onClearSettings={this.onClearSettings.bind(this)}
                                            /> : null
                                    }
                                    {
                                        this.isKlaviyoSelected() ?
                                            <Klaviyo apiKey={this.state.communication.settings.apiKey}
                                                listId={this.state.communication.settings.listId}
                                                subscription={this.state.communication.settings.subscription}
                                                dataFields={this.state.forms.ENTRY_PAGE}
                                                clearSettings={this.state.clearSettings}
                                                readOnly={false}
                                                listConfigurator={KlaviyoEmailListConfigurator}
                                                onChange={this.onSettingsChange.bind(this)} 
                                                onConnectedChange={this.onConnectedChange.bind(this)}
                                                onClearSettings={this.onClearSettings.bind(this)}
                                            /> : null
                                    }

                                    {
                                        this.isAweberSelected() ?
                                            <Aweber 
                                                token={this.state.communication.settings.token}
                                                tokenSecret={this.state.communication.settings.tokenSecret}
                                                accountId={this.state.communication.settings.accountId}
                                                listId={this.state.communication.settings.listId}
                                                dataFields={this.state.forms.ENTRY_PAGE}  
                                                readOnly={false} 
                                                listConfigurator={AWeberEmailListConfigurator}   
                                                onChange={this.onSettingsChange.bind(this)}                                  
                                                onRedirectToExternalAuth={this.onRedirectToExternalAuth.bind(this)}
                                                onConnectedChange={this.onConnectedChange.bind(this)}
                                                onClearSettings={this.onClearSettings.bind(this)}
                                            /> : null
                                    }

                                </div>
                            </div>
                        </div>
                    </div>

                    <SaveStatus saved={false} show={this.state.dirty !== undefined && this.state.dirty === true} />
                    <SaveStatus saved={true} show={this.state.dirty !== undefined && this.state.dirty === false} />
                </div>
            </div>
        )
    }
}

module.exports = MailIntegration;
import React from 'react';
import String from '../../common/String.jsx';
import ConfigStore from '../../../store/ConfigStore';
import UserStore from '../../../store/UserStore';
import ValidationError from '../../common/ValidationError.jsx';
import i18n from '../../../store/i18nStore';
import Loading from '../Loading.jsx';
import MailChimp from '../../common/EmailListConfiguration/MailChimp/MailChimpConfig.jsx';
import Klaviyo from '../../common/EmailListConfiguration/Klaviyo/KlaviyoConfig.jsx';
import Aweber from '../../common/EmailListConfiguration/Aweber/AweberConfig.jsx';
import MailChimpEmailListConfigurator from '../mail/MailChimpEmailListConfigurator.jsx';
import KlaviyoEmailListConfigurator from '../mail/KlaviyoEmailListConfigurator.jsx';
import AWeberEmailListConfigurator from '../mail/AWeberEmailListConfigurator.jsx';
import ThemeStore from '../../../store/ThemeStore';
import _ from 'underscore';

class MailIntegration extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            loading: true,
            list: []
            //template: undefined
        }

        this.rdcKey = "redirectCommunication";
    }

    componentWillMount () {
        //this.addLeaveHooks();
        //ThemeStore.addEventListener( this );
        UserStore.addEventListener( this );


        let doNotSetDirty;
        let updatedLeadIntegration;

        console.log("CWM",this.props.campaignDetails.leadIntegration);

        // If there is no basic lead integration info in the campaign (old campaigns), just add the default in.
        // TODO: Forms should be coming from the tempalte theme. We'll have to change this to go and get the theme descriptor if it's not here (or see if the editor all ready has it and can pass it in)
        if (!this.props.campaignDetails.leadIntegration) {
            console.log("No integration...set default")
            updatedLeadIntegration = {
                communication: {
                    settings: {
                        subscription: "subscribed"
                    }
                },
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
                }
            }

            doNotSetDirty = true;
        }

        // Check if the server has left any mesages in the User object about partially finshed mail integrations that use an external redirection
        // If found, overwrite any communication object in the userDetails.mailIntegration object.
        if (UserStore.hasMessage("aweber")) {
            updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
            // For aweber, join the message information with our own data to mark aweber as the selected integration.
            // This gets lost during the redirection because the user does not get to save before leaving our app and going to aweber.
            updatedLeadIntegration.communication = { 
                mailinglist: 'true',
                server: 'aweber',
                settings: UserStore.getMessage("aweber")
            }

            // Remove the message from the user object so it doesn't get handled again.
            UserStore.removeMessage( "aweber" );
        }

        if (updatedLeadIntegration) {
            this.props.onUpdate( updatedLeadIntegration, doNotSetDirty );
        }
    }

    componentWillUnmount () {
        //this.removeLeaveHooks();
        //ThemeStore.removeEventListener( this );
        UserStore.removeEventListener( this );
    }

    // componentDidMount_ () {
    //     this.RESET();
    // }

    componentDidMount () {
        // Create the default state update if no user details exist.
        // let stateUpdate = {
        //     communication: { 
        //         settings: { 
        //             subscription: 'subscribed' 
        //         } 
        //     }
        // };


        // let migrationUpdate;

        // // Check if the campaign details has any saved mail integration info.
        // if (this.props.campaignDetails.leadIntegration) {
        //     if (this.props.campaignDetails.leadIntegration.communication) stateUpdate.communication = this.props.campaignDetails.leadIntegration.communication;
        //     if (this.props.campaignDetails.leadIntegration.forms) stateUpdate.forms = this.props.campaignDetails.leadIntegration.forms;
        //     if (this.props.campaignDetails.leadIntegration.connected) stateUpdate.connected = this.props.campaignDetails.leadIntegration.connected;
        // } else {
        //     // No cmpaign level lead integration, check and see if this user had a global mail integration setup in the old system (deprecated)
        //     let userDetails = UserStore.getImmutableState().userDetails;
        //     if (userDetails.mailIntegration) {
        //         if (userDetails.mailIntegration) {
        //             if (userDetails.mailIntegration.communication) {
        //                 stateUpdate.communication = userDetails.mailIntegration.communication;
        //                 migrationUpdate = true;
        //             }
        //             if (userDetails.mailIntegration.forms) {
        //                 stateUpdate.forms = userDetails.mailIntegration.forms;
        //                 migrationUpdate = true;
        //             }
        //             if (userDetails.mailIntegration.connected) {
        //                 stateUpdate.connected = userDetails.mailIntegration.connected;
        //                 migrationUpdate = true;
        //             }
        //         }
        //     }
        // }

        

        // if (!this.props.campaignDetails.leadIntegration.forms || !this.props.campaignDetails.leadIntegration.forms.ENTRY_PAGE) {
            // updatedLeadIntegration.forms = {
            //     ENTRY_PAGE: {
            //         "email": {
            //             "type": "email",
            //             "input": "email",
            //             "label": "label_email",
            //             "placeholder": "label_email_placeholder",
            //             "keyField": "true",
            //             "category": "contact",
            //             "index": 0,
            //             "validation": {
            //                 "max": 254,
            //                 "required": true
            //             }
            //         }
            //     },
            //     PRIZES_PAGE: {}
            // }

        //     updateRequired = true;
        // }



        // this.setState( stateUpdate, () => {
        //     // If the user details had no forms.ENTRY_PAGE information then we have to go get it from the theme.
        //     // If it does, then we've already done this and saved it so we can skip all the loading.
        //     if (stateUpdate.forms && stateUpdate.forms.ENTRY_PAGE) {
        //         this.setState( { loading: false } );
        //     } else {

        //         // TODO: This is a hack to get us by until the we move mail integration back to the campaign level and add field mapping
        //         // For now we are just saying that every tempalte will use this email field info.
        //         // It worked (somehow...i dont understand how) with template 3 but new tempaltes don't use the theme properties file so this component was failing.
        //         // We used to do this by first finding out what theme was in use (not possible at the global level so we just went and got the first theme for template 3)
        //         // then we'd load the theme properties file for that theme and find this info in it. Since that's broken for new themes i had no choice but just hardcode it here
        //         // for now and see if we can make it work.
        //         this.setState( { 
        //             forms: {
        //                 ENTRY_PAGE: {
        //                     "email": {
        //                         "type": "email",
        //                         "input": "email",
        //                         "label": "label_email",
        //                         "placeholder": "label_email_placeholder",
        //                         "keyField": "true",
        //                         "category": "contact",
        //                         "index": 0,
        //                         "validation": {
        //                             "max": 254,
        //                             "required": true
        //                         }
        //                     }
        //                 },
        //                 PRIZES_PAGE: {}
        //             },
        //             loading: false 
        //         } );
        //     }
        // } );
    }

    // addLeaveHooks () {
    //     // ***** HANDLE WARNING THE USER ABOUT UNSAVED CHANGES ********

    //     // Handle user trying to go to a different website
    //     window.onbeforeunload = (e) => {
    //         if ( this.state.dirty ) {
    //             let message = i18n.stringFor('sh_label_unsaved_changes');
    //             (e || window.event).returnValue = message; // IE
    //             return message; // Everyone else
    //         }
    //     }

    //     // Handle user changing react routes (which does not create an onbeforeunload event)
    //     this.unregisterLeaveHook = this.props.router.setRouteLeaveHook(
    //         this.props.route,
    //         ( next ) => {
    //             if (this.state.dirty) {
    //                 return i18n.stringFor('sh_label_unsaved_changes');
    //             } else {
    //                 return true;
    //             }
    //         }
    //     );
    // }

    // removeLeaveHooks () {
    //     window.onbeforeunload = undefined;
    //     this.unregisterLeaveHook = undefined;
    // }

    // RESET () {
    //     let userDetailsUpdate = {
    //         mailIntegration: {}
    //     }
    //     UserStore.sendUpdateUser( userDetailsUpdate, true );
    // }

    // onNavClick (id) {
    //     switch ( id ) {
    //         case "save":
    //             this.save();
    //             break;
    //     }
    // }

    // save () {
    //     if (this.state.dirty) {
            
    //         let userDetailsUpdate = {
    //             mailIntegration: {
    //                 connected: this.state.connected,
    //                 communication: { ...this.state.communication },
    //                 forms: { ...this.state.forms }
    //             }
    //         }

    //         UserStore.sendUpdateUser( userDetailsUpdate, true );
    //     }
    // }

    // onUserUpdateInfo ( e ) {
    //     if ( e.response && e.response.hasErrors() ) {
    //         // TODO: Handle the error
    //         this.setState( { lastResponse: e.response } );
    //     } else {
    //         this.setState( { dirty: false } );
    //     }
    // }
 
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
        // Try to remove AWeber's on case that requires this callback
        // Don't even really know if it's needed or not. I assume it was in the old system but aweber has changed a bit since then.

        // TODO: Update the parent

        /*
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
        */
    }

    formOnChange ( e ) {
        console.log(e.target.name)
        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
        updatedLeadIntegration.communication[ e.target.name ] = e.target.value;
        this.props.onUpdate(updatedLeadIntegration);
    }
    
    formOnSettingsChange ( e ) {
        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
        updatedLeadIntegration.communication.settings[ e.target.name ] = e.target.value;
        this.props.onUpdate(updatedLeadIntegration);
    }

    setServer ( type ) {
        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};

        if ( updatedLeadIntegration.communication.mailinglist === 'true' ) {
            this.onClearSettings(false);
            // If the connection is on, mark it disconnected now that's it being toggled off
            // updatedLeadIntegration.connected = false;
            // updatedLeadIntegration.communication.mailinglist = false;
            // updatedLeadIntegration.communication.settings = {};

            // _.forEach( updatedLeadIntegration.forms.ENTRY_PAGE, function ( field ) {
            //     if ( field.key !== 'EMAIL' ) {
            //         delete field.mailingListField;
            //         delete field.mailingListFieldType;
            //     }
            // } );

            // this.props.onUpdate( updatedLeadIntegration );
        } else {
            // If the integration is enabled, we don't set connected yet. That comes later once the connection is actually made.
            updatedLeadIntegration.communication.mailinglist = 'true';
            updatedLeadIntegration.communication.server = type;
            this.props.onUpdate( updatedLeadIntegration )
        }
    }

    onSettingsChange(settings, dataFields, save, callback) {
        // NOTE: Some calls from the mail config components send save: true but we weren't using it in gamify.
        // I have no idea what its purpose was.
        // It was basically kept here because AWeber has one case that sends a callback in the 4th position. 
        // I'd like to figure out how to get rid of that callback entirely. (I've already stopped using it but AWeber might break)

        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
        if (!updatedLeadIntegration.communication) updatedLeadIntegration.communication = {};
        updatedLeadIntegration.communication.settings = settings;

        if (!updatedLeadIntegration.forms) updatedLeadIntegration.forms = {};
        updatedLeadIntegration.forms.ENTRY_PAGE = dataFields;

        this.props.onUpdate( updatedLeadIntegration );
    }

    onConnectedChange ( connected ) {
        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
        updatedLeadIntegration.connected = connected;
        this.props.onUpdate( updatedLeadIntegration );
    }

    onRedirectToExternalAuth () {
        this.props.onRemoveLeaveHooks();
    }

    onClearSettings ( clearEnabled ) {
        let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
        if (clearEnabled) updatedLeadIntegration.enabled = false;
        if (!updatedLeadIntegration.communication) updatedLeadIntegration.communication = {};
        updatedLeadIntegration.connected = false;
        updatedLeadIntegration.communication.server = undefined;
        updatedLeadIntegration.communication.mailinglist = false;
        updatedLeadIntegration.communication.settings = {};

        // Remove any feild mapping
        _.forEach( updatedLeadIntegration.forms.ENTRY_PAGE, function ( field ) {
            if ( field.key !== 'EMAIL' ) {
                delete field.mailingListField;
                delete field.mailingListFieldType;
            }
        } );

        this.props.onUpdate(updatedLeadIntegration);
    }

    isSelected(type) {
        return this.props.campaignDetails.leadIntegration.communication && 
                this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true' && 
                this.props.campaignDetails.leadIntegration.communication.server === type;
    }
    isMailchimpSelected() {
        return this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true' && 
                this.props.campaignDetails.leadIntegration.communication.server === 'mailchimp';
    }
    isMailingListOff() {
        return !this.props.campaignDetails.leadIntegration.communication.mailinglist || 
                this.props.campaignDetails.leadIntegration.communication.mailinglist === 'false';
    }
    isKlaviyoSelected() {
        return this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true' && 
                this.props.campaignDetails.leadIntegration.communication.server === 'klaviyo';
    }
    isAweberSelected() {
        return this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true' && 
                this.props.campaignDetails.leadIntegration.communication.server === 'aweber';
    }

    onToggleLeadIntegration ( e ) {
        console.log(e.target.checked);

        // If they disable mail entirely, then clear any active conenction...same as hitting remove connection
        if (!e.target.checked) {
            this.onClearSettings( true );
        } else {
            let updatedLeadIntegration = {...this.props.campaignDetails.leadIntegration};
            updatedLeadIntegration.enabled = e.target.checked;
            this.props.onUpdate(updatedLeadIntegration);
        }
    }

    render() {
        console.log(this.props.campaignDetails.leadIntegration);
        if (!this.props.campaignDetails.leadIntegration) return null;

        return (
            <div>
                <div className="settings">
                    <div className="container">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <div className="panel-heading-label">
                                    <h1>
                                        Lead Integration
                                    </h1>
                                    <h3 className="subheading"><String code="sh_label_mailintegration_desc"/></h3>
                                </div>
                            </div>

                            <div className="panel-body">
                                <div className="m-t-1 m-b-4">
                                    <div className="w-800">
                                        <String code='hint_mailing_list'/>
                                    </div>

                                    <div className="form-inline m-b-3 m-t-4">
                                        <div className="form-group m-t-1">
                                            <input type="checkbox"
                                                id='enableLeadIntegration'
                                                data-switch="color"
                                                disabled={false}
                                                name='enableLeadIntegration'
                                                onChange={this.onToggleLeadIntegration.bind(this)}
                                                checked={this.props.campaignDetails.leadIntegration && this.props.campaignDetails.leadIntegration.enabled}
                                            />

                                            <label htmlFor={'enableLeadIntegration'} className="m-b-0" />
                                        </div>

                                        <div className="form-group m-r-2 m-l-2">
                                            Enable Lead Integration
                                        </div>
                                    </div>

                                    { this.props.campaignDetails.leadIntegration.enabled ? 
                                        <div className="m-l-4 w-800">
                                            <div className="m-t-6">
                                                <h4>Choose your mail integration service</h4>
                                            </div>

                                            <div>

                                                <div className="input-group mail-group p-t-4">
                                                    {
                                                        !ConfigStore.isMailIntegrationDisabled("mailchimp") && (this.isMailchimpSelected() || this.isMailingListOff()) ?
                                                            (
                                                                <label className="lead-integration-toggle m-b-4">
                                                                    <div className="m-t-2 m-r-6">
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
                                                                        checked={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true'}
                                                                        disabled={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'false'} />
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
                                                                <label className="lead-integration-toggle m-b-4">
                                                                    <div className="m-t-2 m-r-6">
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
                                                                        checked={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true'}
                                                                        disabled={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'false'} />
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
                                                                <label className="lead-integration-toggle m-b-4">
                                                                    <div className="m-t-2 m-r-6">
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
                                                                        checked={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true'}
                                                                        disabled={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'false'} />

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
                        
                                            <div className={this.props.campaignDetails.leadIntegration.communication.mailinglist === 'true' ? '' : 'hidden'}>
                                                {
                                                    this.isMailchimpSelected() ?
                                                        <MailChimp apiKey={this.props.campaignDetails.leadIntegration.communication.settings.apiKey}
                                                            listId={this.props.campaignDetails.leadIntegration.communication.settings.listId}
                                                            subscription={this.props.campaignDetails.leadIntegration.communication.settings.subscription}
                                                            dataFields={this.props.campaignDetails.leadIntegration.forms.ENTRY_PAGE}
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
                                                        <Klaviyo apiKey={this.props.campaignDetails.leadIntegration.communication.settings.apiKey}
                                                            listId={this.props.campaignDetails.leadIntegration.communication.settings.listId}
                                                            subscription={this.props.campaignDetails.leadIntegration.communication.settings.subscription}
                                                            dataFields={this.props.campaignDetails.leadIntegration.forms.ENTRY_PAGE}
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
                                                            token={this.props.campaignDetails.leadIntegration.communication.settings.token}
                                                            tokenSecret={this.props.campaignDetails.leadIntegration.communication.settings.tokenSecret}
                                                            accountId={this.props.campaignDetails.leadIntegration.communication.settings.accountId}
                                                            listId={this.props.campaignDetails.leadIntegration.communication.settings.listId}
                                                            dataFields={this.props.campaignDetails.leadIntegration.forms.ENTRY_PAGE}  
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
                                        :
                                        null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = MailIntegration;
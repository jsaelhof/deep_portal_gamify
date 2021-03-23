import React from 'react';
import _ from 'underscore';
import CampaignStore from '../../../../store/CampaignStore';
import UserStore from '../../../../store/UserStore';
import ConfigStore from '../../../../store/ConfigStore';
import Modal from '../../Modal.jsx.js';
import String from '../../String.jsx.js';
import Hint from '../../Hint.jsx.js';
import i18n from '../../../../store/i18nStore';
import ValidationError from '../../ValidationError.jsx.js';
import Loading from '../../../shared/Loading.jsx';
import Confirm from '../../../shared/Confirm.jsx';

class Aweber extends React.Component {
    constructor () {
        super();
        this.state = {
            server: 'aweber',
            lists: [],
            fields: [],
            form: {},
            connecting: false,
            redirecting: false
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
    }
    componentDidMount () {
        if (this.props.token && this.props.tokenSecret && this.props.accountId) {
            this.setState( { connecting: true }, () => {
                CampaignStore.getMailingList( this.state.server, { token: this.props.token, tokenSecret: this.props.tokenSecret, accountId: this.props.accountId } );
            } );
        } else {
            this.setState( { connecting: true }, () => {
                CampaignStore.getAweberAuthenticationUrl( ConfigStore.INTEGRATION, ConfigStore.getAppUrl( UserStore.getImmutableState().userDetails ) );
            } );
        }
    }

    onAweberAuthenticationUrl ( e ) {
        if (e.response.hasErrors()) {
            console.log("Error get AWeber Auth Url");
        } else {

            // // Delay the redirect for a second so that we can show a message to the user telling them that they are being redirected to AWeber
            // setTimeout( () => {
            //     window.location.href = e.response.result.authenticationUrl;
            // }, 2000 )

            // // Call the onRedirectToExternalAuth function of the parent. This gives the parent an opportunity to do it's own handling before being redirected (remove hooks for leaving without saving)
            // if (this.props.onRedirectToExternalAuth) this.props.onRedirectToExternalAuth();

            // Call the onRedirectToExternalAuth function of the parent. This gives the parent an opportunity to do it's own handling before being redirected (remove hooks for leaving without saving)
            if (this.props.onRedirectToExternalAuth) this.props.onRedirectToExternalAuth();

            // Tell the component we're redirecting.
            this.setState( { redirecting: true, authUrl: e.response.result.authenticationUrl } );
        }
    }

    onMailingListRetrieved ( e ) {
        if ( e.response && !e.response.hasErrors() ) {
            if ( e.response.result.availableList.length > 0 ) {
                this.setState( { listsFound: true, form: {} }, function () {
                    let lists = e.response.result.availableList;
                    let listId = this.props.listId;

                    this.setState( { lists: lists }, function () {
                        if ( !listId || listId === '' ) {
                            listId = lists[ 0 ].identifier;

                            this.props.onChange( { token: this.props.token, tokenSecret: this.props.tokenSecret, accountId: this.props.accountId, listId: listId }, this.props.dataFields, true, function () {
                                CampaignStore.getMailingFields( this.state.server, { token: this.props.token, tokenSecret: this.props.tokenSecret, accountId: this.props.accountId, listId: this.props.listId } );
                            }.bind( this ) );
                        } else {
                            CampaignStore.getMailingFields( this.state.server, { token: this.props.token, tokenSecret: this.props.tokenSecret, accountId: this.props.accountId, listId: this.props.listId } );
                        }
                    } );
                } );
            } else {
                this.setState( { listsFound: false } );
            }
        } else {
            this.setState( { connecting: false } );
            console.error( 'AweberConfig.onMailingListRetrieved.failed', e );
        }
    }

    onMailingFieldsRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { connecting: false, valid: false } );
        } else {
            let fields = e.response.result.fieldList;

            fields.unshift( { label: "Email Address", field: "EMAIL", required: "true" } ); //email field is assumed and not returned by mailchimp, so we are defining it locally

            let dataFields = this.setDefaultFields( fields, this.props.dataFields );

            this.setState( { fields: fields, valid: true, connecting: false }, () => {
                if ( this.props.onChange ) {
                    this.props.onChange( { token: this.props.token, tokenSecret: this.props.tokenSecret, accountId: this.props.accountId, listId: this.props.listId }, dataFields, true );
                }
                if ( this.props.onConnectedChange ) {
                    this.props.onConnectedChange( this.state.valid );
                }
            } );
        }
    }

    setDefaultFields ( mailingFields, dataFields ) {
        mailingFields.forEach( function ( f ) {
            switch ( f.field ) {
                case 'EMAIL':
                    _.forEach( dataFields, function ( dataField, key ) {
                        if ( key.toLowerCase() === f.field.toLowerCase() ) {
                            dataField.mailingListFieldType = 'text';
                            dataField.mailingListField = f.field;
                        }
                    } );
            }
        } );

        return dataFields;
    }

    onListChange ( e ) {
        let settings = {};
        let dataFields = this.props.dataFields;

        _.forEach( dataFields, function ( field ) {
            if ( field.key !== 'EMAIL' ) {
                delete field.mailingListField;
                delete field.mailingListFieldType;
            }
        } );

        settings.token = this.props.token;
        settings.tokenSecret = this.props.tokenSecret;
        settings.accountId = this.props.accountId;
        settings.listId = this.props.listId;

        settings[ e.target.name ] = e.target.value;

        this.props.onChange( settings, dataFields, false, () => {
            CampaignStore.getMailingFields( this.state.server, settings );
        } );
    }

    validField ( field ) {
        return this.isFieldMapped( field.field ) || field.required === 'false' || !field.required;
    }

    onChange ( dataFields ) {
        if ( this.props.onChange ) {
            let settings = {};

            settings.token = this.props.token;
            settings.tokenSecret = this.props.tokenSecret;
            settings.accountId = this.props.accountId;
            settings.listId = this.props.listId;

            this.props.onChange( settings, dataFields );
        }
    }

    clearSettings () {
        let dataFields = this.props.dataFields;

        _.forEach( dataFields, function ( field ) {
            delete field.mailingListField;
            delete field.mailingListFieldType;
        }, this );

        this.setState( { valid: false, connecting: false }, function () {
            this.props.onChange( {}, dataFields, true );
            if ( this.props.onConnectedChange ) {
                this.props.onConnectedChange( this.state.valid );
            }
            if ( this.props.onClearSettings ) {
                this.props.onClearSettings();
            }
        } );
    }

    onConfirmRedirect () {
        window.location.href = this.state.authUrl;
    }

    onCancelRedirect () {
        this.setState( { redirecting: false }, () => {
            this.clearSettings();
        } );
    }

    render () {
        if (this.state.redirecting) {
            return <Confirm 
                title={i18n.stringFor("label_aweber_confirm_title")}  
                message={i18n.stringFor("label_aweber_confirm_message")} 
                onConfirm={this.onConfirmRedirect.bind(this)}
                onCancel={this.onCancelRedirect.bind(this)}
            />
        }

        return (
            <div>
                <div className="col-xs-6">

                    <div className="form-group m-t-3">
                        { 
                            this.state.connecting ? 
                                <Loading modal={false} title={i18n.stringFor( "sh_label_mailintegration_connecting_progress" )}/> 
                                : 
                                null
                        }
                    </div>

                    <div className={this.state.valid ? 'form-group' : 'hidden'}>
                        <label><String code="label_list_unique_id"/> <String code="label_required"/></label>
                        <Hint hint={i18n.stringFor( 'hint_aweber_unique_id' )} placement="top" />
                        <select className="form-control" name="listId" value={this.props.listId} onChange={this.onListChange.bind( this )} disabled={!this.state.lists.length || this.props.readOnly}>
                            {
                                _.map( this.state.lists, function ( item ) {
                                    return <option key={item.identifier} value={item.identifier}>{item.name}</option>;
                                } )
                            }
                        </select>
                    </div>

                    <div className="clearfix" />

                    {
                        this.props.listConfigurator ?
                            (
                                <div className={this.state.valid ? 'form-group m-b-0' : 'hidden'}>
                                    { this.state.valid ?
                                        React.createElement(
                                            this.props.listConfigurator,
                                            {
                                                emailListFields: this.state.fields,
                                                dataCollectionFields: this.props.dataFields,
                                                validField: this.validField.bind( this ),
                                                readOnly: this.props.readOnly,
                                                valid: this.state.valid,
                                                onChange: this.onChange.bind( this ),
                                                form: this.state.form,
                                                lastResponse: this.state.lastResponse
                                            }
                                        ) : null
                                    }
                                    <ValidationError response={this.state.lastResponse} field="fields" isDirty={this.state.form.fields} />
                                </div>
                            ) : null
                    }
                </div>

                <div className={this.state.valid ? 'col-xs-12' : 'hidden'}>
                    <button type="button" className="btn btn-default round" onClick={this.clearSettings.bind( this, false )} disabled={this.props.readOnly} ><String code="label_remove_connection"/></button>
                </div>
            </div>
        )
    }
}


module.exports = Aweber;
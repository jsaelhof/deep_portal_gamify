import React from 'react';
import _ from 'underscore';
import Hint from '../../Hint.jsx.js';
import String from '../../String.jsx.js';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import ValidationError from '../../ValidationError.jsx.js';
import Loading from '../../../shared/Loading.jsx';

class MailChimp extends React.Component {
    constructor () {
        super ();
        this.state = {
            lists: [],
            server: 'mailchimp',
            form: {},
            fields: [],
            valid: false,
            statusOptions: {
                subscribed: i18n.stringFor( 'label_mailchimp_status_subscribed' ),
                unSubscribed: i18n.stringFor( 'label_mailchimp_status_unsubscribed' ),
                cleaned: i18n.stringFor( 'label_mailchimp_status_cleaned' ),
                pending: i18n.stringFor( 'label_mailchimp_status_pending' )
            },
            connecting: false
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
    }
    componentDidMount () {
        if ( this.props.apiKey ) {
            this.connect();
        }
    }
    connect () {
        this.setState( { connecting: true }, () => {
            CampaignStore.getMailingList( this.state.server, { apiKey: this.props.apiKey, listId: this.props.listId, subscription: this.props.subscription } )
        } );
    }
    onMailingListRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response, form: {}, connecting: false } );
            // this.clearSettings( [ 'listId', 'subscription', 'valid' ] );
        } else {
            let lists = e.response.result.availableList || [];
            if ( lists.length ) {
                this.setState( { lastResponse: null, listsFound: true, form: {}, lists: lists }, function () {
                    CampaignStore.getMailingFields( this.state.server, { apiKey: this.props.apiKey, listId: this.props.listId ? this.props.listId : this.state.lists[ 0 ].identifier, subscription: this.props.subscription } );
                } );
            } else {
                this.setState( { listsFound: false } );
            }
        }
    }
    onMailingFieldsRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response } );
        } else {
            let fields = e.response.result.fieldList;

            fields.unshift( { label: "Email Address", field: "EMAIL", required: "true" } ); //email field is assumed and not returned by mailchimp, so we are defining it locally

            let dataFields = this.setDefaultFields( fields, this.props.dataFields );

            this.setState( { fields, valid: true, connecting: false }, () => {
                if ( this.props.onChange ) {
                    this.props.onChange( { apiKey: this.props.apiKey, listId: this.props.listId ? this.props.listId : this.state.lists[ 0 ].identifier, subscription: this.props.subscription }, dataFields, true );
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
    onListIdChange ( listId ) {
        let dataFields = this.props.dataFields;

        _.forEach( dataFields, function ( field ) {
            if ( field.key !== 'EMAIL' ) {
                delete field.mailingListField;
                delete field.mailingListFieldType;
            }
        } );

        let settings = this.getDefaultSettings();

        settings.listId = listId;
        settings.apiKey = this.props.apiKey;

        if ( this.props.onChange ) {
            this.props.onChange( settings, dataFields );

            CampaignStore.getMailingFields( this.state.server, settings );
        }
    }
    onSettingsChange ( e ) {
        let _settings = { apiKey: this.props.apiKey, listId: this.props.listId, subscription: this.props.subscription };

        _settings[ e.target.name ] = e.target.value;

        if ( e.target.name === 'listId' ) {
            this.onListIdChange( e.target.value );
        } else if ( this.props.onChange ) {
            this.props.onChange( _settings, this.props.dataFields );
        }
    }
    getDefaultSettings () {
        return { listId: '', subscription: 'subscribed' };
    }
    onChange ( dataFields ) {
        if ( this.props.onChange ) {
            let { apiKey, listId, subscription } = this.props;
            this.props.onChange( { apiKey, listId, subscription }, dataFields );
        }
    }
    clearSettings () {
        let dataFields = {};
        let settings = this.getDefaultSettings();

        _.forEach( this.props.dataFields, function ( field, key ) {
            dataFields[ key ] = field;
            delete dataFields[ key ].mailingListField;
            delete dataFields[ key ].mailingListFieldType;
        } );

        settings.apiKey = '';

        this.setState( { valid: false, connecting: false }, () => {
            this.props.onChange( settings, dataFields, true );
            if ( this.props.onConnectedChange ) {
                this.props.onConnectedChange( this.state.valid );
            }
            if ( this.props.onClearSettings ) {
                this.props.onClearSettings();
            }
        } );
    }
    render () {
        return (
            <div>
                <div className="col-xs-6">
                    <div className="form-group m-t-3">
                        <label>MailChimp <String code="label_api_key"/> <String code="label_required"/></label>
                        <Hint hint={i18n.stringFor( 'hint_mailchimp_api_key' )} placement="top" />
                        <input type="text" className="form-control" name="apiKey"
                               value={this.props.apiKey}
                               onChange={this.onSettingsChange.bind( this )}
                               disabled={this.state.valid || this.state.connecting} />
                        <ValidationError response={this.state.lastResponse} field="api-key" isDirty={this.state.form.apiKey} />

                        { 
                            this.state.connecting ? <Loading modal={false} title={i18n.stringFor( "sh_label_mailintegration_connecting_progress" )}/> : null
                        }
                    </div>

                    <div className={this.state.valid ? 'form-group' : 'hidden'}>
                        <label> <String code="label_list_unique_id"/> <String code="label_required"/></label>
                        <Hint hint={i18n.stringFor( 'hint_mailchimp_unique_id' )} placement="top" />
                        <select className="form-control" name="listId" value={this.props.listId} onChange={this.onSettingsChange.bind( this )} disabled={!this.state.lists.length || this.props.readOnly}>
                            {
                                this.state.lists.map( function ( list ) {
                                    return <option key={list.identifier} value={list.identifier}>{list.name}</option>;
                                } )
                            }
                        </select>
                    </div>

                    <div className={this.state.valid ? 'form-group' : 'hidden'}>
                        <label> <String code="label_subscription_type"/> </label>
                        <Hint hint={<String code="hint_mailchimp_subscription" />} placement="top" />
                        <select className="form-control" name="subscription" value={this.props.subscription} onChange={this.onSettingsChange.bind( this )} disabled={!this.state.valid || this.props.readOnly}>
                            {
                                _.map( this.state.statusOptions, function (val, key) {
                                        return ( <option key={key} value={key}>{val}</option> );
                                }, this )
                            }
                        </select>
                    </div>

                    {
                        this.props.listConfigurator ?
                            (
                                <div className={this.state.valid ? 'form-group m-b-0' : 'hidden'}>
                                    { this.state.valid ?
                                        React.createElement(
                                            this.props.listConfigurator,
                                            {
                                                dataFields: this.props.dataFields,
                                                form: this.state.form,
                                                fields: this.state.fields,
                                                readOnly: this.props.readOnly,
                                                valid: this.state.valid,
                                                lastResponse: this.state.lastResponse,
                                                onChange: this.onChange.bind( this )
                                            }
                                        ) : null
                                    }
                                </div>
                            ) : null
                    }
                </div>

                {
                    // If the integration is connected OR connecting, then don't show the connect button.
                    this.state.valid || this.state.connecting ? 
                        null :
                        <div className="col-xs-6">
                            <button type="button" className="btn btn-primary gap-t-lg round" onClick={this.connect.bind( this )} ><String code="label_test_integration"/></button>
                        </div>
                }

                <div className={this.state.valid ? 'col-xs-12' : 'hidden'}>
                    <button type="button" className="btn btn-default round" onClick={this.clearSettings.bind( this, false )} disabled={this.props.readOnly} ><String code="label_remove_connection"/></button>
                </div>
            </div>
        )
    }
}

module.exports = MailChimp;
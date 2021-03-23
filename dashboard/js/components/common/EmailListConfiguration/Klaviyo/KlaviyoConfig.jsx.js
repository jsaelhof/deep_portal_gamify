import React from 'react';
import _ from 'underscore';
import ValidationError from '../../ValidationError.jsx.js';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import Hint from '../../Hint.jsx.js';
import String from '../../String.jsx.js';
import Loading from '../../../shared/Loading.jsx'

class Klaviyo extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            form: {},
            lists: [],
            server: 'klaviyo',
            fields: {},
            connecting: false,
            valid: false
        };
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
    onChange ( e ) {
        let settings = { apiKey: this.props.apiKey, listId: this.props.listId };

        settings[ e.target.name ] = e.target.value;

        let form = this.state.form;

        form[ e.target.name ] = e.target.value;

        this.setState( { form: form }, function () {
            if ( this.props.onChange ) {
                this.props.onChange( settings, this.props.dataFields );
            }
        } );
    }
    connect () {
        this.setState( { connecting: true }, () => {            
            CampaignStore.getMailingList( this.state.server, { apiKey: this.props.apiKey, listId: this.props.listId } );
        } );
    }
    onMailingListRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response, form: {}, connecting: false } );
            // this.clearSettings( [ 'listId', 'subscription', 'valid' ] );
        } else {
            if ( e.response.result.availableList.length > 0 ) {
                this.setState( { listsFound: true, form: {} }, function () {
                    let lists = e.response.result.availableList || [];

                    this.setState( { lastResponse: null, listsFound: true, form: {}, lists: lists }, function () {
                        // Get the mailing fields.
                        // If there was no listId passed in, use the first list id that was returned.
                        // This will happen again in the handler for this call since we aren't calling out to the parent to tell it the list until this step completes
                        CampaignStore.getMailingFields( this.state.server, { apiKey: this.props.apiKey, listId: this.props.listId ? this.props.listId : this.state.lists[ 0 ].identifier } );
                    } );
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

            let dataFields = this.setDefaultFields( fields, this.props.dataFields );

            this.setState( { fields, valid: true, connecting: false }, () => {
                if ( this.props.onChange ) {
                    // Update the parent. If there was no list id passed in, use the first one in the list as that is what is set in the dropdown list by default.
                    this.props.onChange( { apiKey: this.props.apiKey, listId: this.props.listId ? this.props.listId : this.state.lists[ 0 ].identifier }, dataFields );
                }
                if ( this.props.onConnectedChange ) {
                    this.props.onConnectedChange( this.state.valid );
                }
            } );
        }
    }
    setDefaultFields ( mailingFields, dataFields ) {
        let newFields = {};

        mailingFields.forEach( function ( f ) {
            switch ( f.field ) {
                case '$email':
                    _.forEach( dataFields, function ( dataField, key ) {
                        newFields[ key ] = dataField;
                        if ( key.toLowerCase() === 'email' ) {
                            newFields[ key ].mailingListFieldType = 'text';
                            newFields[ key ].mailingListField = f.field;
                        }
                    } );
            }
        } );

        return newFields;
    }
    onListChange ( dataFields ) {
        if ( this.props.onChange ) {
            this.props.onChange( { apiKey: this.props.apiKey, listId: this.props.listId }, dataFields );
        }
    }
    onListIdChange ( listId ) {
        let dataFields = {};

        _.forEach( this.props.dataFields, function ( field, key ) {
            dataFields[ key ] = field;

            if ( field.key !== 'EMAIL' ) {
                delete field.mailingListField;
                delete field.mailingListFieldType;
            }
        } );

        let settings = {};

        settings.listId = listId;
        settings.apiKey = this.props.apiKey;

        if ( this.props.onChange ) {
            this.props.onChange( settings, dataFields, true );

            CampaignStore.getMailingFields( this.state.server, settings );
        }
    }
    onSettingsChange ( e ) {
        let _settings = { apiKey: this.props.apiKey, listId: this.props.listId };

        _settings[ e.target.name ] = e.target.value;

        if ( e.target.name === 'listId' ) {
            this.onListIdChange( e.target.value );
        } else if ( this.props.onChange ) {
            this.props.onChange( _settings, this.props.dataFields, true );
        }
    }
    clearSettings () {
        let dataFields = this.props.dataFields;

        _.forEach( this.props.dataFields, function ( field ) {
            delete field.mailingListField;
            delete field.mailingListFieldType;
        } );

        this.setState( { valid: false, connecting: false }, function () {
            this.props.onChange( { apiKey: '', listId: '', subscription: 'subscribed' }, dataFields );
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
                        <label>Klaviyo <String code="label_api_key"/> <String code="label_required"/></label>
                        <Hint hint={i18n.stringFor( 'hint_klaviyo_api_key' )} placement="top" />
                        <input type="text" className="form-control" name="apiKey"
                               value={this.props.apiKey}
                               onChange={this.onChange.bind( this )} 
                               disabled={this.state.valid || this.state.connecting} />
                        <ValidationError response={this.state.lastResponse} field="api-key" isDirty={this.state.form.apiKey} />

                        { 
                            this.state.connecting ? <Loading modal={false} title={i18n.stringFor( "sh_label_mailintegration_connecting_progress" )}/> : null
                        }
                    </div>

                    <div className={this.state.valid ? 'form-group' : 'hidden'}>
                        <label> <String code="label_list_unique_id"/> <String code="label_required"/></label>
                        <Hint hint={i18n.stringFor( 'hint_klaviyo_unique_id' )} placement="top" />
                        <select className="form-control" name="listId" value={this.props.listId} onChange={this.onSettingsChange.bind( this )} disabled={!this.state.lists.length || this.props.readOnly}>
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
                                                form: this.state.form,
                                                lastResponse: this.state.lastResponse,
                                                fields: this.state.fields,
                                                readOnly: this.props.readOnly,
                                                valid: this.state.valid,
                                                onChange: this.onListChange.bind( this )
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

module.exports = Klaviyo;
import React from 'react';
import UserStore from '../../../store/UserStore';
import ValidationError from '../../common/ValidationError.jsx';
import String from '../../common/String.jsx';
import i18n from '../../../store/i18nStore';

class ChangePassword extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { 
            password: '', 
            confirmpassword: '', 
            showUpdatedMessage: false,
            dirty: false
        }
    }

    componentWillMount () {
        UserStore.addEventListener( this );
    }

    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }

    submit () {
        // Create an error before even sending this to the server. Otherwise send it to the server which may return it's own validation errors.
        if ( this.state.password !== this.state.confirmpassword ) {
            this.setState( { 
                validation_errors: [ {
                    field: 'password',
                    value: '',
                    message: 'error_passwords_do_not_match'
                } ]
            } );
            return;
        }

        UserStore.sendUpdatePassword( this.state.password );
    }

    onUserUpdatePassword ( e ) {
        if ( e.response && e.response.hasErrors() && e.response.errors.validation_errors) {
            this.setState( { validation_errors: e.response.errors.validation_errors, dirty: false } );
        } else {
            this.setState( { showUpdatedMessage: true, password: '', confirmpassword: '', dirty: false } );
        }
    }

    onUpdate ( e ) {
        this.setState( { showUpdatedMessage: false, validation_errors: undefined, [ e.target.name ]: e.target.value, dirty: true } );
    }

    render () {
        let validationError;
        if (this.state.validation_errors) {
            this.state.validation_errors.forEach(error => {
                if (!validationError && error.field === "password") {
                    validationError = error;
                }
            });
        }

        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="label_change_password"/>
                                </h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-xs-12">
                                    <div className="mail-info col-xs-12 m-t-3">
                                        <p>{i18n.stringFor( 'hint_new_password' )}</p>
                                    </div>
                                </div>
                            </div>

                            <form>
                                <div className='myaccount-form'>
                                    <div className="form-group">
                                        <label className="control-label"><String code='label_new_password'/></label>
                                        <input type="password" name="password" className={ validationError ? "form-control invalid-field" : "form-control"}
                                            value={this.state.password}
                                            onChange={this.onUpdate.bind( this )}
                                            maxLength="128"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="control-label"><String code='label_confirm_new_password'/></label>
                                        <input type="password" name="confirmpassword" className={ validationError ? "form-control invalid-field" : "form-control"}
                                            value={this.state.confirmpassword}
                                            onChange={this.onUpdate.bind( this )}
                                            maxLength="128"
                                        />
                                    </div>

                                    { 
                                        this.state.showUpdatedMessage ?
                                        <div className="validation-success">
                                            <String code="message_password_updated" />
                                        </div>
                                        : 
                                        null
                                    }

                                    { 
                                        validationError ?
                                        <div className="validation-error-msg">
                                            { i18n.stringFor(validationError.message, "error_desc") }
                                        </div>
                                        : 
                                        null
                                    }

                                    <div className="form-group m-t-4">
                                        <button type="button" className="btn btn-primary round" onClick={this.submit.bind( this )}><String code="label_update_password_button" /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = ChangePassword;
import React from 'react';
import UserStore from '../../store/UserStore';
import ConfigStore from '../../store/ConfigStore';
import ValidationError from '../common/ValidationError.jsx';
import String from '../common/String.jsx';
import ErrorStore from '../../store/ErrorStore';
import { browserHistory as History } from 'react-router';
import i18n from '../../store/i18nStore';

class RegisterPassword extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            passwordValid: false,
            password: '',
            confirmPassword: ''
        }
    }
    componentWillMount () {
        UserStore.addEventListener( this );
    }
    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }
    onFieldUpdate ( key, e ) {
        this.setState( { [ key ]: e.target.value });
    }
    onSubmitPassword () {
        var validationErrors = [];
        if (this.state.password !== this.state.confirmPassword) validationErrors.push( "error_passwords_do_not_match" );
        if (this.state.password.length < 8) validationErrors.push( "error_invalid_password_entry" );
        if (this.state.password.length > 128) validationErrors.push( "error_user_invalid_password_reg" );

        if (validationErrors.length) {
            this.setState({
                passwordValid: false,
                validationErrors: validationErrors
            });
        } else {
            this.setState({
                passwordValid: true,
                validationErrors: undefined
            }, () => {
                UserStore.sendUpdatePassword( this.state.password );
            });
        }
    }
    onUserUpdatePassword ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            this.setState( { showNotification: true } );
        }
    }
    onReturnToDashboard () {
        History.push(ConfigStore.getDashboardRoute());
    }
    render () {
        // Create a modal over the page. This has the effect of hiding the top bar and menu which we don't want on this screen.
        // FIXME: I'm not entirely happy with doing it this way but i need all the other logic of the GamifyConsole component (login flow/handling, error handling etc).
        // Maybe see if there's a way to pass some kind of configuration per-route to disable the topbar in those cases. Then this could be just a regular page.
        return (
            <div className="gamify-modal">
                <div className="dashboard-login">
                    <div className="login-form">
                        <img src="/dashboard/images/login/deepmarkit.png" className="logo" />
                    
                        <div className="login-wrapper">
                            {
                                !this.state.showNotification ?
                                    <form className='p-t-2 password-update' role="form">
                                        <div className="center m-b-8">
                                            <div className="m-b-4"><h3><String code="label_change_password"/></h3></div>
                                            <div><String code="hint_new_password"/></div>
                                        </div>

                                        <div className="form-group">
                                            <label className="control-label"><String code='label_password'/></label>
                                            <input type="password" className="form-control" maxLength="128" onChange={this.onFieldUpdate.bind( this, 'password')} />
                                        </div>

                                        <div className="form-group">
                                            <label className="control-label" > <String code='label_password_confirm'/> </label>
                                            <input type="password" className="form-control" maxLength="128" onChange={this.onFieldUpdate.bind( this, 'confirmPassword')} />
                                        </div>

                                        { 
                                            this.state.validationErrors ?
                                                <div className="validation-error-msg center">
                                                    <div>{ i18n.stringFor(this.state.validationErrors[0], "error_desc") }</div>
                                                </div>
                                                : 
                                                null
                                        }

                                        <div>
                                            <div className="form-group">
                                                <button type="button" className="btn btn-cta" onClick={this.onSubmitPassword.bind( this )}><String code='label_update' /></button>
                                            </div>
                                        </div>
                                    </form>
                                    :
                                    <div>
                                        <h4><String code="label_password_reset_completed" /></h4>
                                        <button type="button" className="btn btn-cta" onClick={this.onReturnToDashboard.bind( this )}><String code='label_go_to_dashboard'/></button>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = RegisterPassword;

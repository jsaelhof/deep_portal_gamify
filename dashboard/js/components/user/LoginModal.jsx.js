import React from 'react';
import UserStore from '../../store/UserStore';
import ConfigStore from '../../store/ConfigStore';
import String from '../common/String.jsx';
import ValidationError from '../common/ValidationError.jsx';
import i18n from '../../store/i18nStore';

import UserRegister from './UserRegister.jsx';
import Login from './LoginForm.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ErrorStore from '../../store/ErrorStore';
import Loading from '../shared/Loading.jsx';

class LoginModal extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { email: '', password: '', form: '', lastResponse: this.props.lastResponse }
        this.tag = ConfigStore.getIntegrationTag();
    }
    componentWillMount () {
        UserStore.addEventListener(this);
    }
    componentDidMount () {
        this.setState( { form: this.props.form || this.getDefaultView() } );
    }
    componentWillReceiveProps ( props ) {
        this.setState( { lastResponse: props.lastResponse } );
    }
    componentWillUnmount () {
        UserStore.removeEventListener(this);
    }

    submit () {
        UserStore.sendLoginRequest( this.state.email, this.state.password, this.tag);
    }
    onChange ( e ) {
        this.setState( { [ e.target.name ]: e.target.value } );
    }

    getDefaultView () {
        if (window.localStorage) {
            let lastLogin = window.localStorage.getItem("lastLogin");
            if (lastLogin) {
                return 'login';
            } else {
                return 'register';
            }
        } else {
            return 'register'; 
        }
    }

    formUpdate ( e ) {
        switch ( e.request ) {
            case 'authenticated':
                this.props.onAuthentication( { success: true } );
                if (window.localStorage) window.localStorage.setItem("lastLogin", Date.now() );
                break;
            case 'forgot':
                this.setState( { form: 'forgot' } );
                break;
            case 'login':
                this.setState( { form: 'login' } );
                break;
        }
    }
    formChange () {
        this.setState( { form: this.state.form === 'login' ? 'register' : 'login' } );
    }

    renderForm () {
        // Only render the form if the login type is "form" OR if the type is "sso" (Single Sign On). In SSO cases we will never render the login, register or forgot password forms.

        switch ( ConfigStore.getLoginType() ) {
            case "form":
                switch ( this.state.form ) {
                    case 'register':
                        return <UserRegister onUpdate={this.formUpdate.bind( this )} tag={this.tag} formChange={this.formChange.bind(this)} showIntegrations={true} />;
                    case 'forgot':
                        return <ForgotPassword onUpdate={this.formUpdate.bind( this )} tag={this.tag} />;
                    case 'login':
                    default:
                        return <Login onUpdate={this.formUpdate.bind( this )} tag={this.tag} formChange={this.formChange.bind(this)} showIntegrations={true} />;
                }
                break;
            case "sso":
                switch ( this.state.form ) {
                    case 'register':
                    case 'forgot':
                    case 'login':
                    default:
                        return null;
                }
                break;
            default:
                return null;
                break;
        }
    }

    isSessionInvalid () {
        return (this.state.lastResponse && this.state.lastResponse.hasValidationErrors() && this.state.lastResponse.errors.validation_errors.filter( error => error.field.toLowerCase() === "session-token").length > 0);
    }

    render () {
        return this.props.show ? (
            <div className="dashboard-login">
                <div className="login-form">
                    <img src="/dashboard/images/login/deepmarkit.png" className="logo" />

                    {/* If this is sso, then always show the session expired message because the user should never get to the login screen otherwise and we don't want it to be blank. If the session is expired due to last response, figure out which message to show.  */}
                    { ConfigStore.getLoginType() === "sso" || this.isSessionInvalid() ?
                        ConfigStore.getLoginType() === "form" ?
                            <div className="alert alert-error">{i18n.stringFor("error_user_session_expired", "error_desc")}</div>
                            :
                            <div className="alert alert-error">{i18n.stringFor("error_user_session_expired_sso", "error_desc", { integrationDisplayName: ConfigStore.getIntegrationDisplayName() })}</div>
                        :
                        null
                    }

                    { this.renderForm() }
                </div>
            </div>
        ) : null;
    }
}

module.exports = LoginModal;
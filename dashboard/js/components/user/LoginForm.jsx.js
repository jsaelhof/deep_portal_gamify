import React from 'react';
import UserStore from '../../store/UserStore';
import String from '../common/String.jsx';
import ValidationError from '../common/ValidationError.jsx';
import Integrations from './Integrations.jsx';
import i18n from '../../store/i18nStore';

class Login extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            email: '',
            password: '',
            processing: false
        }
    }
    componentWillMount () {
        UserStore.addEventListener( this );
    }
    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }
    onEmailChange ( e ) {
        this.setState( { email: e.target.value } );
    }
    onPasswordChange ( e ) {
        this.setState( { password: e.target.value } );
    }
    onLogin () {
        this.setState( { processing: true }, function () {
            // Note: this.props.tag may not exist. If not, undefined is passed to the sendLoginRequest and it is handled there.
            UserStore.sendLoginRequest( this.state.email, this.state.password, this.props.tag );
        } );
    }
    onUserAuthenticated ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response, processing: false } );
        } else {
            this.setState( { processing: false } );
            if ( this.props.onUpdate ) {
                this.props.onUpdate( { request: 'authenticated' } );
            }
        }
    }
    forgotPassword () {
        this.props.onUpdate( { request: 'forgot' } );
    }
    render () {
        return (
            <div className="login-wrapper">
                <p className="login-greeting m-b-8">{i18n.stringFor("label_login_header")}</p>

                <div className="login-panel">
                    { this.props.showIntegrations ?
                        <Integrations/>
                        :
                        null
                    }
                    { this.props.showIntegrations ?
                        <div className="login-divider">
                            <div className="login-divider-text">{i18n.stringFor("label_login_or")}</div>
                        </div>
                        :
                        null
                    }
                    <div className="login-register-form">
                        <div className="login-type m-b-8">{i18n.stringFor("label_login_gamify_header")}</div>

                        <div className="login-sign-up">{i18n.stringFor("label_login_need_account")} <a href="#" onClick={this.props.formChange.bind( this )}>{i18n.stringFor("label_login_sign_up")}</a></div>

                        <form className="p-t-2" role="form">
                            <div className="form-group">
                                <input tabIndex="1" placeholder={i18n.stringFor("label_email")} type="email" className="form-control" maxLength="254" onChange={this.onEmailChange.bind( this )} />
                            </div>

                            <div className="form-group">
                                <input tabIndex="2" placeholder={i18n.stringFor("label_password")}  type="password" className="form-control" maxLength="128" onChange={this.onPasswordChange.bind( this )} />
                            </div>

                            <ValidationError response={this.state.lastResponse} field="login"/>
                            <ValidationError response={this.state.lastResponse} field="password"/>

                            <div className="form-group">
                                <button type="button" tabIndex="3" className="btn btn-cta" onClick={this.onLogin.bind( this )} disabled={this.state.processing}> {i18n.stringFor("label_login_login")} </button>
                            </div>

                            <div className="login-forgot">
                                <a href="#" tabIndex="4" onClick={this.forgotPassword.bind( this )}><String code="label_forgot_password_full"/></a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Login;

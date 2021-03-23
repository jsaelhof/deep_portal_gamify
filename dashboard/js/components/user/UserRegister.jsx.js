import React from 'react';
import { browserHistory as History } from 'react-router';
import ConfigStore from '../../store/ConfigStore';
import UserStore from '../../store/UserStore';
import i18n from '../../store/i18nStore';
import ValidationError from '../common/ValidationError.jsx';
import String from '../common/String.jsx';
import FBQ from '../common/FacebookPixel.jsx';
import ga from '../common/GoogleAnalytics.jsx';
import gc from '../common/GoogleConversion.jsx';
import Integrations from './Integrations.jsx';

class UserRegister extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            processing: false,
            userDetails: {
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                lang: i18n.getLocale()
            },
            fbq: {}
        }
    }
    componentWillMount () {
        UserStore.addEventListener( this );
        i18n.addEventListener( this );
        this.setState( { fbq: FBQ.load() } );
    }
    componentWillUnmount () {
        UserStore.removeEventListener( this );
        i18n.removeEventListener( this );
    }
    componentDidMount () {
        gc.loadScript();
        ga.loadScript();
        let trackingid = ( document.location.hostname === 'hq.fetchbot.com' ? 'UA-76612237-1' : 'UA-76612237-4' ); // ###-1 is production tracking code, ###-4 is dev tracking code
        ga.initialize( trackingid );
        this.forceUpdate();
    }
    oni18nLoaded () {
        this.forceUpdate();
    }
    oni18nLoadError () {
        this.forceUpdate();
    }
    onChange ( e ) {
        this.setState( { userDetails: { ...this.state.userDetails, [ e.target.name ]: e.target.value } } );
    }
    submit () {
        if ( this.state.processing ) { return; }

        let params = {
            firstName: this.state.userDetails.firstName,
            lastName: this.state.userDetails.lastName,
            lang: this.state.userDetails.lang,
            email: this.state.userDetails.email
        };

        this.setState( { processing: true } );

        // Note: this.props.tag may not exist. If not, undefined is passed to the sendLoginRequest and it is handled there.
        UserStore.sendRegisterRequest( this.state.userDetails.password, params, this.props.tag );
    }
    onUserRegistered ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { processing: false, lastResponse: e.response } );
        } else {
            this.state.fbq( 'track', 'CompleteRegistration' );

            //Google Analytics tracking new registrations upon success response from server
            ga.event( { hitType: "event", eventCategory: 'Life Cycle', eventAction: 'Account Creation' } );

            //Google Adwords Conversion, tracking new registrants.
            gc.addConversion();

            if ( this.props.onUpdate ) {
                History.push( this.props.redirectRoute ? this.props.redirectRoute : ConfigStore.getDashboardRoute() );
                this.props.onUpdate( { request: 'authenticated' } );
            }
        }
    }
    render () {
        let terms_URL = "https://deepmarkit.com/legal-privacy/";
        let policy_URL = "https://deepmarkit.com/legal-privacy/";

        return (
            <div class="login-wrapper">
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
                        <div className="login-type m-b-8">{i18n.stringFor("label_login_register")}</div>
                        
                        <div className="login-sign-up"><a href="#" onClick={this.props.formChange.bind( this )}><String code="label_already_have_account" /></a></div>

                        <form className="p-t-2">
                            <div className="form-group">
                                <input type="text" placeholder={i18n.stringFor('label_first_name')} className="form-control" name="firstName" id="first_name" maxLength="255" tabIndex="2" onChange={this.onChange.bind( this )} />
                                <ValidationError response={this.state.lastResponse} field="firstName"/>
                            </div>

                            <div className="form-group">
                                <input type="text" placeholder={i18n.stringFor('label_last_name')} className="form-control" name="lastName" id="last_name" maxLength="255" tabIndex="3" onChange={this.onChange.bind( this )} />
                                <ValidationError response={this.state.lastResponse} field="lastName"/>
                            </div>

                            <div className="form-group">
                                <input type="text" placeholder={i18n.stringFor('label_email')} className="form-control" name="email" id="email" maxLength="254" tabIndex="4" onChange={this.onChange.bind( this )} />
                                <ValidationError response={this.state.lastResponse} field="email"/>
                                <ValidationError response={this.state.lastResponse} field="login"/>
                            </div>

                            <div className="form-group">
                                <input type="password" placeholder={i18n.stringFor('label_password')} className="form-control" name="password" tabIndex="5" maxLength="128" id="password" onChange={this.onChange.bind( this )} />
                                <ValidationError response={this.state.lastResponse} field="password"/>
                            </div>

                            <div className="form-group">
                                <button type="button" className="btn btn-cta" onClick={this.submit.bind( this )} tabIndex="9" disabled={this.state.processing}>
                                    <String code='label_register'/>
                                </button>
                            </div>

                            <div className="row">
                                <div className="login-terms">
                                    <p><String code='label_portal_terms_conditions' keys = {{terms_URL:terms_URL, policy_URL:policy_URL}} /></p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = UserRegister;
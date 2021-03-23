import React from 'react';
import UserStore from '../../store/UserStore';
import ValidationError from '../common/ValidationError.jsx';
import String from '../common/String.jsx';

class ForgotPassword extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            showResetForm: true,
            panelMessage: '',
            processing: false,
            email: ''
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
    onSubmitRequest () {
        this.setState( { processing: true }, function () { UserStore.sendPasswordReset( this.state.email, this.props.tag ); } );
    }
    onUserResetPassword ( e ) {
        this.setState( { lastResponse: null, processing: false }, function () {
            if ( e.response && e.response.hasErrors() ) {
                this.setState( { lastResponse: e.response } );
            } else {
                this.setState( { showResetForm: false, panelMessage: <div style={{ textAlign: "center" }}><String code="message_password_reset" keys={{email: e.response.result.login}}/></div> } );
            }
        } );
    }
    returnToLogin () {
        this.props.onUpdate( { request: 'login' } );
    }
    render () {
        let renderContent = null;

        if ( this.state.showResetForm ) {
            renderContent = (
                <div className="password-reset">
                    <div className="alert alert-warning">
                        <String code='label_change_password_warning'/>
                    </div>

                    <div className="form-group">
                        <label className="control-label"><String code='label_email'/></label>
                        <input type="email" className="form-control" onChange={this.onEmailChange.bind( this )} />
                        <ValidationError response={this.state.lastResponse} field="login"/>
                    </div>

                    <div className="form-group">
                        <button type="button" className="btn btn-cta" onClick={this.onSubmitRequest.bind( this )} disabled={this.state.processing}><String code='label_reset_password' /></button>
                        <button type="button" className="btn btn-default round pull-right" onClick={this.returnToLogin.bind( this )} disabled={this.state.processing}><String code='label_cancel' /></button>
                    </div>
                </div>
            )
        } else {
            renderContent = (
                <div>
                    {this.state.panelMessage}
                    <div className="form-group">
                        <button type="button" className="btn btn-cta m-t-8" onClick={this.returnToLogin.bind( this )}><String code='label_login' /></button>
                    </div>
                </div>
            )
        }

        return (
            <div class="login-wrapper">
                <div>
                    <form className='p-t-2' role="form">
                        {renderContent}
                    </form>
                </div>
            </div>
        )
    }
}

module.exports = ForgotPassword;

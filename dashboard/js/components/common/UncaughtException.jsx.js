import React from 'react';
import Modal from './Modal.jsx';
import String from './String.jsx';
import i18n from '../../store/i18nStore';

class ContainedModal extends React.Component {
    render () {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <div className="modal-header">
                    <button className="close" data-dismiss="modal" aria-label="Close" onClick={this.props.onHide}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 className="modal-title"><String code="label_uncaught_error_details_modal" /> </h4>
                </div>
                <div className="modal-body">
                    <span className="text-danger">{this.props.details}</span>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={this.props.onHide}><String code="label_close" /></button>
                </div>
            </Modal>
        );
    }
}

class UncaughtException extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { showDetails: false }
    }
    componentWillReceiveProps ( props ) {
        this.setState( { rpcResponse: props.response } );
    }
    showDetailsModal () {
        this.setState( { showDetails: true } );
    }
    hideDetailsModal () {
        this.setState( { showDetails: false } );
    }
    hideAlert () {
        // this.setState( { rpcResponse: false } );
        this.props.onDismiss();
    }
    getStatus () {
        if ( !this.props.response ) { return false; }

        if ( this.props.response.hasUncaughtException() ) {
            return 'uncaught';
        }

        if ( this.props.response.hasAjaxError() ) {
            return 'ajax';
        }

        if ( this.props.response.hasApplicationError() ) {
            return 'application';
        }
    }
    getDetails () {
        let status = this.getStatus();

        if ( status ) {
            return { title: 'label_error_' + status, body: 'error_' + status };
        }

        return { title: 'label_error_unknown', body: 'error_unknown' };
    }
    getMessage ( response ) {
        switch ( this.getStatus() ) {
            case 'uncaught':
                return i18n.stringFor( response.errors.uncaught_exception.message, 'error_desc' ) + ( response.errors.uncaught_exception.errorId ? ' Id: ' + response.errors.uncaught_exception.errorId : '' );
            case 'ajax':
                return ( response.status + ": " + response.error );
            case 'application':
                return i18n.stringFor( response.errors.application_error.errorCode, 'error_desc' );
            default:
                return 'An Unknown error occurred';
        }
    }
    hasError () {
        return this.props.response && ( this.props.response.hasUncaughtException() || this.props.response.hasAjaxError() || this.props.response.hasApplicationError() );
    }
    render () {
        if ( !this.props.response || !this.hasError() ) { return null; }

        let { title, body } = this.getDetails();
        let message = this.getMessage( this.props.response );

        return (
            <div className="alert system-alert alert-dismissible">
                <i className="material-icons md-18">warning</i>
                <strong><String code={title} /></strong>

                <button type="button" className="close" data-dismiss="alert" onClick={this.hideAlert.bind( this )}><i className="material-icons">close</i></button>

                <p>{i18n.stringFor( body, 'error_desc' )}</p>

                <button type="button" className="btn btn-primary m-t-2" onClick={this.showDetailsModal.bind( this )}><String code="label_details" /></button>
                { this.state.showDetails ? <ContainedModal show={this.state.showDetails} onHide={this.hideDetailsModal.bind( this )} details={i18n.stringFor( message )} /> : null }
            </div>
        )
    }
}

module.exports = UncaughtException;

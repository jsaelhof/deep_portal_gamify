import React from 'react';
import Modal from '../common/Modal.jsx';
import i18n from '../../store/i18nStore';
import String from '../common/String.jsx';

class ValidationWarningModal extends React.Component {
    constructor( props ) {
        super( props );

        let firstError;
        props.validationErrors.forEach( (error) => {
            if (!firstError) firstError = error;
        } );

        let message;
        switch (props.trigger) {
            case "activate":
            default:
                message = "sh_label_validation_errors_body_activate"
                break;
            case "preview":
                message = "sh_label_validation_errors_body_preview"
                break;
        }

        this.state = {
            currentError: firstError,
            message: message
        }
    }
    
    onConfirm () {
        this.props.onConfirm( this.state.currentError );
    }

    onCancel () {
        this.props.onCancel();
    }

    render() {
        return (
            <Modal show={true} className="sh-modal">
                <div className="modal-header">
                    <div className="modal-title"><String code='sh_label_validation_errors_title'/></div>
                </div>
                <div className="modal-body">
                    <p>{i18n.stringFor(this.state.message)}</p>
                    <div className="modal-body-error">
                        <h4><String code='sh_label_validation_subheading'/></h4>
                        {
                            <p>{this.state.currentError.message}</p>
                        }
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary round modal-button" onClick={this.onConfirm.bind(this)}><String code='sh_label_validation_fix_action'/></button>
                    { (this.props.onCancel) ? <button className="btn btn-default round modal-button" onClick={this.onCancel.bind(this)}><String code='sh_label_validation_cancel'/></button> : null }
                </div>
            </Modal>
        );
    }
}

module.exports = ValidationWarningModal;
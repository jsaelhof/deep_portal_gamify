import React from 'react';
import Modal from '../../common/Modal.jsx';
import i18n from '../../../store/i18nStore';

class ActivationConflictDialog extends React.Component {
    constructor( props ) {
        super( props );
    }
    onConfirm () {
        if (this.props.onConfirm) this.props.onConfirm();
    }
    onCancel () {
        if (this.props.onCancel) this.props.onCancel();
    }
    onSubscribe () {
        if (this.props.onSubscribe) this.props.onSubscribe();
    }
    render() {
        return (
            // Modal has it's own way of rendering an empty div if show is false.
            // I'm not leveragin that functionality here...if you don't want to show the loading component, don't show it 
            // (as opposed to always shoing it and toggling whether it displays an empty div or not)
            <Modal show={true} className="sh-modal">
                <div className="modal-header-large modal-center">
                    {i18n.stringFor("sh_label_deactivate_modal_title")}
                </div>

                <div className="modal-body modal-center">
                    <div className="modal-message">
                        <div>
                            <div className="m-b-6"  style={{ fontSize: "0.9em" }}>
                                <div className="m-b-2">{i18n.stringFor("sh_label_deactivate_modal_message")}</div>
                                <div className="pseudo-link" onClick={this.onSubscribe.bind(this)}>Why Go Premium?</div>
                            </div>
                            <div className="m-b-3">{i18n.stringFor("sh_label_deactivate_modal_deactivate").replace("{0}",this.props.conflictActiveCampaign.details.name)}</div>
                            <div>{i18n.stringFor("sh_label_deactivate_modal_activate").replace("{0}",this.props.campaign.details.name)}</div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        type="button" 
                        className="btn btn-primary round modal-button" 
                        onClick={this.onSubscribe.bind( this )}
                    >
                        Subscribe
                    </button>

                    <button 
                        type="button" 
                        className="btn btn-default round modal-button"
                        onClick={this.onConfirm.bind( this )}
                    >
                        Continue
                    </button>

                    <button 
                        type="button" 
                        className="btn btn-default round modal-button" 
                        onClick={this.onCancel.bind( this )}
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        );
    }
}

module.exports = ActivationConflictDialog;
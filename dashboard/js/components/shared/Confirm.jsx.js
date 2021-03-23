import React from 'react';
import Modal from '../common/Modal.jsx';

class Confirm extends React.Component {
    constructor( props ) {
        super( props );
    }
    onConfirm () {
        if (this.props.onConfirm) this.props.onConfirm();
    }
    onCancel () {
        if (this.props.onCancel) this.props.onCancel();
    }
    render() {
        return (
            // Modal has it's own way of rendering an empty div if show is false.
            // I'm not leveragin that functionality here...if you don't want to show the loading component, don't show it 
            // (as opposed to always shoing it and toggling whether it displays an empty div or not)
            <Modal show={true} className="sh-modal">
                { this.props.title ? 
                    <div className="modal-header-large modal-center">
                        {this.props.title}
                    </div>
                : null }

                { 
                    this.props.message || this.props.children ?
                        <div className="modal-body modal-center">
                            <div className="modal-message">{ this.props.children ? this.props.children : this.props.message }</div>
                        </div>
                        :
                        null 
                }
                
                <div className="modal-footer">
                    { this.props.onConfirm ? 
                        <button 
                            type="button" 
                            className={"btn btn-" + (this.props.okButtonType || "primary") + " round modal-button"} 
                            onClick={this.onConfirm.bind( this )}
                        >
                            { this.props.okText || "OK" }
                        </button> 
                        : 
                        null 
                    }
                    { this.props.onCancel ? 
                        <button 
                            type="button" 
                            className="btn btn-default round modal-button" 
                            onClick={this.onCancel.bind( this )}
                        >
                            { this.props.cancelText || "Cancel" }
                        </button> 
                        : 
                        null 
                    }
                </div>
            </Modal>
        );
    }
}

module.exports = Confirm;
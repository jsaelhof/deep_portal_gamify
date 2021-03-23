import React from 'react';
import Modal from '../common/Modal.jsx';

class Loading extends React.Component {
    constructor( props ) {
        super( props );
    }
    componentWillMount () {
    }
    componentDidMount () {
    }
    componentWillUnmount () {
    }
    render() {
        let content =
        <div>
            { this.props.title ? 
                <div className="modal-header-xlarge modal-center">{this.props.title}</div> 
            : null }
            <div className={this.props.modal ? "modal-body modal-center" : "modal-center"}>
                { this.props.message ? <div className="modal-subtext">{this.props.message}</div> : null }
                <div className="spinner">
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>
            </div>
        </div>

        if (this.props.modal) {
            return (
                // Modal has it's own way of rendering an empty div if show is false.
                // I'm not leveragin that functionality here...if you don't want to show the loading component, don't show it 
                // (as opposed to always shoing it and toggling whether it displays an empty div or not)
                <Modal show={true} className="sh-modal loading-modal">
                    { content }
                </Modal>
            );
        } else {
            return (
                <div className="modal-dialog sh-modal">
                    { content }
                </div>
            )
        }
    }
}

module.exports = Loading;
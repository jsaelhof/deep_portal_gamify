import React from 'react';
import Modal from './Modal.jsx';
import String from './String.jsx';

class GamePreviewModal extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            style: {
                portrait: {
                    height: '640px',
                    width: '400px'
                },
                landscape: {
                    height: '400px',
                    width: '640px'
                }
            }
        }
    }
    getStyle () {
        return this.props.orientation ? this.state.style[ this.props.orientation ] : this.state.style.landscape;
    }
    render () {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} size="lg" className="game-preview" staticBackdrop={true}>
                <button className="close pull-right" data-dismiss="modal" aria-label="Close" onClick={this.props.onHide}>
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title"><String code="label_game_preview_modal_header" /></h4>
                <div className="modal-body" style={{textAlign: 'center'}}>
                    <object type="text/html" border="0" style={this.getStyle()} data={ this.props.gameSrc + '&demo=' + ( this.props.scenario || 'bigwin' ) + '&preview=true' }/>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-danger round" onClick={this.props.onCloseClicked}> <String code="label_close" /> </button>
                </div>
            </Modal>
        );
    }
}

module.exports = GamePreviewModal;
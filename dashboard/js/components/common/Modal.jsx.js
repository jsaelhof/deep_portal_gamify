import React from 'react';

class Modal extends React.Component {
    constructor( props ) {
        super( props );
    }
    onBackDrop( e ) {
        if ( this.props.staticBackdrop ) { return; }

        if ( e.target === e.currentTarget && this.props.onHide) {
            this.props.onHide( false );
        }
    }
    render() {
        return (
            <div className={this.props.className}>
                <div style={ { display: this.props.show ? 'block' : 'none' } } className="modal-backdrop fade in" />
                <div style={ { display: this.props.show ? 'block' : 'none' } } className={ this.props.show ? 'modal fade in' : 'modal fade' } tabIndex="-1" role="dialog" onClick={this.onBackDrop.bind( this )}>
                    <div className={'modal-dialog ' + ( this.props.size ? 'modal-' + this.props.size : '' ) }>
                        <div className="modal-content">
                            { this.props.show ? this.props.children : null }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Modal;
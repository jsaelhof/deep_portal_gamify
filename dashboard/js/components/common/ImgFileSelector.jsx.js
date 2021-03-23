import React from 'react';
import Dropzone from 'react-dropzone';
import ReactDOM from 'react-dom';
import String from '../common/String.jsx';
import Hint from '../common/Hint.jsx';
import i18n from '../../store/i18nStore';
import Modal from '../common/Modal.jsx';

class ImgFileSelector extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            imgDataSource: null,
            isError: false,
            isLoading: false,
            selected: false,
            error: ''
        }
    }
    read ( file ) {
        let reader = new FileReader();

        reader.onload = function ( event ) {
            this.setState( { imgDataSource: event.target.result, selected: file, isLoading: false } );
        }.bind( this );

        reader.readAsDataURL( file );
    }
    imgLoaded () {
        if ( this.state.selected ) {
            let file = this.state.selected;
            file.width = this.refs.imgSelected.naturalWidth;
            file.height = this.refs.imgSelected.naturalHeight;

            this.setState( {
                selected: file
            }, function () {
                this.props.onSetImgSource( this.state.imgDataSource, this.state.selected );
            } );
        }
    }
    imgLoadError () {
        this.setState( { error: 'error_drop_image_bad_or_corrupt_data', isError: true }, function () {
            this.remove();
            if ( this.props.onImgSourceError ) {
                this.props.onImgSourceError( { error: 'label_drop_image_bad_or_corrupt_data' } );
            }
        } );
    }
    onDrop ( files ) {
        if ( !this.isValidType( files[ 0 ].type ) ) {
            this.setState( { isError: true, error: 'label_icon_format_modal_body' } );
        } else {
            this.setState( { isLoading: true }, function () {
                setTimeout( this.read( files[ 0 ] ), 0 );
            } );
        }
    }
    isValidType ( type ) {
        return /image\/jpeg|image\/png|image\/jpg/.test( type );
    }
    closeErrorModal () {
        this.setState( { isError: false } );
    }
    select () {
        ReactDOM.findDOMNode( this.refs.dropzone ).click();
    }
    restore () {
        this.setState( { imgDataSource: null }, this.props.onRestoreDefault );
    }
    remove () {
        this.setState( { imgDataSource: null }, this.props.onRemoveImgSource );
    }
    render () {
        let image = <String code="label_edit_game_image_drop_hint"/>;
        let nocache = this.props.nocache ? '?' + this.props.nocache + Math.random( 999 ) : '';
        let source = ( this.state.imgDataSource || ( !this.props.imgSource ? this.props.imgSource : this.props.imgSource + nocache ) );
        let label = this.props.label ? <label>{i18n.stringFor(this.props.label)}</label> : null;
        let hint = this.props.hint ? <Hint hint={<String code={this.props.hint}/>} placement={this.props.hintPlacement} /> : null;

        if ( source ) {
            image = <img ref="imgSelected" src={source} onLoad={this.imgLoaded.bind( this )} onError={this.imgLoadError.bind( this )} />;
        } else {
            if (this.props.defaultContent) {
                image = <div className="upload-label">{this.props.defaultContent}</div>;
            } else {
                image = <div className="upload-label"><String code="label_upload_img" /></div>;
            }
        }

        if ( this.state.loading ) {
            image = <div className="upload-label"><String code="label_loading" /></div>;
        }

        let restoreButton, removeButton, selectButton = null;

        if ( this.props.showSelectButton ) {
            selectButton = (
                <button type="button" className="btn btn-icon" key="select-button" onClick={this.select.bind( this )} disabled={this.props.disabled} title={i18n.stringFor( 'label_upload_image', false, { imageType: this.props.imageType } ) }>
                    <i className="material-icons md-18">file_upload</i>
                </button>
            )
        }

        if ( this.props.onRestoreDefault ) {
            restoreButton = (
                <button type="button" className="btn btn-icon" key="restore-button" onClick={this.restore.bind( this )} disabled={this.props.disabled} title={i18n.stringFor( 'label_restore_default' )}>
                    <i className="material-icons md-18">restore</i>
                </button>
            )
        }

        if ( this.props.onRemoveImgSource && source ) {
            removeButton = (
                <button type="button" className={this.props.deleteBtnClassName || "btn btn-icon"} key="remove-button" onClick={this.remove.bind( this )} disabled={this.props.disabled} title={i18n.stringFor( 'label_remove_image', false, { imageType: this.props.imageType } ) }>
                    <i className="material-icons md-18">delete</i>
                </button>
            );
        }

        return (
            <div className="img-file-selector">
                {label}
                {hint}
                <div className="img-file-selector-content">
                    <Dropzone ref="dropzone" onDrop={this.onDrop.bind( this )} className={ source ? "dropzone-source dropzone" : "dropzone" } accept="image/*" disabled={this.props.disabled} disableClick={this.props.disabled} >
                        {image}
                    </Dropzone>
                    <div className="dropzone-ctrl">
                        {selectButton}
                        {restoreButton}
                        {removeButton}
                    </div>
                </div>
                <ErrorModal show={this.state.isError} message={this.state.error} onHide={this.closeErrorModal.bind( this )} />
            </div>
        )
    }
}

class ErrorModal extends React.Component {
    constructor ( props ) {
        super( props );
    }
    render () {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} className="sh-modal">
                <div className="modal-header-large modal-center">
                    <String code="label_icon_format_modal_header" />
                </div>
                <div className="modal-body modal-center">
                    <div className="modal-subtext"><String code={this.props.message} /></div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary round modal-button" onClick={this.props.onHide}><String code="label_ok" /></button>
                </div>
            </Modal>
        );
    }
}

module.exports = ImgFileSelector;
import _ from 'underscore';
import React from 'react';
import Modal from '../../../common/Modal.jsx';
import ImgFileSelector from '../../../common/ImgFileSelector.jsx';
import String from '../../../common/String.jsx';
import GameStore from '../../../../store/GameStore';
import i18n from '../../../../store/i18nStore';
import download from '../../../shared/util/Download';

class LibraryAssetsModal extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            library: {
                recommended: [],
                others: []
            },
            content: {},
            valid: true,
            selected: false,
            animate: '',
            initLibrary: true
        }
    }
    componentWillMount () {
        GameStore.addEventListener( this );
    }
    componentWillUnmount () {
        GameStore.removeEventListener( this );
    }
    componentDidMount () {
        GameStore.getLibrary( this.props.gameType, this.props.campaignHash );
    }
    onLibraryLoaded ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState( { 
                content: e.state.library.skin 
            }, function () {
                // Pull out the recommended and others items for this id.
                this.setState( { library: {
                    recommended: this.getLibrary( this.props.gameType, this.props.elementType, [ this.props.skinName ], false ),
                    others: this.getLibrary( this.props.gameType, this.props.elementType, [], this.props.skinName ),
                } }, () => {
                    // Since we arent rendering the library in recommended and others sections, i'm going to merge them here into one list.
                    // If we decide we don't need recommended for naything this could probably refactored simpler.
                    let library = { ...this.state.library };
                    library.all = library.recommended.concat(library.others);
                    this.setState( {
                        library: library,
                        initLibrary: false
                    } );
                } )
            } )
        }
    }
    getSkip ( item, check ) {
        return item.recommended.indexOf( check ) !== -1;
    }
    has ( tags, value ) {
        return tags.indexOf( value ) !== -1;
    }
    meetsRequirements( required, tags ) {
        return _.difference( required, tags ).length === 0;
    }
    getLibrary ( gameType, element, required, skip ) {
        if ( !required ) { required = []; }
        return this.state.content.filter( item => {
            return !item.hidden && this.has( item.id, element ) && this.meetsRequirements( required, item.recommended ) && !this.getSkip( item, skip )
        }, this );
    }
    selectLibraryItem ( libraryItem ) {
        if (!this.state.uploading) {
            libraryItem.src = this.languageSanitizePath( libraryItem.src ); // some paths require LANG
            this.setState( { 
                applyMethod:"library", 
                libraryItem: libraryItem,
                selected: GameStore.getImgBasePath( this.props.campaignHash, this.props.gameType ) + libraryItem.src 
            } );
        }
    }
    apply () {
        switch (this.state.applyMethod) {
            case "library":
                if ( this.state.selected ) {
                    this.props.onDone( { data: this.getImageData( this.state.selected ), file: { type: 'image/png' }, properties: this.state.libraryItem.properties } );
                }
                break;
            case "upload":
                this.setState( { uploading: true }, () => {
                    this.props.onDone( { data: this.state.imgsource, file: this.state.imgfile } );
                } )
                break;
        }
    }
    // applyUpload () {
    //     this.props.onDone( { data: this.state.imgsource, file: this.state.imgfile } );
    // }
    getImageData ( src ) {
        let canvas = document.createElement( 'canvas' );
        let context = canvas.getContext( '2d' );
        let img = this.refs.image_preview;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        context.drawImage( img, 0, 0 );
        return canvas.toDataURL();
    }
    cancel () {
        this.setState( { selected: false }, function () {
            this.props.onDone( false );
        } )
    }
    hide () {
        this.setState( { selected : false }, function () {
            this.props.onHide( false );
        } );
    }
    onSetImgSource ( source, file ) {
        this.setState( { applyMethod:"upload", imgfile: file, imgsource: source, valid: this.isValid( this.props.imgItem, file ) } );
    }
    isValid ( element, file ) {
        let enforce = element.validation && element.validation.enforce || [];
        return enforce.filter( ( val ) => file[ val ] !== this.props.imgItem[ val ] ).length === 0;
    }
    styleElements ( element ) {
        let response = { divStyle: {} };
        if ( element.thumbnail ) {
            response.divStyle = { width: element.thumbnail.width, height: element.thumbnail.height, overflow: 'hidden', margin: 'auto' };
        }
        return response;
    }
    languageSanitizePath ( source ) {
        if ( !source ) { return; }
        return source.replace( "{lang}", i18n.LANGUAGE );
    }
    hasContent () {
        return this.state.library.recommended.length || this.state.library.others.length;
    }
    getSource () {
        if (this.state.applyMethod === "library") {
            // The current image was chosen from the library. It's path is stored in the state.
            return this.state.selected;
        } else if (this.state.applyMethod === "upload") {
            // The current image was uploaded. It hasn't been saved to the server yet so we'll use the preview blob url.
            return this.state.imgfile.preview;
        } else {
            // No image has been selected form the library or uploaded yet. The current image is found from the props.
            return this.props.path;
        }
    }
    isSprite () {
        return [ 'player', 'bonusitem' ].indexOf( this.props.element.id ) !== -1;
    }
    getAnimation () {
        return { animation: this.state.animate };
    }
    updateElm ( ) {
        this.setState( { animate: 'runCycle 0.5s steps(' + Math.floor( ( this.refs.image_preview.naturalWidth / this.props.element.height ) ) + ') infinite' } );
    }
    renderPreview () {
        let src = this.getSource();

        if ( !src ) { return null; }

        if ( this.props.element.thumbnail ) {

            let styles = this.styleElements( this.props.element );

            return (
                <div key={'_container_' + src}>
                    <div className={"library-item" + ( this.isSprite() ? ' runner animate' : '' ) } style={styles.divStyle}>
                        <img id="image_preview" ref="image_preview" src={this.getSource()} style={this.getAnimation()} onLoad={this.updateElm.bind( this )} />
                    </div>
                </div>
            );
        }

        return <img id="image_preview" ref="image_preview" src={this.getSource()} />;
    }
    setAnimationTiming ( e ) {
        if ( !this.isSprite() ) { return; }
        let elm = e.target;

        if ( elm ) {
            elm.style[ 'animation-timing-function' ] = 'steps(' + Math.floor( ( elm.naturalWidth / this.props.element.height ) ) + ')';
        }
    }
    onDownload () {
        let source = this.getSource();
        let mimeType;
        let filename;

        if (this.state.applyMethod === "upload") {
            // Get the file type from the file data.
            mimeType = this.state.imgfile.type;
            filename = this.state.imgfile.name;
        } else {
            // The image is either the default from the gmae descriptor or was selected from the library.
            // If it is the default, then it has ?<gamid>_<skinid> appended to the url (no idea why).
            // Because of this, we always have to split that part off before grabbing the filename and extension
            // from the end of ths string.
            let ext = source.split("?")[0].substr(source.lastIndexOf(".")+1);
            mimeType = "image/"+ext;
            filename = source.split("?")[0].substr(source.lastIndexOf("/")+1);
        }

        var x = new XMLHttpRequest();
            x.open("GET", source, true);
            x.responseType = 'blob';
            x.onload=function(e){
                // Downlaod is a function that gets added to the window object.
                // It is third-party code for wrapping functionality to download a file instead of rendering it in the browser.
                // See the Download import on this class for the location of the code.
                download(x.response, filename, mimeType ); 
            }
            x.send();
    }
    render () {
        return (
            <Modal show={this.props.show} onHide={this.hide.bind( this )} size="lg" className="sh-modal" staticBackdrop={true}> 
                <div className="modal-header">
                    <button className="close" data-dismiss="modal" aria-label="Close" onClick={this.hide.bind( this )}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <div className="modal-header-large modal-center">
                        <String code="label_library_select_image" />
                    </div>
                    <div className="modal-subtext modal-center">Upload an image or choose one from our library!</div>
                </div>

                <div className="modal-body">
                    <div>
                        <div className="img-preview">
                            <div className="img-preview-label">{this.props.label}</div>
                            <div className="img-preview-description">{this.props.description}</div>
                            <div className={ this.isSprite() ? '' : 'img-preview-asset'}>
                                {this.renderPreview()}
                            </div>
                            <div className="img-download-button">
                                {/* If you would like to use this image as a template to create your own, <a onClick={this.onDownload.bind(this)}>click here</a> to download it. */}
                                <button className="btn btn-default round m-t-2" onClick={this.onDownload.bind(this)}>Download Image</button>
                            </div>
                        </div>

                        <div className="img-library">
                            { this.state.uploading ? 
                                <div className="img-upload-progress">
                                    <div className="img-upload-progress-title">Uploading Image</div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-success progress-bar-striped" role="progressbar" style={ { width: this.props.uploadProgress + "%" } }>{this.props.uploadProgress}%</div>
                                    </div>
                                    <div className="img-upload-subtext">This dialog will close when your upload has completed</div>
                                </div>
                                :
                                <div>
                                    <div className="img-upload">
                                        <div className="img-library-label"><String code={"label_custom_image"} /></div>
                                        <ImgFileSelector 
                                            onSetImgSource={this.onSetImgSource.bind( this )} 
                                            imgSource={this.languageSanitizePath( this.state.imgSource )}
                                            defaultContent={<div className="drop-content">
                                                <div>
                                                    <i className="material-icons">cloud_upload</i>
                                                </div>
                                                <div className="drop-content-label">Drag-and-Drop or Click Here</div>
                                                <div className="drop-content-subtext">to select a file from your computer</div>
                                            </div>}
                                        />
                                        <div className={this.state.valid ? 'hidden' : 'img-upload-error'}>{i18n.stringFor( 'error_library_assets_invalid_image', 'error_desc' )}</div>
                                    </div>
                                    <div className="library-container">
                                            <div className="img-library-label"><String code={"label_library"} /></div>
                                                { 
                                                    this.state.initLibrary ?
                                                        <span><h4 style={ {textAlign:'center'} }>Downloading...</h4></span>
                                                        :
                                                        null
                                                }
                                                { 
                                                    !this.state.initLibrary && !this.hasContent() ?
                                                        <span><h4 style={ {textAlign:'center'} }>Sorry, we don't have any library images available for this element.</h4></span>
                                                        :
                                                        null
                                                }
                                                {
                                                    !this.state.initLibrary && this.hasContent() ?
                                                        <div>
                                                        {
                                                            this.state.library.all.map( ( item, index ) => {
                                                                let styles = this.styleElements( this.props.element );
        
                                                                return (
                                                                    <div key={'_container_' + item.id + index} className="library-item-wrapper">
                                                                        <a role="link" className={ ( this.isSprite() ? 'sprite-thumbnail ' : 'thumbnail ' ) + ( this.state.selected.id === item.id ? 'active' : '' ) } onClick={this.selectLibraryItem.bind( this, item )}>
                                                                            <div className={ ( this.isSprite() ? 'runner animate ' : '' ) +  "library-item"} style={styles.divStyle}>
                                                                                <img id={item.id} src={'/campaignplay/' + this.props.campaignHash + '/games/' + this.props.gameType + '/' + this.languageSanitizePath( item.src )} onLoad={this.setAnimationTiming.bind( this )} />
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                )
                                                            }, this )
                                                        }
                                                        </div>
                                                        :
                                                        null
                                                }
                                            </div>
                                    </div>
                            }
                        </div>
                    </div> 
                    <div className="clearfix" />
                </div>

                { this.state.uploading ? 
                    null
                    :
                    <div className='modal-footer'>
                        <button type="button" className="btn btn-default round modal-button" disabled={this.state.uploading} onClick={this.cancel.bind( this )}><String code="label_cancel" /></button>
                        <button type="button" className="btn btn-primary round modal-button" disabled={!this.state.applyMethod || this.state.uploading} onClick={this.apply.bind( this )}><String code="label_apply" /></button>
                    </div>
                }
            </Modal>
        );
    }
}

module.exports = LibraryAssetsModal;
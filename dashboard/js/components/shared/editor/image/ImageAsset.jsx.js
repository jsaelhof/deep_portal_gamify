import React from 'react';
import Dropzone from 'react-dropzone';
import String from '../../../common/String.jsx';

class ImageAsset extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {};
    }

    read ( file ) {
        let reader = new FileReader();

        reader.onload = function ( event ) {
            this.setState( { imgDataSource: event.target.result, selected: file } );
        }.bind( this );

        reader.readAsDataURL( file );
    }

    onDrop ( files ) {
        // We don't accept multiple files
        if (files.length > 1) return;

        if ( /image\/jpeg|image\/png|image\/jpg/.test( files[ 0 ].type ) ) {
            setTimeout( this.read( files[ 0 ] ), 0 );
        }
    }

    imgLoaded () {
        if ( this.state.selected ) {
            let file = this.state.selected;
            file.width = this.refs.imgSelected.naturalWidth;
            file.height = this.refs.imgSelected.naturalHeight;

            this.setState( {
                selected: file
            }, function () {
                this.props.onSetImgSource( this.props.id, this.state.imgDataSource, this.state.selected );
            } );
        }
    }

    onToggleVisible () {
        if (this.props.onToggleVisible) this.props.onToggleVisible( this.props.id );
    }

    render () {
        let image;
        let source = this.state.imgDataSource || this.props.initialSource;

        if ( source ) {
            image = <img 
                        ref="imgSelected" 
                        id={this.props.id} 
                        src={ source }
                        onLoad={ this.imgLoaded.bind(this) }/>
        } else {
            if (this.props.defaultContent) {
                image = <div className="image-asset-default">{this.props.defaultContent}</div>;
            } else {
                image = <div className="image-asset-default">
                    <div className="dropzone">
                        <div className="drop-content">
                            <div>
                                <i className="material-icons">cloud_upload</i>
                            </div>
                            <div className="drop-content-label"><String code="label_upload_img" /></div>
                        </div>
                    </div>
                </div>;
            }
        }

        let classList = "image-asset";
        if (this.props.mini) classList += " image-asset-mini";
        if (this.props.large) classList += " image-asset-large";

        return <div key={this.props.id} className={classList}>
            <Dropzone ref="dropzone" onDrop={this.onDrop.bind( this )} className="image-asset-dropzone" activeClassName="image-asset-dropzone-active" accept="image/*" disabled={this.props.disabled} disableClick={this.props.disabled} >
                <div className={this.props.removed && source ? "image-asset-content disabled" : "image-asset-content"}>
                    {/* <div onClick={  }> Placeholder if an onClick handler is needed for the panel BEHIND the asset control */}
                        <div className="asset-img">
                            { image }
                        </div>
                        
                        { 
                            this.props.label ?
                                <div className="asset-label">
                                    { this.props.label }
                                </div>
                                :
                                null
                        }
                    {/* </div> */}
                </div>
            </Dropzone>

            { 
                this.props.removable && source ? 
                    <div className="asset-control" onClick={ this.onToggleVisible.bind(this) }>
                        <i className="material-icons">{ this.props.removed ? "visibility_off" : "visibility" }</i>
                    </div>
                    :
                    null
            }
        </div>
    }
}

module.exports = ImageAsset;
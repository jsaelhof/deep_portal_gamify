import _ from 'underscore';
import React from 'react';

import LibraryAssetsModal from './LibraryAssetsModal.jsx';
import String from '../../../common/String.jsx';
import GUID from '../../../../util/guid';
// import Hint from '../common/Hint.jsx';
// import ErrorBoundary from '../common/ErrorBoundary.jsx';

import GameStore from '../../../../store/GameStore';
import i18n from '../../../../store/i18nStore';

class ImageEditor extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = {
            showLibrary: false,
            random: Math.random( 999 ),
            cb: false,
            uploadProgress: undefined
        }
    }
    componentWillMount () {
        //GameStore.addEventListener( this );
    }
    componentWillUnmount () {
        //GameStore.removeEventListener( this );
    }
    updateElement ( id, key, value, associatedProperties ) {
        let descriptor = { ...this.props.descriptor };
        let index = this.getElementById( id, true );

        if ( index !== -1 ) {
            // Check if this update includes any associated properties.
            // This occurs in games like dropper where choosing the "Catcher" object includes a number of properties associated with the image that must be set in the descriptor as well as the image.
            if (associatedProperties) {
                _.keys(associatedProperties).forEach( key => {
                    try {
                        this.props.descriptor.data.properties[key].value = associatedProperties[key].value;
                    } catch (ex) {}
                } );
            }

            // Update the actual image in the descriptor
            descriptor.files.skin[ index ][ key ] = value;

            // Update the parent
            this.props.onUpdate( descriptor );
        } else {
            console.error( 'Game.ImageEditor.failed to find element of id, ', id );
        }
    }
    hideLibrary ( newItem ) {
        if ( newItem ) {
            this.setState( { cb: function ( res ) {
                let filePath = '/assets/' + res.result[ this.state.selectedItem.id ].assetPath.split( '/assets/' )[ 1 ]; // what?
                this.updateElement( this.state.selectedItem.id, 'src', filePath, newItem.properties );
                this.setState( { selectedItem: false, showLibrary: false } );
            }.bind( this ) } );

            let assets = {};
            assets[ this.state.selectedItem.id ] = {};

            // Handler for upload progress. Only assign this if uploading an image, not when using a path change like we do when selecting from the library
            let onUploadProgress;

            if ( newItem.data ) {
                assets[ this.state.selectedItem.id ] = { assetFile: 'assets/' + GUID.randomHex() + '.' + newItem.file.type.split( '/' ).pop(), assetSrc: newItem.data };
                onUploadProgress = ( percentComplete, loaded, total ) => {
                    this.setState( { uploadProgress: Math.floor(percentComplete * 100) } );
                }
            } else {
                let type_split = newItem.url.split( '.' );
                let type = type_split[ type_split.length - 1 ];
                assets[ this.state.selectedItem.id ] = { assetFile: 'assets/' + GUID.randomHex() + '.' + type, assetUrl: newItem.url };
            }

            let onSuccess = ( e ) => {
                if ( e && e.hasErrors() ) {
                    this.setState( { lastResponse: e } );
                } else {
                    if ( this.state.cb ) { this.state.cb( e ); }
                }
            }

            GameStore.upload( 
                this.props.campaignHash, 
                this.props.game[ 'game-type' ], 
                this.props.game[ 'skin-name' ], 
                assets,
                onUploadProgress,
                onSuccess
            );
        } else {
            this.setState( { selectedItem: false, showLibrary: false } );
        }
    }
    getElementById ( id, index ) {
        if ( !this.props.descriptor ) { return; }

        return this.props.descriptor.files.skin[ index ? 'findIndex' : 'find' ]( elm => elm.id === id );
    }
    showLibrary ( item ) {
        this.setState( { showLibrary: true, imgItem: item, libraryType: item.id, selectedItem: item, uploadProgress: 0 } );
    }
    imageFilesLength ( files ) { return files ? files.filter( ( f ) => f.type === 'image' ) : 0; }
    remove ( id, remove ) {
        let index = this.getElementById( id, true );
        let descriptor = this.props.descriptor;

        descriptor.files.skin[ index ].removed = remove;

        this.props.onUpdate( descriptor );
    }
    hasFeature ( feats ) {
        if ( !feats || !this.props.features ) { return true; }
        return Object.keys( feats ).filter( ( feat ) => { return this.props.features[ feat ] && this.props.features[ feat ].enabled !== feats[ feat ].enabled; }, this ).length === 0;
    }
    isAbsolutePath ( path ) {
        return new RegExp( '^(?:[a-z]+:)?//', 'i' ).test( path );
    }
    languageSanitizePath ( source ) {
        return source ? source.replace( "{lang}", i18n.LANGUAGE ) : '';
    }
    render () {
        if ( !this.props.yaml || !this.props.descriptor ) { return null; }

        return (
            
            <div className="preview game-custom">
                {
                    this.props.skills.map( ( skill ) => {
                        if ( !this.imageFilesLength( this.props.descriptor.files.skin ) ) { return null; }
                        return (
                            this.props.descriptor.files.skin.map( function ( item, index ) {
                                if ( item.type === 'image' && item.skill !== 'hidden' && item.skill === skill && this.hasFeature( item.feature ) ) {
                                    let url = this.isAbsolutePath( item.src ) ? 
                                        ( item.src ) 
                                        : 
                                        GameStore.getImgBasePath( 
                                            this.props.campaignHash, 
                                            this.props.game[ 'game-type' ] 
                                        ) + this.languageSanitizePath( item.src ) + '?' + this.props.game['game-type'] + '_' + this.props.game[ 'original-skin' ] + this.state.random
                                    let imgStyle = {
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: "url('" + url +"')",
                                        backgroundSize: "contain",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        margin: "auto",
                                        position: "relative"
                                    }
                                    
                                    if (item.thumbnail) {
                                        imgStyle.width = item.thumbnail.width ? item.thumbnail.width : item.width;
                                        imgStyle.height = item.thumbnail.height ? item.thumbnail.height : item.height;
                                        imgStyle.backgroundSize = "auto"
                                        imgStyle.backgroundPosition = "unset"

                                        // Calc the scale in each direction. Use the smaller value.
                                        let scale = Math.min(150 / imgStyle.width, 130 / imgStyle.height);
                                        imgStyle.transform = "scale(" + scale + ")";

                                        // Calc the vertical center. ContainerHeight - (Height/2)
                                        imgStyle.top = ((130 - imgStyle.height)/2) + "px";

                                        // NOTE: Probably best not use this code. Instead look at the library modal where this is all done a different way.
                                        // Define the name we'll assosicate with this element.
                                        // Add a keyframe style to the head of the page for it one doesn't already exist.
                                        //let cssKeyFrameId = "css_keyframe_"+item.id;
                                        //if (("#"+cssKeyFrameId).length) {
                                        //    $("head").append("<style type='text/css' id='"+cssKeyFrameId+"'>@keyframes "+cssKeyFrameId+" { 100% { background-position: -"+ item.width +"px; } }</style>");
                                        //}

                                        // Set the animation and pause it.
                                        //imgStyle.animation = cssKeyFrameId + " 0.5s steps("+ item.width/imgStyle.width +") infinite";
                                        //imgStyle.animationPlayState = "paused";
                                    }

                                    return (
                                        <div key={item.src} className="image-asset">
                                            <div className={ ( item.removed ? 'image-asset-content disabled' : 'image-asset-content' ) + ( [ 'player', 'bonusitem' ].indexOf( item.id ) !== -1 ? ' sprite' : '' ) } >
                                                <div onClick={ !item.removed ? this.showLibrary.bind( this, item ) : undefined }>
                                                    <div className="asset-img">
                                                        <div
                                                            id={item.id}
                                                            style={ imgStyle }
                                                        />
                                                        {/* <img 
                                                            id={item.id} 
                                                            style={imgStyle}
                                                            src={ 
                                                                this.isAbsolutePath( item.src ) ? 
                                                                ( item.src ) 
                                                                : 
                                                                GameStore.getImgBasePath( 
                                                                    this.props.campaignHash, 
                                                                    this.props.game[ 'game-type' ] 
                                                                ) + this.languageSanitizePath( item.src ) + '?' + this.props.game['game-type'] + '_' + this.props.game[ 'original-skin' ] + this.state.random } /> */}
                                                    </div>

                                                    <div className="asset-label">
                                                        {this.props.yaml.files.skin[ item.id ] ? this.props.yaml.files.skin[ item.id ].label : skill}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={ item.removable ? 'asset-control' : 'hidden' } onClick={this.remove.bind( this, item.id, !item.removed )}>
                                                <i className="material-icons">{ item.removed ? "visibility_off" : "visibility" }</i>
                                            </div>
                                        </div>
                                    );
                                }
                            }, this )
                        )
                    }, this )
                }

                { !this.imageFilesLength( this.props.descriptor.files.skin ) ?
                    <div className="panel-body">
                        <p><String code="label_game_editor_no_images_found" /></p>
                    </div> : null
                }

                {
                    this.state.showLibrary ?
                    <LibraryAssetsModal
                        show={true}
                        imgItem={this.state.imgItem}
                        campaignHash={this.props.campaignHash}
                        path={GameStore.getImgBasePath( this.props.campaignHash, this.props.game[ 'game-type' ] ) + this.languageSanitizePath( this.state.imgItem.src ) + '?' + this.props.game['game-type'] + '_' + this.props.game[ 'original-skin' ]}
                        elementType={this.state.libraryType}
                        element={this.state.selectedItem}
                        label={this.props.yaml.files.skin[ this.state.selectedItem.id ].label}
                        description={this.props.yaml.files.skin[ this.state.selectedItem.id ].desc}
                        gameType={this.props.game[ 'game-type' ]}
                        skinName={this.props.game[ 'original-skin' ]}
                        uploadProgress={this.state.uploadProgress}
                        onHide={this.hideLibrary.bind( this )}
                        onDone={this.hideLibrary.bind( this )}
                    /> : null
                } 
            </div>
        )
    }
}

module.exports = ImageEditor;
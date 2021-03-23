import React from 'react';
import _ from 'underscore';
import String from '../../../common/String.jsx';
import ValidationError from '../../../common/ValidationError.jsx';
import i18n from '../../../../store/i18nStore';
import FontSelector from '../../../shared/FontSelector.jsx';
import FbColorPicker from '../../../shared/ColorPicker.jsx';
var ColorPicker = require('react-color').default;
import ThemeStore from '../../../../store/ThemeStore';
import GUID from '../../../../util/guid';
import ThemePreview from './ThemePreview.jsx';
import GameStore from '../../../../store/GameStore';
import ImageAsset from '../../../shared/editor/image/ImageAsset.jsx';
import UserStore from '../../../../store/UserStore';


class ThemeEditor extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            useLegacyFonts: Array.isArray(this.props.themeDescriptor.fonts),
            fonts: [
                {
                    label: "Open Sans",
                    value: "Open Sans",
                    stylesheet: "https://fonts.googleapis.com/css?family=Open+Sans"
                },
                {
                    label: "Acme",
                    value: "Acme",
                    stylesheet: "https://fonts.googleapis.com/css?family=Acme"
                },
                {
                    label: "Cabin",
                    value: "Cabin",
                    stylesheet: "https://fonts.googleapis.com/css?family=Cabin"
                },
                {
                    label: "EB Garamond",
                    value: "EB Garamond",
                    stylesheet: "https://fonts.googleapis.com/css?family=EB+Garamond"
                },
                {
                    label: "Oswald",
                    value: "Oswald",
                    stylesheet: "https://fonts.googleapis.com/css?family=Oswald"
                },
                {
                    label: "Lato",
                    value: "Lato",
                    stylesheet: "https://fonts.googleapis.com/css?family=Lato"
                },
                {
                    label: "Raleway",
                    value: "Raleway",
                    stylesheet: "https://fonts.googleapis.com/css?family=Raleway"
                },
                {
                    label: "Roboto",
                    value: "Roboto",
                    stylesheet: "https://fonts.googleapis.com/css?family=Roboto"
                },
                {
                    label: "Pragati Narrow",
                    value: "Pragati Narrow",
                    stylesheet: "https://fonts.googleapis.com/css?family=Pragati+Narrow"
                }, 
                {
                    label: "Quicksand",
                    value: "Quicksand",
                    stylesheet: "https://fonts.googleapis.com/css?family=Quicksand"
                },
                {
                    label: "Ubuntu Condensed",
                    value: "Ubuntu Condensed",
                    stylesheet: "https://fonts.googleapis.com/css?family=Ubuntu+Condensed"
                },
                {
                    label: "Cinzel",
                    value: "Cinzel",
                    stylesheet: "https://fonts.googleapis.com/css?family=Cinzel:700"
                },
                {
                    label: "Playfair Display",
                    value: "Playfair Display",
                    stylesheet: "https://fonts.googleapis.com/css?family=Playfair+Display:700"
                },
                {
                    label: "Amiri",
                    value: "Amiri",
                    stylesheet: "https://fonts.googleapis.com/css?family=Amiri:700"
                },
                {
                    label: "Montserrat",
                    value: "Montserrat",
                    stylesheet: "https://fonts.googleapis.com/css?family=Montserrat:600"
                }
            ]
        };
    }

    componentWillMount () {
    }

    componentWillUnmount () {
    }

    componentDidMount () {
    }

    onSetImgSource ( id, data, file ) {
        let type = file.type.split( '/' ).pop();
        let fileName = GUID.randomHex() + "." + type;

        // Upload the logo to theme assets
        let assetFileName = ThemeStore.uploadAsset( this.props.campaignHash, fileName, data, ( e ) => {
            // Upload Success Handler

            // notify the parent component that the theme descriptor has been updated
            let themeDescriptor = {...this.props.themeDescriptor};

            // Update the theme descriptor with the new image path.
            // Also tell the preview window to refresh the image.
            themeDescriptor.images.forEach( (image, index) => {
                if (id === image.id) {
                    themeDescriptor.images[index].value = e.result[ fileName ].assetFile;
                    themeDescriptor.images[index].removed = false;
                    window.frames.preview.postMessage( JSON.stringify( { type: 'image', data:themeDescriptor.images[index] } ), "*" );
                }
            } );

            this.props.onThemeDescriptorUpdated(themeDescriptor);
        } );

        if ( id === "logo" && this.props.syncLogoWithGame ) {
            // Upload the logo to the game assets
            // In the onGameAssetUploaded method we will need to send a message to the Game Editor to use this.
            let gameAssets = {};
            gameAssets["theme"+id] = { 
                assetFile: 'assets/' + fileName, 
                assetSrc: data 
            }

            GameStore.upload( 
                this.props.campaignHash, 
                this.props.campaignDetails.selectedGame["game-type"], 
                this.props.campaignDetails.selectedGame["skin-name"], 
                gameAssets,
                undefined,
                ( e ) => {
                    // TODO: Handle an error
            
                    // Only handle this upload if it includes a logo. Other uploads to the game will trigger this event handler.
                    if (e.result && e.result.themelogo) {
                        this.props.onGameAssetFileUploaded( id, e.result.themelogo.assetFile, e.result.themelogo.assetPath );
                    }
                }
            );
        }
    }

    onToggleVisible ( id ) {
        //console.log("toggle visible:",id);
        // notify the parent component that the theme descriptor has been updated
        let themeDescriptor = {...this.props.themeDescriptor};

        // Update the theme descriptor with the new image path.
        // Also tell the preview window to refresh the image.
        themeDescriptor.images.forEach( (image, index) => {
            if (id === image.id) {
                themeDescriptor.images[index].removed = !themeDescriptor.images[index].removed;
                window.frames.preview.postMessage( JSON.stringify( { type:'image', data:themeDescriptor.images[index] } ), "*" );
            }
        } );

        this.props.onThemeDescriptorUpdated(themeDescriptor);
    }

    // onFontColorChange ( color, id ) {
    //     //console.log("color:", color)
    //     // they selected a different font.  Let's update the theme descriptor and then update the preview to show the newly selected font
    //     var newFont;
    //     // get a copy of the theme descriptor
    //     var themeDescriptor = {...this.props.themeDescriptor};

    //     // loop through the fonts and flag the selected font as 'selected' and remove the selected node from the others
    //     for(var i=0; i<themeDescriptor.colors.length; i++) {
    //         if(themeDescriptor.colors[i].id === obj) {
    //             themeDescriptor.fonts[i].selected = true;
    //             newFont = themeDescriptor.fonts[i];
    //         } else { 
    //             delete themeDescriptor.fonts[i].selected;
    //         }
    //     }

    //     // notify the parent component that the theme descriptor has been updated
    //     this.props.onThemeDescriptorUpdated(themeDescriptor);

    //     // update the preview with the newly selected font
    //     window.frames.preview.postMessage( JSON.stringify( { type: 'font', data: newFont } ), "*" );
    // }

    onTextChange(e) {
        let key   = e.target.name;
        let value = e.target.value;

         // they selected a different font.  Let's update the theme descriptor and then update the preview to show the newly selected font
         var newText;
         // get a copy of the theme descriptor
         var themeDescriptor = {...this.props.themeDescriptor};
 
         // loop through the fonts and flag the selected font as 'selected' and remove the selected node from the others
         for(var i=0; i<themeDescriptor.text.length; i++) {
             if(themeDescriptor.text[i].id === key) {
                 themeDescriptor.text[i].value = value;
                 newText = themeDescriptor.text[i];
                 break;
             } 
         }
 
         // notify the parent component that the theme descriptor has been updated
         this.props.onThemeDescriptorUpdated(themeDescriptor);
 
         // update the preview with the newly selected font
         window.frames.preview.postMessage( JSON.stringify( { type: 'text', data: newText } ), "*" );
    }

    // showColorPicker(e, target) {
    //     target.show();
    // }

    

    onFontChange(fontId, e) {
        var themeDescriptor = {...this.props.themeDescriptor};

        // Loop over the fonts and find the one that matches
        this.state.fonts.forEach( font => {
            if (font.label === e.target.value) {
                if (themeDescriptor.fonts) themeDescriptor.fonts[fontId].font = font; 
            }
        } );

        window.frames.preview.postMessage( JSON.stringify( { type: 'font', data: themeDescriptor.fonts } ), "*" );
        // notify the parent component that the theme descriptor has been updated
        this.props.onThemeDescriptorUpdated(themeDescriptor);
    }

    /*
    * LEGACY FONT SUPPORT FOR OLD THEME=DESCRIPTOR-BASED FONT LIST
    */
    onLegacyFontChange(e) {
        // get a copy of the theme descriptor
        var themeDescriptor = {...this.props.themeDescriptor};
         // loop through the fonts and flag the selected font as 'selected' and remove the selected node from the others
        for(var i=0; i<themeDescriptor.fonts.length; i++) {
            if(themeDescriptor.fonts[i].value === e.target.value) {
                themeDescriptor.fonts[i].selected = true;
                // update the preview with the newly selected font
                window.frames.preview.postMessage( JSON.stringify( { type: 'font', data: themeDescriptor.fonts[i] } ), "*" );
            } else { 
                delete themeDescriptor.fonts[i].selected;
            }
        }
         // notify the parent component that the theme descriptor has been updated
        this.props.onThemeDescriptorUpdated(themeDescriptor);
        
    }

    getLegacyCurrentlySelectedFont() {
        // loop through all the available fonts and return the font that is currently marked 'selected'
        for (var i=0; i<this.props.themeDescriptor.fonts.length; i++) {
            var font = this.props.themeDescriptor.fonts[i];
            if (font.selected) return font.label;
        }
        return null;
    }
    /*
    * END LEGACY FONT SUPPORT
    */

    getColor(id) {

        var result = this.props.themeDescriptor.colors.filter(function(e) {
            return e.id === "font";
        })[0];
        
        return result.value;
        
    }

    getColorSelectors() {
        let colors = this.props.themeDescriptor.colors.map( (color, index, array) => {
            
            if (color.skill === "basic") {
                return <div key={"color_"+index} className="color-selector setting">
                    <div className="pull-left m-r-2">
                        <FbColorPicker 
                            type="hex" 
                            color={color.value} 
                            id={color.id} 
                            valueType='rgba' 
                            min={true} 
                            onChange={this.onColorChange.bind(this)}
                        />
                    </div>
                    <label id={'label_color_'+index} className="color-label">{color.label}</label>
                </div>
            }
         
        });

        return <div className="setting-group">{colors}</div>;
    }

    onColorChange(color, id) {
        //console.log("COLOR CHANGE: ", id, color);
        // they selected a different color.  Let's update the theme descriptor and then update the preview to show the newly selected color
        var newColor;
        // get a copy of the theme descriptor
        var themeDescriptor = {...this.props.themeDescriptor};

        // loop through the colors and find the one they modied and update it
        for(var i=0; i<themeDescriptor.colors.length; i++) {
            //console.log("--> ", themeDescriptor.colors[i].id, id);
            if(themeDescriptor.colors[i].id === id) {
                themeDescriptor.colors[i].value = color;
                newColor = themeDescriptor.colors[i];
                break;
            }
        }

        // notify the parent component that the theme descriptor has been updated
        this.props.onThemeDescriptorUpdated(themeDescriptor);

        // update the preview with the newly selected color
        window.frames.preview.postMessage( JSON.stringify( { type: 'color', data: newColor } ), "*" );
    }

    generateTextFields ( showAll ) {
        let fields = [];
        
        this.props.themeDescriptor.text.map( (text, index, array) => {
            if (showAll || text.skill === "basic") {
                let skipField = false;

                if (text.id === "cashclub" && (!this.props.campaignDetails.grandPrizeDraw || !this.props.campaignDetails.grandPrizeDraw.enabled)) {
                    // skip the cash club since they don't have it turned on
                    skipField = true;
                }

                if (!skipField) {
                    fields.push(
                        <div key={text.id} className="form-group" data-page={text.page}>
                            <label className="control-label">{text.label}</label>
                            <input 
                                type="text" 
                                className="form-control form-theme" 
                                name={text.id} id={text.id} value={text.value} 
                                onChange={ this.onTextChange.bind(this) }
                            />
                        </div>
                    );
                }
            }
        });

        return fields;
    }

    onEditAllText () {
        this.setState( {
            showEditAllText: true
        } );
    }

    onCloseEditAllText () {
        this.setState( {
            showEditAllText: false
        } )
    }


    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="sh_label_campaign_design" />
                                </h1>
                                <h3 className="subheading"><String code="sh_label_customize_social"/></h3>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="theme-editor-wrapper">
                                {/* * Data Entry Part **/}
                                {/* <div className="editor-controls-float"> */}

                                    <div className="form">

                                        <div className="form-group">
                                            <label className="control-label">{i18n.stringFor( 'sh_label_images_section' )}</label>
                                            <div>
                                            { 
                                                this.props.themeDescriptor.images.map( image => {
                                                    // If this is an advanced image, don't show it.
                                                    if (image.skill === "advanced") return;

                                                    return <ImageAsset 
                                                        key={image.id}
                                                        id={image.id}
                                                        initialSource={ image.value ? "/campaign/" + this.props.campaignHash + "/" + image.value : undefined }
                                                        label={i18n.stringFor("sh_label_"+image.id+"_image")}
                                                        removed={image.removed}
                                                        removable={true}
                                                        onSetImgSource={this.onSetImgSource.bind(this)}
                                                        onToggleVisible={this.onToggleVisible.bind(this)}
                                                    />
                                                } )
                                            }
                                            </div>
                                        </div>


                                        {/** Font Selector **/}
                                        <div className="form-group">
                                            {
                                                this.state.useLegacyFonts ? 
                                                    <div>
                                                        <label className="control-label">{i18n.stringFor( 'sh_label_font_selector' )}</label>
                                                        <FontSelector fonts={this.props.themeDescriptor.fonts} onChange={this.onLegacyFontChange.bind(this)} value={this.getLegacyCurrentlySelectedFont()} />
                                                    </div>
                                                    :
                                                    _.keys(this.props.themeDescriptor.fonts).map(id => {
                                                        let fontSelect = this.props.themeDescriptor.fonts[id];
                                                        return (
                                                            <div>
                                                                <label className="control-label">{fontSelect.label}</label>
                                                                <FontSelector fonts={this.state.fonts} onChange={this.onFontChange.bind(this,id)} value={fontSelect.font.label} />
                                                            </div>
                                                        )
                                                    } )
                                            }
                                        </div>

                                        <div className="clearfix" />

                                        {/** Colors - Title, Message, and Button **/}
                                        <div className="form-group m-b-3">

                                            <div className="clearfix" />
                                            <label className="control-label">{i18n.stringFor( 'sh_label_color_section' )}</label>
                                            <div className="color-ctrl">
                                                {this.getColorSelectors()}
                                            </div>
                                        </div>
                            
                                        <div className="m-t-2">
                                            <div className="setting-group">
                                                {this.generateTextFields(false)}
                                            </div>
                                            <a onClick={this.onEditAllText.bind(this)} style={{ cursor: "pointer", textDecoration: "underline" }}>Edit Additional Text</a>
                                        </div>
                                    </div>

                                {/* </div> */}

                                {/** ThemePreview for LeadPages **/}
                                <ThemePreview
                                    campaignHash={this.props.campaignHash}
                                    previewShadow={ this.props.previewShadow }
                                    width={this.props.themeDescriptor.previewsettings ? this.props.themeDescriptor.previewsettings.width : "100%" }
                                    height={this.props.themeDescriptor.previewsettings ? this.props.themeDescriptor.previewsettings.height : "765px" }
                                />
                            </div>

                            { this.state.showEditAllText ? 
                                <EditAllTextModal 
                                    state={ this.state}
                                    onTextChange={this.onTextChange.bind(this)}
                                    fields={ this.generateTextFields(true) }
                                    onConfirm={ this.onCloseEditAllText.bind(this) }
                                /> 
                                : null 
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class EditAllTextModal extends React.Component {
    constructor( props ) {
        super( props );
    }

    render() {

        let fieldGroups = {};

        this.props.fields.map( el => {
            if (!fieldGroups[el.props["data-page"]]) {
                fieldGroups[el.props["data-page"]] = [];
            }
            fieldGroups[el.props["data-page"]].push( el );
        } );

        return (
            <div className="flex-modal edit-all-text">
                <div className="flex-modal-shade" onClick={this.props.onConfirm.bind( this )}>
                </div>
                <div className="flex-modal-wrapper">
                    <div className="flex-modal-body">
                        { 
                            _.keys(fieldGroups).map( key => {
                                return <div className="edit-all-text-group">
                                    <div className="edit-all-text-label">{i18n.stringFor("label_theme_page_"+key)}</div>
                                    {
                                        fieldGroups[key]
                                    }
                                </div>
                            } )
                        }
                    </div>
                    <div className="flex-modal-footer">
                        <button className="btn btn-primary round modal-button" onClick={this.props.onConfirm.bind( this )}><String code='label_ok'/></button>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = ThemeEditor;
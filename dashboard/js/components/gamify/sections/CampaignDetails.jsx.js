import React from 'react';
import _ from 'underscore';
import String from '../../common/String.jsx';
import ValidationError from '../../common/ValidationError.jsx';

import ImgFileSelector from '../../common/ImgFileSelector.jsx';

import i18n from '../../../store/i18nStore';

import FontSelector from '../../shared/FontSelector.jsx';
import FbColorPicker from '../../shared/ColorPicker.jsx';
var ColorPicker = require('react-color').default;
import CampaignStore from '../../../store/CampaignStore';
import ThemeStore from '../../../store/ThemeStore';
import GUID from '../../../util/guid';
import ThemePreview from './ThemePreview.jsx';
import GameStore from '../../../store/GameStore';





class CampaignDetails extends React.Component {

    constructor ( props ) {
        super( props );

        let cd = this.props.campaignDetails;
        let tp = this.props.themeProperties;
        let td = this.props.themeDescriptor;

        this.state = {

            asset: null,
            showEditAllText: false,
            buttonColor:     (td && td.btn_bgd_color._background_) ? td.btn_bgd_color._background_ : '#000000',
            titleColor:      (td && td.h1_text_color._color_) ? td.h1_text_color._color_ : '#000000',
            messageColor:    (td && td.h2_text_color._color_) ? td.h2_text_color._color_: '#000000',
            backgroundColor: (td && td.body_color._background_color_) ? td.body_color._background_color_: '#000000',

            campaignDetails: cd,
            previewSourceReady: true,
            lastResponse: null,
            version: 'latest',
            fonts: [
                {
                    "label": "Proxima Nova",
                    "value": "'ProximaNova'"
                },
                {
                    "value": "Cabin"
                },
                {
                    "value": "EB Garamond"
                },
                {
                    "label": "Exo 2",
                    "value": "'Exo 2'"
                },
                {
                    "value": "Lato"
                },
                {
                    "value": "Open Sans"
                },
                {
                    "value": "Raleway"
                },
                {
                    "value": "Roboto"
                }
            ],
            font: "ProximaNova",

            textFields: this.updateTextFields()
        };

        this.onTextChange = this.onTextChange.bind(this);
        this.onChange = this.onChange.bind( this );
        this.showColorPicker = this.showColorPicker.bind(this);
        this.updateGameAndTheme = this.updateGameAndTheme.bind(this);
        this.onSetImgSource = this.onSetImgSource.bind(this);
        this.onRemoveImgSource = this.onRemoveImgSource.bind(this);
        this.notifyParent = this.notifyParent.bind(this);
    }

    componentWillReceiveProps() {

        let tp = this.props.themeProperties;
        let td = this.props.themeDescriptor;

        if( this.props.campaignDetails ) {
            this.setState(
                { campaignDetails: this.props.campaignDetails }
            );
        }

        if( tp ) {
            this.setState(
                {
                    textFields: this.updateTextFields()
                }
            );
        }

        if( td ) {
            this.setState(
                {
                    buttonColor:      td.btn_bgd_color._background_,
                    titleColor:       td.h1_text_color._color_,
                    messageColor:     td.h2_text_color._color_,
                    backgroundColor:  td.body_color._background_color_
                }
            );
        }
    }

    componentWillMount () {
    }

    componentWillUnmount () {
    }

    componentDidMount () {
    }

    updateTextFields () {
        let tp = this.props.themeProperties;
        let cd = this.props.campaignDetails;

        let fields = {};

        if (tp && tp.entry.form && tp.entry.form.title) {
            fields["campaignTitle"] = {
                value: tp.entry.form.title.value,
                label: "sh_label_campaign_title",
                skill: "basic",
                page: "entry"
            }
        }

        if (tp && tp.entry.form && tp.entry.form.subtitle) {
            fields["campaignMessage"] = {
                value: tp.entry.form.subtitle.value,
                label: "sh_label_campaign_message",
                skill: "basic",
                page: "entry"
            }
        }

        if (tp && tp.form_fields && tp.form_fields.entry && tp.form_fields.entry.email && tp.form_fields.entry.email.placeholder) {
            fields["emailPlaceholder"] = {
                value: i18n.stringFor(tp.form_fields.entry.email.placeholder),
                label: "sh_label_email_placeholder",
                skill: "advanced",
                page: "entry"
            }
        }

        if (tp && tp.entry.form && tp.entry.form.submit) {
            fields["playGameButton"] = {
                value: tp.entry.form.submit.value,
                label: "sh_label_play_button",
                skill: "advanced",
                page: "entry"
            }
        }

        if (tp && tp.entry.form && tp.entry.footer) {
            fields["campaignFooter"] = {
                value: tp.entry.footer.text.value,
                label: "sh_label_campaign_footer",
                skill: "basic",
                page: "entry"
            }
        }

        if (tp && tp.entry.playprompt && tp.entry.playprompt.title) {
            fields["playPromptTitle"] = {
                value: tp.entry.playprompt.title.value,
                label: "sh_label_playprompt_title",
                skill: "advanced",
                page: "game"
            }
        }

        if (tp && tp.entry.playprompt && tp.entry.playprompt.message && tp.entry.playprompt.message[this.props.gameId]) {
            fields["playPromptMessage"] = {
                value: tp.entry.playprompt.message[this.props.gameId].value,
                label: "sh_label_playprompt_message",
                skill: "advanced",
                page: "game"
            }
        }

        if (tp && tp.win && tp.win.title) {
            fields["winnerTitle"] = {
                value: tp.win.title.value,
                label: "sh_label_winner_title_message",
                skill: "basic",
                page: "winner"
            }
        }

        if (tp && tp.win && tp.win.subtitle) {
            fields["winnerSubTitle"] = {
                value: tp.win.subtitle.value,
                label: "sh_label_winner_subtitle_message",
                skill: "basic",
                page: "winner"
            }
        }

        if (tp && tp.win && tp.win.discountcode) {
            fields["winnerCodeLabel"] = {
                value: tp.win.discountcode.value,
                label: "sh_label_winner_code_label",
                skill: "advanced",
                page: "winner"
            }
        }

        if (tp && tp.win && tp.win.cta) {
            fields["winnerCTA"] = {
                value: tp.win.cta.value,
                label: "sh_label_winner_cta",
                skill: "advanced",
                page: "winner"
            }
        }

        return fields;
    }


    onSetImgSource ( data, file ) {
        let type = file.type.split( '/' ).pop();
        let asset = {type, data};

        this.setState( { asset: asset }, function () {
            this.updateGameAndTheme();
        } );
    }

    onRemoveImgSource () {
        let updatedThemeProperties = {...this.props.themeProperties};
        updatedThemeProperties.common.logo.logo_image.value = "";
        this.props.onThemeLogoRemoved(updatedThemeProperties);
    }

    notifyParent() {
        //let params = {}

        //try { params.buttonColor = this.state.buttonColor } catch (ex) {}
        //try { params.titleColor = this.state.titleColor } catch (ex) {}
        //try { params.messageColor = this.state.messageColor } catch (ex) {}
        //try { params.backgroundColor = this.state.backgroundColor } catch (ex) {}
        //try { params.campaignTitle = this.state.textFields.campaignTitle.value } catch (ex) {}
        //try { params.campaignMessage = this.state.textFields.campaignMessage.value } catch (ex) {}
        //try { params.campaignFooter = this.state.textFields.campaignFooter.value } catch (ex) {}
        //try { params.emailPlaceholder = this.state.textFields.emailPlaceholder.value } catch (ex) {}
        //try { params.winnerTitle = this.state.textFields.winnerTitle.value } catch (ex) {}
        //try { params.winnerSubTitle = this.state.textFields.winnerSubTitle.value } catch (ex) {}
        //try { params.winnerCodeLabel = this.state.textFields.winnerCodeLabel.value } catch (ex) {}
        //try { params.winnerCTA = this.state.textFields.winnerCTA.value } catch (ex) {}
        //try { params.font = this.state.font } catch (ex) {}
        //try { params.playGameButton = this.state.textFields.playGameButton.value } catch (ex) {}
        //try { params.playPromptTitle = this.state.textFields.playPromptTitle.value } catch (ex) {}
        //try { params.playPromptMessage = this.state.textFields.playPromptMessage.value } catch (ex) {}

        

        //

        // Grab a copy of the campaign details to mutate.
        let campaignDesign = {...this.props.campaignDetails.integration.campaignDesign};
        let thDescriptor = {...this.props.themeDescriptor};
        let thProperties = {...this.props.themeProperties};

        campaignDesign.buttonColor     = this.state.buttonColor;
        campaignDesign.titleColor      = this.state.titleColor;
        campaignDesign.messageColor    = this.state.messageColor;
        campaignDesign.backgroundColor = this.state.backgroundColor;


        thDescriptor.body_color._background_color_     = this.state.backgroundColor;
        thDescriptor.body_text_color._color_           = this.state.messageColor;
        thDescriptor.h1_text_color._color_             = this.state.titleColor;
        thDescriptor.arrow_anim_color._border_color_   = this.state.titleColor;
        thDescriptor.prize_color._color_               = this.state.titleColor;
        thDescriptor.h2_text_color._color_             = this.state.messageColor;
        thDescriptor.btn_reject_color._color_          = this.state.messageColor;
        thDescriptor.prize_desc._color_                = this.state.messageColor;
        thDescriptor.btn_bgd_color._background_        = this.state.buttonColor;
        thDescriptor.btn_hover_bgd_color._background_  = this.state.buttonColor;
        thDescriptor.link_color._color_                = this.state.messageColor;
        thDescriptor.link_hover_color._color_          = this.state.messageColor;

        thDescriptor.body_font_family._font_family_ = this.state.font;
        thDescriptor.h1_font_family._font_family_   = this.state.font;
        thDescriptor.h2_font_family._font_family_   = this.state.font;

        if (thProperties.entry && thProperties.entry.form && thProperties.entry.form.title) {
            thProperties.entry.form.title.value = this.state.textFields.campaignTitle.value;
        }
        if (thProperties.entry && thProperties.entry.form && thProperties.entry.form.subtitle) {
            thProperties.entry.form.subtitle.value = this.state.textFields.campaignMessage.value;
        }
        if (thProperties.entry && thProperties.entry.footer && thProperties.entry.footer.text) {
            thProperties.entry.footer.text.value = this.state.textFields.campaignFooter.value;
        }
        if (thProperties.win && thProperties.win.title) {
            thProperties.win.title.value = this.state.textFields.winnerTitle.value;
        }
        if (thProperties.win && thProperties.win.subtitle) {
            thProperties.win.subtitle.value = this.state.textFields.winnerSubTitle.value;
        }
        if (thProperties.win && thProperties.win.discountcode) {
            thProperties.win.discountcode.value = this.state.textFields.winnerCodeLabel.value;
        }
        if (thProperties.win && thProperties.win.cta) {
            thProperties.win.cta.value = this.state.textFields.winnerCTA.value;
        }
        // if (thProperties.thankyou && thProperties.thankyou.header && thProperties.thankyou.header.title) {
        //     thProperties.thankyou.header.title.value = params.winnerPageMessage;
        // }
        // if (thProperties.data && thProperties.data.logo) {
        //     thProperties.data.logo.imagePath = params.logo;
        // }
        if (thProperties.entry && thProperties.entry.form && thProperties.entry.form.submit) {
            thProperties.entry.form.submit.value = this.state.textFields.playGameButton.value;
        }
        if (thProperties.entry && thProperties.entry.playprompt && thProperties.entry.playprompt.title) {
            thProperties.entry.playprompt.title.value = this.state.textFields.playPromptTitle.value;
        }
        if (thProperties.entry && thProperties.entry.playprompt && thProperties.entry.playprompt.message && thProperties.entry.playprompt.message[this.props.campaignDetails.selectedGame["game-type"]]) {
            thProperties.entry.playprompt.message[this.props.campaignDetails.selectedGame["game-type"]].value  = this.state.textFields.playPromptMessage.value;
        }
        if (thProperties.form_fields && thProperties.form_fields.entry && thProperties.form_fields.entry.email) {
            thProperties.form_fields.entry.email.placeholder = this.state.textFields.emailPlaceholder.value;
        }
            
        this.props.onUpdate(campaignDesign,thDescriptor,thProperties);
    }

    updateGameAndTheme () {
        let asset = this.state.asset;

        if ( asset ) {
            let fileName = GUID.randomHex() + "." + asset.type;

            // Upload the logo to theme assets
            ThemeStore.uploadAsset( this.props.campaignHash, fileName, asset.data, ( e ) => {
                let updateThemeProperties = {...this.props.themeProperties};
                updateThemeProperties.common.logo.logo_image.value = '/' + e.result[ fileName ].assetPath;
                this.props.onThemeLogoUploaded(updateThemeProperties);
            } );

            // Upload the logo to the game assets
            // In the onGameAssetUploaded method we will need to send a message to the Game Editor to use this.
            let gameAssets = { 
                logo: { 
                    assetFile: 'assets/' + fileName, 
                    assetSrc: asset.data 
                } 
            };

            GameStore.upload( 
                this.props.campaignHash, 
                this.props.campaignDetails.selectedGame["game-type"], 
                this.props.campaignDetails.selectedGame["skin-name"], 
                gameAssets,
                undefined,
                ( e ) => {
                    // TODO: Handle an error
            
                    // Only handle this upload if it includes a logo. Other uploads to the gamae will trigger this event handler.
                    if (e.result && e.result.logo) {
                        this.props.onGameLogoUploaded( e.result.logo.assetFile, e.result.logo.assetPath );
                    }
                }
            );

        }
    }

    onChange ( e) {

        let details = this.props.details;
        details[ e.target.name ] = e.target.value;
        this.props.onChange( details );
    }

    onBackgroundColorChange ( color ) {
        console.log(">>>>>>",color);

        this.setState(
            {
                backgroundColor: color
            },

            function() {
                this.notifyParent()
            }
        );
    }

    onButtonColorChange ( color ) {

        this.setState(
            {
                buttonColor: color
            },

            function() {
                this.notifyParent()
            }
        );
    }

    onMessageColorChange ( color ) {

        this.setState(
            {
                messageColor: color
            },

            function() {
                this.notifyParent()
            }
        );
    }

    onTitleColorChange ( color ) {

        this.setState(
            {
                titleColor: color
            },

            function() {
                this.notifyParent()
            }
        );
    }


    onFontChange(e) {

        let value = e.target.value;
        this.setState( {font:value}, function() {  this.notifyParent() } );
    }

    onTextChange(e) {
        let key   = e.target.name;
        let value = e.target.value;

        let updatedTextFields = { ...this.state.textFields }

        updatedTextFields[key].value = value;

        this.setState( { textFields: updatedTextFields }, function () { this.notifyParent() });
    }

    showColorPicker(e, target) {
        target.show();
    }

    saveTheme(){}
    notifyEditor(a,b,c){}

    generateTextFields ( showAll ) {
        let fields = [];

        for (let key in this.state.textFields) {
            if (showAll || this.state.textFields[key].skill === "basic") {
                fields.push(
                    <div key={key} className="form-group" data-page={this.state.textFields[key].page}>
                        <label className="control-label">{i18n.stringFor(this.state.textFields[key].label)}</label>
                        <input type="text" className="form-control" name={key} id={key} value={this.state.textFields[key].value}
                            onChange={ this.onTextChange } readOnly={this.props.readOnly}/>
                    </div>
                );
            }
        }

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

        let params = {campaignHash: this.props.campaignHash};

        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="sh_label_campaign_design" />
                                </h1>
                                <h3 className="subheading"><String code="sh_label_customize_slideout"/></h3>
                            </div>
                        </div>
                        <div className="panel-body">

                            {/** Data Entry Part **/}
                            <div className="col-sm-5 col-md-6 m-t-2">

                                <div className="form">

                                    {/** Logo Upload Selector **/}
                                    <div className="form-group">
                                        <label className="control-label">{i18n.stringFor( 'label_logo' )}</label>

                                        <ImgFileSelector
                                            onSetImgSource={this.onSetImgSource.bind( this )}
                                            onRemoveImgSource={this.onRemoveImgSource.bind( this )}
                                            imgSource={this.props.campaignDetails.logo} disabled={false}
                                        />
                                    </div>

                                    {/** Font Selector **/}
                                    <div className="form-group">
                                        <label className="control-label">{i18n.stringFor( 'sh_label_font_selector' )}</label>
                                        <FontSelector fonts={this.state.fonts} onChange={this.onFontChange.bind(this)} value={this.props.themeDescriptor.h1_font_family._font_family_} />
                                        <ValidationError response={this.props.lastResponse} field="name" />
                                    </div>

                                    <div className="clearfix" />

                                    {/** Colors - Title, Message, and Button **/}
                                    <div className="form-group m-b-3">

                                        <div className="clearfix" />
                                        <div className="color-ctrl">

                                            {/** Background Color **/}
                                            <div className="color-selector m-b-2">
                                                <div className="pull-left m-r-2">
                                                    <FbColorPicker type="hex" color={this.state.backgroundColor} id='title_color_picker' valueType='hex' min={true} onChange={this.onBackgroundColorChange.bind(this)} />
                                                </div>
                                                <label id='label_background_color' className="color-label">{i18n.stringFor( 'sh_label_background_color' )}</label>
                                            </div>

                                            {/** Title Color **/}
                                            <div className="color-selector m-b-2">
                                                <div className="pull-left m-r-2">
                                                    <FbColorPicker type="hex" color={this.state.titleColor} id='title_color_picker' valueType='hex' min={true} onChange={this.onTitleColorChange.bind(this)} />
                                                </div>
                                                <label id='label_title_color' className="color-label">{i18n.stringFor( 'sh_label_title_text_color' )}</label>
                                            </div>

                                            {/** Message Color **/}
                                            <div className="color-selector m-b-2">
                                                <div className="pull-left m-r-2">
                                                    <FbColorPicker type="hex" color={this.state.messageColor} id='message_color_picker' valueType='hex' min={true} onChange={this.onMessageColorChange.bind(this)} />
                                                </div>
                                                <label id='label_message_color' className="color-label">{i18n.stringFor( 'sh_label_message_text_color' )}</label>
                                            </div>

                                            {/** Button Color **/}
                                            <div className="color-selector m-b-2">
                                                <div className="pull-left m-r-2">
                                                    <FbColorPicker type="hex"  color={this.state.buttonColor}  id='button_color_picker' valueType='hex' value="#000000" name="blah" min={true} onChange={this.onButtonColorChange.bind(this)} />
                                                </div>
                                                <label id='label_button_color' className="color-label">{i18n.stringFor( 'sh_label_button_color' )}</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="m-t-2">
                                        { this.generateTextFields(false) }
                                        <a onClick={this.onEditAllText.bind(this)} style={{ cursor: "pointer", textDecoration: "underline" }}>Edit Additional Text</a>
                                    </div>
                                </div>
                            </div>

                            {/** Preview Part **/}
                            <div className="col-sm-7 col-md-6 m-t-2">
                                {/** ThemePreview for LeadPages **/}
                                <ThemePreview
                                    onRequestSave={this.saveTheme.bind(this)}
                                    selectedTheme={ CampaignStore.validate( 'theme' ) }
                                    gameSelected={this.state.campaignDetails.progress && this.state.campaignDetails.progress.game}
                                    previewSourceReady={this.state.previewSourceReady}
                                    version={this.state.version}
                                    type={this.props.type || 'editor'}
                                    saveRequest={this.notifyEditor.bind( this, 'save', {} )}
                                    campaignHash={this.props.campaignHash}
                                    campaignDetails={this.props.campaignDetails}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                { this.state.showEditAllText ? 
                    <EditAllTextModal 
                        state={this.state}
                        onTextChange={this.onTextChange.bind(this)}
                        fields={ this.generateTextFields(true) }
                        onConfirm={ this.onCloseEditAllText.bind(this) }
                    /> 
                    : null 
                }
            </div>
        )
    }
}

class EditAllTextModal extends React.Component {
    constructor( props ) {
        super( props );
    }

    render() {

        let entryFields = this.props.fields.filter( el => {
            return el.props["data-page"] === "entry";
        } );

        let gamePlayFields = this.props.fields.filter( el => {
            return el.props["data-page"] === "game";
        } );

        let winnerFields = this.props.fields.filter( el => {
            return el.props["data-page"] === "winner";
        } );

        return (
            <div className="flex-modal edit-all-text">
                <div className="flex-modal-shade" onClick={this.props.onConfirm.bind( this )}>
                </div>
                <div className="flex-modal-wrapper">
                    <div className="flex-modal-body">
                        <div className="edit-all-text-group">
                            { entryFields && entryFields.length > 0 ?
                                <div className="edit-all-text-label">{i18n.stringFor("label_theme_page_entry")}</div>
                                :
                                null
                            }

                            { entryFields && entryFields.length > 0 ?
                                entryFields
                                :
                                null
                            }
                        </div>
                        
                        <div className="edit-all-text-group">
                            { gamePlayFields && gamePlayFields.length > 0 ?
                                <div className="edit-all-text-label">{i18n.stringFor("label_theme_page_game")}</div>
                                :
                                null
                            }
                            
                            { gamePlayFields && gamePlayFields.length > 0 ?
                                gamePlayFields
                                :
                                null
                            }
                        </div>
                        
                        <div className="edit-all-text-group">
                            { winnerFields && winnerFields.length > 0 ?
                                <div className="edit-all-text-label">{i18n.stringFor("label_theme_page_winner")}</div>
                                :
                                null
                            }

                            { winnerFields && winnerFields.length > 0 ?
                                winnerFields
                                :
                                null
                            }
                        </div>
                    </div>
                    <div className="flex-modal-footer">
                        <button className="btn btn-primary round modal-button" onClick={this.props.onConfirm.bind( this )}><String code='label_ok'/></button>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = CampaignDetails;
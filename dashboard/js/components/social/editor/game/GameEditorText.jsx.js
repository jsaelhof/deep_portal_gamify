import React from 'react';
import _ from 'underscore';
import i18n from '../../../../store/i18nStore';
import FbColorPicker from '../../../shared/ColorPicker.jsx';
import GameDescriptorUtils from '../../../shared/util/GameDescriptorUtils.js';
import GameEditorExtension_LitePegboard from './GameEditorExtension_LitePegboard.jsx';

class GameEditorText extends React.Component {

    constructor ( props ) {
        super( props );

        this.extension;

        switch (props.gameId) {
            default:
                this.extension = GameEditorExtension_LitePegboard;
                break;
        }
    }

    render () {
        let text = _.map( this.props.gameDescriptor.data.text, ( textData, id ) => {
            // Important: This block first checks to see if this game has an extension for overriding control creation.
            // If it does, it calls it's process method giving it the basics it needs to determine if wants to provide 
            // it's own custom control. If it does it returns the JSX. If not, it should just return undefined which
            // means that we'll use the default control created below.
            if (this.extension) {
                if (this.extension.shouldShowText && !this.extension.shouldShowText(id, textData, this.props.gameDescriptor)) {
                    return null;
                }

                if (this.extension.processText) {
                    let jsx = this.extension.processText( id, textData, this.props.gameDescriptor, this.props.gameLang, this.props.onTextChange );
                    if (jsx) return jsx;
                }
            }

            // DEFAULT HANDLING
            // If we make it this far without returning, then do standard handling rules for the color
            if (textData.skill === "basic") {
                return (
                    <div key={"color_"+id} className="setting">
                        <label id={'label_text_'+id}>{this.props.gameLang.data.text[id].label}</label>
                        <div className="editor-subtext">{this.props.gameLang.data.text[id].desc}</div>
                        <input 
                            data-text={id} 
                            type="text" 
                            id={'text_'+id}
                            className="form-control" 
                            maxLength={ textData.validation.maxchars } 
                            onChange={(event) => { 
                                this.props.onTextChange( event.currentTarget.dataset.text, event.currentTarget.value ) 
                            }} 
                            value={ textData.value }
                        />
                    </div>
                )
            }
        } );

        return <div className="setting-group">{text}</div>;
    }

}

module.exports = GameEditorText
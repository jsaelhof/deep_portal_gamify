import React from 'react';
import _ from 'underscore';
import i18n from '../../../../store/i18nStore';
import FbColorPicker from '../../../shared/ColorPicker.jsx';
import GameDescriptorUtils from '../../../shared/util/GameDescriptorUtils.js';
import GameEditorExtension_LitePegboard from './GameEditorExtension_LitePegboard.jsx';

class GameEditorColors extends React.Component {

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
        let colors = _.map( this.props.gameDescriptor.data.colors, ( colorData, id ) => {

            // Important: This block first checks to see if this game has an extension for overriding control creation.
            // If it does, it calls it's process method giving it the basics it needs to determine if wants to provide 
            // it's own custom control. If it does it returns the JSX. If not, it should just return undefined which
            // means that we'll use the default control created below.
            if (this.extension) {
                if (this.extension.shouldShowColor && !this.extension.shouldShowColor(id, colorData, this.props.gameDescriptor)) {
                    return null;
                }

                if (this.extension.processColor) {
                    let jsx = this.extension.processColor( id, colorData, this.props.gameDescriptor, this.props.gameLang, this.props.onColorChange );
                    if (jsx) return jsx;
                }
            }
            
            // DEFAULT HANDLING
            // If we make it this far without returning, then do standard handling rules for the color
            if (colorData.skill === "basic") {
                return <div key={"color_"+id} className="color-selector setting">
                    <div className="pull-left m-r-2">
                        <FbColorPicker 
                            type="hex" 
                            color={colorData.value} 
                            id={id} 
                            valueType='hex' 
                            min={true} 
                            onChange={ ( color, id ) => { 
                                this.props.onColorChange(id,color) 
                            } }
                        />
                    </div>
                    <label id={'label_color_'+id} className="color-label">{this.props.gameLang.data.colors[id].label}</label>
                </div>
            }
        } );

        return <div className="setting-group">{colors}</div>;
    }

}

module.exports = GameEditorColors
import React from 'react';
import _ from 'underscore';
import i18n from '../../../store/i18nStore';
import FbColorPicker from '../../shared/ColorPicker.jsx';
import GameDescriptorUtils from '../../shared/util/GameDescriptorUtils.js';
import GameEditorExtension_PrizeWheel from './GameEditorExtension_PrizeWheel.jsx';
import GameEditorExtension_LitePegboard from './GameEditorExtension_LitePegboard.jsx';
import GameEditorExtension_LiteScratchcard from './GameEditorExtension_LiteScratchcard.jsx';

class GameEditorProperties extends React.Component {

    constructor ( props ) {
        super( props );

        this.extension;

        switch (props.gameId) {
            case "prizewheel":
                this.extension = GameEditorExtension_PrizeWheel;
                break;
            case "litepegboard":
                this.extension = GameEditorExtension_LitePegboard;
                break;
            case "litescratchcard":
                this.extension = GameEditorExtension_LiteScratchcard;
                break;
        }
    }

    render () {
        let properties = _.map( this.props.gameDescriptor.data.properties, ( propertyData, id ) => {

            // Important: This block first checks to see if this game has an extension for overriding control creation.
            // If it does, it calls it's process method giving it the basics it needs to determine if wants to provide 
            // it's own custom control. If it does it returns the JSX. If not, it should just return undefined which
            // means that we'll use the default control created below.
            if (this.extension) {
                if (this.extension.shouldShowProperty && !this.extension.shouldShowProperty(id, propertyData, this.props.gameDescriptor)) {
                    return null;
                }

                if (this.extension.processProperty) {
                    let jsx = this.extension.processProperty( id, propertyData, this.props.gameDescriptor, this.props.gameLang, this.props.onPropertyChange );
                    if (jsx) return jsx;
                }
            }

            // DEFAULT HANDLING
            // If we make it this far without returning, then do standard handling rules for the color
            if (propertyData.skill === "basic") {
                if ( propertyData.validation.limit ) {
                    let options = propertyData.validation.limit.map( ( option ) => {
                        if (option === propertyData.value) {
                            return <option key={"property_"+id+"_option"} value={option} selected>{this.props.gameLang.data.properties[id].values[option]}</option>
                        } else {
                            return <option key={"property_"+option+"_option"} value={option}>{this.props.gameLang.data.properties[id].values[option]}</option>
                        }
                    } );
                    return <div className="setting">
                                <label id={'label_property_'+id} className="property-label pull-left m-r-2">{this.props.gameLang.data.properties[id].label}</label>
                                <select 
                                    data-property={id} 
                                    id={"property_"+id} 
                                    onChange={ (event) => { 
                                        this.props.onPropertyChange( event.currentTarget.dataset.property, event.currentTarget.value ) 
                                    } } 
                                    className="form-control"
                                    defaultValue={propertyData.value}>
                                    { options }
                                </select>
                            </div>
                } else {
                    console.log("NO CONTROL FOR THIS VALIDATION");
                    return null;
                }
            }
        } );

        return <div className="setting-group">{properties}</div>;
    }

}

module.exports = GameEditorProperties
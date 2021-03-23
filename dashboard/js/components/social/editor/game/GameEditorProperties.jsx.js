import React from 'react';
import _ from 'underscore';
import i18n from '../../../../store/i18nStore';
import FbColorPicker from '../../../shared/ColorPicker.jsx';
import GameDescriptorUtils from '../../../shared/util/GameDescriptorUtils.js';
import GameEditorExtension_LitePegboard from './GameEditorExtension_LitePegboard.jsx';
import NumericTextInput from '../../../shared/NumericTextInput.jsx';
import Hint from '../../../common/Hint.jsx';

class GameEditorProperties extends React.Component {

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
        // Define our groups of settings. By default, there is a "nogroup" group for any settings that are not grouped
        let groups = {
            "nogroup": []
        }

        // Go thorugh the settings and add an array for each group. If it already exists, do not add it again.
        // The array will hold a list of JSX elements for each group
        _.keys(this.props.gameDescriptor.data.properties).forEach( id => {
            let propertyData = this.props.gameDescriptor.data.properties[id];
            if (propertyData.group && !groups[propertyData.group] ) {
                groups[propertyData.group] = [];
            }
        } );


        // Go through the properties again and create each control, assigning it to a group  along the way.
        _.keys(this.props.gameDescriptor.data.properties).forEach( id => {
            let propertyData = this.props.gameDescriptor.data.properties[id];
            let group = groups[ propertyData.group ? propertyData.group : "nogroup" ];

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
                    if (jsx) group.push(jsx);
                }
            }

            // DEFAULT HANDLING
            // If we make it this far without returning, then do standard handling rules for the color
            if (propertyData.skill === "basic" || ( this.props.skills && this.props.skills.indexOf(propertyData.skill) >= 0 ))  {
                if ( propertyData.validation.limit ) {
                    let options = propertyData.validation.limit.map( ( option ) => {
                        let displayText = this.props.gameLang.data.properties[id].values ? this.props.gameLang.data.properties[id].values[option] : option;
                        if (option === propertyData.value) {
                            return <option key={"property_"+id+"_"+option} value={option} selected>{displayText}</option>
                        } else {
                            return <option key={"property_"+id+"_"+option} value={option}>{displayText}</option>
                        }
                    } );

                    group.push(
                        <div className="setting" key={id}>
                            {/* Label */}
                            <label id={'label_property_'+id} className="property-label pull-left m-r-2">{this.props.gameLang.data.properties[id].label}</label>
                            {/* Tooltip */}
                            <Hint placement="right" hint={this.props.gameLang.data.properties[id].desc} nofloat={true} />
                            {/* Control */}
                            <div className="w-200">
                                <select 
                                    data-property={id} 
                                    id={"property_"+id} 
                                    onChange={ (event) => { 
                                        this.props.onPropertyChange( event.currentTarget.dataset.property, event.currentTarget.value ) 
                                    } } 
                                    className="form-control">
                                    { options }
                                </select>
                            </div>
                        </div>
                    );
                } else if ( propertyData.validation.number ) {
                    group.push(
                        <div className="setting" key={id}>
                            {/* Label */}
                            <label id={'label_property_'+id} className="property-label pull-left m-r-2">{this.props.gameLang.data.properties[id].label}</label>
                            {/* Tooltip */}
                            <Hint placement="right" hint={this.props.gameLang.data.properties[id].desc} nofloat={true} />
                            {/* Control */}
                            <div className="w-100">
                                <NumericTextInput 
                                    id={id}
                                    name={"property_"+id} 
                                    value={ propertyData.value } 
                                    allowNegative={true} 
                                    onChange={(id, value) => {
                                        if (propertyData.validation.number.min !== undefined && value < propertyData.validation.number.min) value = propertyData.validation.number.min;
                                        if (propertyData.validation.number.max !== undefined && value > propertyData.validation.number.max) value = propertyData.validation.number.max;
                                        this.props.onPropertyChange( id, value ) 
                                    }}/>
                            </div>
                        </div>
                    );
                } else {
                    console.log("NO CONTROL FOR THIS VALIDATION");
                    group.push( null );
                }
            }
        } );

        return <div className="editor-properties">
            {
                // Loop over the groups and create a div that contains each div for the group.
                // If it's the "nogroup" group, there's no title or description.
                // If any group is empty, do not return it's wrapper or label/description
                _.keys( groups ).map( group => {
                    if (groups[group].length > 0) {
                        return group === "nogroup" ?
                            <div key={group} id={group} className="setting-group">
                                {groups[group]}
                            </div>
                            :
                            <div key={group} id={group} className="setting-group editor-group">
                                <label className="">{this.props.gameLang.data.properties[group].label}</label>
                                <div className="editor-subtext">{this.props.gameLang.data.properties[group].desc}</div>
                                {groups[group]}
                            </div>
                    }
                } )
            }
        </div>;
    }

}

module.exports = GameEditorProperties
import React from 'react';
import GameDescriptorUtils from '../../shared/util/GameDescriptorUtils.js';

module.exports = {
    shouldShowColor: function ( id, colorData, gameDescriptor ) {
        if (colorData.skill === "basic") {
            let usesColorize = gameDescriptor.data.properties.colorize.value;

            let skip = false;
            if (id === "background") {
                let skinData = GameDescriptorUtils.findFileInDescriptor(gameDescriptor,id);
                if (skinData && !skinData.removed) {
                    skip = true;
                }
            } else if (id === "win") {
                let skinData = GameDescriptorUtils.findFileInDescriptor(gameDescriptor,"prizebackground1");
                if (usesColorize || (skinData && !skinData.removed)) {
                    skip = true;
                }
            } else if (id === "lose") {
                let skinData = GameDescriptorUtils.findFileInDescriptor(gameDescriptor,"losebackground");
                if (usesColorize || (skinData && !skinData.removed)) {
                    skip = true;
                }
            } else if ((id === "winText" || id === "loseText") && usesColorize) {
                skip = true;
            } else if (id === "colorize" && !usesColorize) {
                skip = true
            }

            return !skip;
        }
    },

    processColor: function ( id, colorData, gameDescriptor, gameLang, onColorChange) {},

    shouldShowProperty: function () {
        return true;
    },

    processProperty: function ( id, propertyData, gameDescriptor, gameLang, onPropertyChange ) {
        if (propertyData.skill === "basic") {
            if ( propertyData.validation.limit ) {
                if (id === "lightEffects") {
                    let deselectedColorStyle = {
                        width: "30px",
                        height: "30px",
                        margin: "5px",
                        marginBottom: "8px",
                        float: "left",
                        border: "1px solid #CCC",
                        borderRadius: "200px",
                        overflow: "hidden",
                        cursor: "pointer"
                    }

                    let colors = {
                        "Red": "#ea1e1e",
                        "White": "#ffffff",
                        "Green": "#00ce00",
                        "Blue": "#3dadff",
                        "Yellow": "#fffc02",
                        "Teal": "#00eaeb",
                        "Orange": "#ffa500",
                        "Magenta": "#fd6bfd"
                    }

                    let glowColors = {
                        "Red": "#ea1e1e",
                        "White": "#c1c1c1",
                        "Green": "#00ce00",
                        "Blue": "#3dadff",
                        "Yellow": "#b5b300",
                        "Teal": "#00eaeb",
                        "Orange": "#ffa500",
                        "Magenta": "#fd6bfd"
                    }

                    let selectedEdgeColors = {
                        "Red": "#ffc4c4",
                        "White": "#c1c1c1",
                        "Green": "#a3ffa1",
                        "Blue": "#abdbff",
                        "Yellow": "#d2d1b6",
                        "Teal": "#82feff",
                        "Orange": "#fff4e0",
                        "Magenta": "#fdc4fd"
                    }

                    let swatches = propertyData.validation.limit.map( ( option ) => {
                        let c = (option === "Rainbow") ? ["Red","Orange","Yellow","Green","Blue","Magenta"] : option.split("_");
                        if (c.length === 2 && c[1] === "White") c = [c[0]];

                        let swatchSize = 30;
                        let borderRadius = "200px"

                        let selectedColorStyle = {
                            width: swatchSize  + "px",
                            height: swatchSize + "px",
                            marginTop: "8px",
                            marginLeft: "5px",
                            marginRight: "5px",
                            float: "left",
                            transform: "scale(1.2,1.2) translate(0, -2px)",
                            border: "1px solid " + selectedEdgeColors[c[0]],
                            borderRadius: borderRadius,
                            overflow: "hidden",
                            boxShadow: "0 0 10px " + glowColors[c[0]],
                            cursor: "pointer"
                        }

                        let innerShadowStyle = { 
                            width: (swatchSize - 2) + "px",
                            height: (swatchSize - 2) + "px",
                            boxShadow: "inset 3px 3px 3px rgba(0,0,0,0.2)",
                            borderRadius: borderRadius,
                            transform: "translate(0, "+ -(swatchSize-2) +"px)"
                        }

                        let innerHighlightStyle = { 
                            width: (swatchSize - 2) + "px",
                            height: (swatchSize - 2) + "px",
                            boxShadow: "inset 3px 3px 3px rgba(255,255,255,0.2)",
                            borderRadius: borderRadius,
                            transform: "translate(0, "+ -(swatchSize-2) +"px)"
                        }

                        let inner = c.map( ( color ) => {
                            let innerStyle = { 
                                height: (100/c.length)+"%", 
                                backgroundColor: colors[color]
                            }

                            return <div style={innerStyle}></div>
                        } );

                        return <div 
                                    key={"property_"+id+"_"+option}
                                    data-property={id} 
                                    data-option={option}
                                    id={"property_"+id}
                                    className="color-swatch"
                                    style={(option === propertyData.value) ? selectedColorStyle : deselectedColorStyle} 
                                    onClick={ (e) => {
                                        onPropertyChange( e.currentTarget.dataset.property, e.currentTarget.dataset.option );
                                    } }>
                                    {inner}      
                                    { (option === propertyData.value) ? <div style={innerHighlightStyle}></div> : <div style={innerShadowStyle}></div>}
                                </div>
                    } );

                    return <div className="setting">
                        <label id={'label_property_'+id} className="color-label">{gameLang.data.properties[id].label}</label>
                        <div className="game-colors">
                            {swatches}
                        </div>
                        <div className="clearfix"/>
                    </div>
                }
            }
        }
    }
}
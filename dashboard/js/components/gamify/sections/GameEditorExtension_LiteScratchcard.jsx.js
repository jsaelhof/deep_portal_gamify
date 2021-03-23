import React from 'react';
import GameDescriptorUtils from '../../shared/util/GameDescriptorUtils.js';

module.exports = {
    shouldShowColor: function ( id, colorData, gameDescriptor ) {
        if (colorData.skill === "basic") {
            
            let skip = false;
            if (id === "background") {
                let skinData = GameDescriptorUtils.findFileInDescriptor(gameDescriptor,"background");
                if (skinData && !skinData.removed) {
                    skip = true;
                }
            } else if (id === "cover") {
                let skinData = GameDescriptorUtils.findFileInDescriptor(gameDescriptor,"boxcover");
                if (skinData && (skinData.src !== "assets/boxcover_0.png" && skinData.src !== "assets/boxcover_1.png")) {
                    skip = true;
                }
            }

            return !skip;
        }
    },

    processColor: function ( id, colorData, gameDescriptor, gameLang, onColorChange) {},

    shouldShowProperty: function () {
        return true;
    },

    processProperty: function ( id, propertyData, gameDescriptor, gameLang, onPropertyChange ) {}
}
import React from 'react';
import _ from 'underscore';
import i18n from '../../../../store/i18nStore';
import String from '../../../common/String.jsx';
import GameStore from '../../../../store/GameStore';
import GameEditorColors from './GameEditorColors.jsx';
import GameEditorProperties from './GameEditorProperties.jsx';
import GameEditorText from './GameEditorText.jsx';
import GameEditorImage from './GameEditorImage.jsx';

class GameEditor extends React.Component {
    constructor ( props ) {
        super(props);

        this.state = {
            updatedGameDescriptor: undefined
        }

        this.timeoutId;
    }

    getSkills () {
        switch (this.props.skill) {
            case "basic":
            default:
                return ["basic"];
            case "advanced":
                return ["basic","advanced"];
        }
    }

    onColorChange ( id, color ) {
        let updatedGameDescriptor = {...this.props.gameDescriptor};
        updatedGameDescriptor.data.colors[id].value = color;
        this.setState( { updatedGameDescriptor: updatedGameDescriptor }, () => {
            this.scheduleUpdate();
        } );
    }

    onPropertyChange ( id, value ) {
        let updatedGameDescriptor = {...this.props.gameDescriptor};
        updatedGameDescriptor.data.properties[id].value = value;
        this.setState( { updatedGameDescriptor: updatedGameDescriptor }, () => {
            this.scheduleUpdate();
        } );
    }

    onTextChange ( id, value ) {
        let updatedGameDescriptor = {...this.props.gameDescriptor};
        updatedGameDescriptor.data.text[id].value = value;
        this.setState( { updatedGameDescriptor: updatedGameDescriptor }, () => {
            this.scheduleUpdate();
        } );
    }

    onImageChange ( gameDescriptor ) {
        // Note: Unlike the other editor components for text, colors and properties, the image component takes the game descriptor
        // and modifies it directly, passing it out to this handler. In this case, we don't have to add the change into the local 
        // state copy, we can just pass it on up. No need to do the 1 second delay either since this doesn't involve any typing or
        // fast changes.
        this.props.onUpdate( gameDescriptor );
    }

    scheduleUpdate () {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout( () => {
            this.props.onUpdate( this.state.updatedGameDescriptor );
        }, 1000 );
    }

    render () {
        // Check if we have any advanced images to display
        let hasAdvancedImages = _.where(this.props.gameDescriptor.files.skin, { "skill": "advanced", "type": "image" } ).length > 0;

        return (
            <div>
                <GameEditorColors gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.props.gameLang} skills={this.getSkills()} onColorChange={this.onColorChange.bind(this)} />
                <GameEditorProperties gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.props.gameLang} skills={this.getSkills()} onPropertyChange={this.onPropertyChange.bind(this)} />
                <GameEditorText gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.props.gameLang} skills={this.getSkills()} onTextChange={this.onTextChange.bind(this)} />
                
                <label><String code="sh_label_images"/></label>
                <div className="editor-subtext">
                    {i18n.stringFor('sh_label_images_subtext1')}
                    <br/>
                    <i className="material-icons material-icons-align">visibility</i><span className="material-icons-align">{i18n.stringFor('sh_label_images_subtext2')}</span>
                </div>
                <GameEditorImage 
                    game={ this.props.campaignDetails.selectedGame }
                    skills={["basic"]}
                    yaml={this.props.gameLang}
                    descriptor={this.props.gameDescriptor}
                    campaignHash={this.props.campaignHash}
                    features={this.props.campaignDetails.features}
                    onUpdate={this.onImageChange.bind( this )}
                />

                { this.props.skill === "advanced" && hasAdvancedImages ?
                    <div className="m-t-6">
                        <label><String code="sh_label_images_advanced"/></label>

                        <GameEditorImage 
                            game={ this.props.campaignDetails.selectedGame }
                            skills={["advanced"]}
                            yaml={this.props.gameLang}
                            descriptor={this.props.gameDescriptor}
                            campaignHash={this.props.campaignHash}
                            features={this.props.campaignDetails.features}
                            onUpdate={this.onImageChange.bind( this )}
                        />
                    </div>
                    :
                    null
                }
            </div>
        )
    }
}

module.exports = GameEditor;
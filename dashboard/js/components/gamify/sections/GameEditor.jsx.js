import React from 'react';
import _ from 'underscore';
import i18n from '../../../store/i18nStore';
import FbColorPicker from '../../shared/ColorPicker.jsx';
import GameStore from '../../../store/GameStore';
import GameEditorColors from './GameEditorColors.jsx';
import GameEditorProperties from './GameEditorProperties.jsx';
import GameEditorText from './GameEditorText.jsx';

class GameEditor extends React.Component {
    constructor ( props ) {
        super(props);

        this.state = {
            loading: true,
            updatedGameDescriptor: undefined,
            gameLang: undefined
        }

        this.timeoutId;
    }

    componentWillMount () {
        GameStore.addEventListener(this);
    }
    componentDidMount () {
        GameStore.loadLanguageFile(i18n.LANGUAGE, this.props.gameId, this.props.campaignHash);
    }
    componentWillUnmount () {
        GameStore.removeEventListener(this);
    }

    onLanguageFileLoaded ( event ) {
        this.setState( { 
            gameLang: event.yaml,
            loading: false
        } );
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

    scheduleUpdate () {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout( () => {
            this.props.onUpdate( this.state.updatedGameDescriptor );
        }, 1000 );
    }

    render () {
        if (this.state.loading) return null;

        return (
            <div>
                <GameEditorColors gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.state.gameLang} onColorChange={this.onColorChange.bind(this)} />
                <GameEditorProperties gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.state.gameLang} onPropertyChange={this.onPropertyChange.bind(this)} />
                <GameEditorText gameId={this.props.gameId} gameDescriptor={this.props.gameDescriptor} gameLang={this.state.gameLang} onTextChange={this.onTextChange.bind(this)} />
            </div>
        )
    }
}

module.exports = GameEditor;
import React from 'react';
import {browserHistory as History} from 'react-router';

import CampaignStore from '../../../store/CampaignStore';
import ConfigStore from '../../../store/ConfigStore';
import GameStore from '../../../store/GameStore';
import ThemeStore from '../../../store/ThemeStore';
import UserStore from '../../../store/UserStore';
import GameCard from '../../shared/GameCard.jsx';
import NewCampaign from '../../shared/NewCampaign';
import i18n from '../../../store/i18nStore';
import Modal from '../../common/Modal.jsx';
import PreviewModal from '../../common/GamePreviewModal.jsx';
import Loading from '../../shared/Loading.jsx';
import ActionBar from '../../shared/nav/ActionBar.jsx';

class GameChange extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            games: undefined,
            gameInfosLoaded: undefined,
            campaignHash: undefined,
            previewGame: {
                gameId: undefined,
                skinId: undefined
            },
            campaignDetails: undefined,
            showChangeGameModal: false,
            showPreviewModal: false
        }

        this.priority = ["dropper","whackamole","scratchcard","pegboard","runner","bigwheel","memorymatch","match3","spacecommander","doodle","racer","freethrow"];
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        GameStore.addEventListener( this );
    }
    componentDidMount () {
        GameStore.getList( ConfigStore.getProductTag() );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        GameStore.removeEventListener( this );
    }


    onGameListRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
            this.setState( { lastResponse: e.response } );
        } else {
            // Result returns an array of game objects describing each game.
            // Save the whole result to the state's games array.
            // Then ,for every game, load it's game info file to get the display name.

            // First, insert our client-side game display order index into the object.
            e.result.games.map( game => {
                game.details.displayOrder = ConfigStore.getGameDisplayOrder(game.gameKey);
            } );

            // Sort the games based on their displayOrder values
            let sorted = e.result.games.sort( ( a, b ) => {
                if (parseInt(a.details.displayOrder) < parseInt(b.details.displayOrder)) {
                    return - 1;
                } else {
                    return 1;
                }
            } );

            // Filter out any games that the integration config file has excluded.
            let filtered = sorted.filter( game => {
                if (!ConfigStore.isGameExcluded( game.gameKey )) {
                    return game;
                }
            } );

            this.setState( { games: filtered }, () => {
                e.result.games.forEach( game => {
                    GameStore.getGameInfo( game.gameKey );
                } );
            } );
        }
    }

    onGameInfoLoaded ( e ) {
        // Grab a copy of the games array to modify. We'll insert the game display name from the game info file.
        let games = [ ...this.state.games ];

        // For each game, find the game object that matches this game info file (compare gameId)
        games.forEach( game => {
            if ( game.gameKey === e.data.name ) {
                // Add the display name.
                game.displayName = e.data.game.displayName;
                
                // Store the update games array back in state
                this.setState( { games: games }, () => {
                    // Check if all games have a display name yet. When they do, all game infos have been loaded and handled.
                    let gameInfosLoaded = this.state.games.filter( game => !game.displayName ).length === 0;

                    // Once all game infos are loaded, update the state. The game selection list can now render and wait for the user to select.
                    if (gameInfosLoaded) {
                        this.setState( { gameInfosLoaded: true } )
                    }
                } );
            }
        } )
    }

    onGameSelect ( gameId, skinId ) {
        this.setState( { showChangeGameModal: true }, () => {
            CampaignStore.sendGetCampaignDetails(this.props.params.campaignHash, ( campaignDetailsResponse ) => {
                this.setState( {
                    campaignVersion: campaignDetailsResponse.result.version,
                    campaignDetails: campaignDetailsResponse.result.details
                }, () => {
                    if (campaignDetailsResponse.hasErrors()) {
                        ErrorStore.rpcResponseError(campaignDetailsResponse);
                    } else {
                        // Check if they picked the same game they already had. 
                        // If so, don't reset it...just send them back to the editor and leave everything alone.
                        if (gameId === campaignDetailsResponse.result.details.selectedGame["game-type"]) {
                            History.push(ConfigStore.buildRoutePath("edit/" + this.props.params.campaignHash));
                        } else {
                            this.setState( 
                                { campaignHash:this.props.params.campaignHash, campaignDetails:campaignDetailsResponse.result.details },
                                () => {
                                    GameStore.selectGame( gameId, skinId, i18n.LANGUAGE, this.state.campaignHash, this.state.campaignDetails, this.state.campaignVersion );
                                }
                            );
                        }
                    }
                } );
            });
        } );
    }

    // Game has been selected, select the theme next
    onGameChanged ( e ) {
        this.setState( { showChangeGameModal: false } );
        History.push(ConfigStore.buildRoutePath("edit/" + this.props.params.campaignHash + "?needsPreview=true"));
    }


    onNavClick ( id ) {
        switch (id) {
            case "cancel":
                History.push(ConfigStore.buildRoutePath("edit/" + this.props.params.campaignHash));
                break;
        }
    }

    onGamePreview ( gameId, skinId ) {
        this.setState( { previewGame: { gameId:gameId, skinId:skinId }, showPreviewModal: true } );
    }

    onClosePreview () {
        this.setState({ showPreviewModal:false });
    }

    getOrientationForGame ( gameId ) {
        var orientation = "portrait";
        this.state.games.forEach((element) => {
            if (element.gameKey === gameId) {
                orientation = element.details.orientation;
            }
        });
        return orientation;
    }

    render () {
        // If the game list hasn't been retrieved yet, show the loading component. Otherwise render the game selector
        if (!this.state.games || !this.state.gameInfosLoaded) { return ( 
            <Loading modal={false} /> 
        ); }

        return (
            <div>
                <ActionBar buttonGroup="gamechange" onClick={this.onNavClick.bind(this)} hideDashboard={true} />
                <div className="action-bar-spacer"/>
                
                <div className="create-row">
                    <div className="create-type">
                        <div className="create-label">
                            <h2>Select Your Game</h2>
                            <div>Try out all the games and choose your favorite for your campaign!</div>
                        </div>

                        <div className="game-select">
                            {
                                this.state.games.sort( (game1, game2) => {
                                    let index1 = this.priority.indexOf(game1.gameKey);
                                    let index2 = this.priority.indexOf(game2.gameKey);
                                    if (index1 < index2) {
                                        return -1;
                                    } else if (index1 > index2) {
                                        return 1;
                                    } else {
                                        return 0;
                                    }
                                } ).map( ( game ) => {
                                    if (this.priority.indexOf(game.gameKey) >= 0) {
                                        return (
                                            <GameCard 
                                                key={game.gameKey}
                                                gameId={game.gameKey}
                                                skinId={ConfigStore.getGameDefaultSkin(game.gameKey)}
                                                fallbackPreviewSkinId={game.details.default}
                                                displayName={game.displayName}
                                                orientation={this.getOrientationForGame(game.gameKey)}
                                                onGameSelect={(gameId, skinId) => this.onGameSelect(gameId, skinId)}
                                                onGamePreview={(gameId, skinId) => this.onGamePreview(gameId, skinId)}
                                            />
                                        )
                                    }
                                })
                            }
                        </div>
                    </div>
                </div>
                { this.state.showChangeGameModal ? <Loading modal={true} title={i18n.stringFor('sh_label_change_game_label')} message={i18n.stringFor('sh_label_create_campaign_subtext')} /> : null }
                { this.state.showPreviewModal ? <PreviewModal show={true} onHide={this.onClosePreview.bind( this )} scenario="bigwin" onCloseClicked={this.onClosePreview.bind( this )} gameSrc={GameStore.resourceSrcPath( this.state.previewGame.gameId, this.state.previewGame.skinId, "&preview=true" )} orientation={this.getOrientationForGame(this.state.previewGame.gameId)} /> : null }     
            </div>
        )
    }
}

module.exports = GameChange;
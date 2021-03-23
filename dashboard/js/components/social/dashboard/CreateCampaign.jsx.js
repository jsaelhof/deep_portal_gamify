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
import Constants from '../../shared/Constants';

class CreateCampaign extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            games: undefined,
            themes: undefined,
            gameInfosLoaded: undefined,
            campaignHash: undefined,
            selectedGame: {
                gameId: undefined,
                skinId: undefined
            },
            previewGame: {
                gameId: undefined,
                skinId: undefined
            },
            selectedTheme: {
                template: undefined,
                theme: undefined
            },
            campaignDetails: undefined,
            showCreateCampaignModal: false,
            showPreviewModal: false
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        GameStore.addEventListener( this );
        ThemeStore.addEventListener( this );
    }
    componentDidMount () {
        GameStore.getList( ConfigStore.getProductTag() );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        GameStore.removeEventListener( this );
        ThemeStore.removeEventListener( this );
    }

    onNavClick ( id ) {
        switch (id) {
            case "cancel":
                History.push(ConfigStore.getDashboardRoute());
                break;
        }
    }

    onCampaignRegistered ( e ) {
        if (e.response && e.response.hasErrors()) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.saveCampaignAndSelectGame( e.response.result.campaignHash, e.response.result.version, e.response.result.details );
        }
    }

    // Game has been selected, select the theme next
    onGameChanged ( e ) {
        // This sucks...we have to go get the campaign details again because the GameStore updates the campaign internally.
        // The game store should be re-written to stop trying to alter the campaign.
        // Instead, we have to grab the latest campaign details again here so that we can find the correct version for the next update that gets done later in the flow.
        CampaignStore.sendGetCampaignDetails(this.state.campaignHash, ( campaignDetailsResponse ) => {
            this.setState( {
                campaignVersion: campaignDetailsResponse.result.version,
                campaignDetails: campaignDetailsResponse.result.details
            }, () => {
                // Download the template version file to get the latest version.
                // We'll need this to initialize the theme.
                let templateVersion;

                ThemeStore.getThemeVersionFile( this.state.selectedTheme.template, ( themeVersionData ) => {
                    templateVersion = themeVersionData.current;

                    // Store these in state for now. The next time this flow sends a campaign update we need to add this.
                    // I dont want to add another update call here so i'm saving them till later.
                    this.setState( {
                        templateVersion: templateVersion
                    }, () => {
                        ThemeStore.initializeTheme( this.state.campaignHash, this.state.selectedTheme.theme, this.state.selectedTheme.template, templateVersion );
                    } );
                } );
            } );
        } );
    }

    // Theme has been sleected, go to the editor
    onThemeInitialized ( e ) {
        ThemeStore.getThemeDescriptor(this.state.campaignHash);
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
                filtered.forEach( game => {
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

                    // Once all game infos are loaded, update the state and proceed to loading the theme list.
                    if (gameInfosLoaded) {
                        this.setState( { gameInfosLoaded: true }, () => {
                            ThemeStore.getList( ConfigStore.getProductTag() );
                        } )
                    }
                } );
            }
        } )
    }

    onThemeListRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState( { 
                themes: e.response.result.themes,
                selectedTheme: {
                    theme: ConfigStore.getDefaultTheme(),
                    template: ConfigStore.getDefaultTemplate()
                }
            } );
        }
    }

    onThemeDescriptorRetrieved ( e ) {
        let details = {...this.state.campaignDetails};
        
        // Pull the default forms from the themedescriptor and set it in the campaign details.
        // This initializes the campaign with whatever default form fields the theme dictates.
        details.forms = e.theme.defaultforms;

        // We need to set the template and client versions in the campaign details.
        // These are used when we make '/campaign/custom/theme/publish' calls to re-template the index file.
        // Currently i'm doing this because we need to call publish when the social sharing post info changes so that the template's opengraph info gets updated.
        // They maybe used later for other things.
        details.versions = {
            template: this.state.templateVersion,
            client: this.state.clientVersion
        }

        this.setState( { 
            campaignDetails: details
        }, () => {
            CampaignStore.sendCampaignUpdate( this.state.campaignHash, this.state.campaignDetails, this.state.campaignVersion, () => {
                this.setState( { showCreateCampaignModal: false } );
                History.push(ConfigStore.buildRoutePath("edit/" + this.state.campaignHash + "?needsPreview=true"));
            } );
        } );
    }

    onGameSelect ( gameId, skinId ) {
        // Remember the selected game.
        // We'll need this after the new campaign is created in order to use the GameStore.selectGame method
        this.setState( 
            { 
                selectedGame: { 
                    gameId: gameId, 
                    skinId: skinId
                }, 
                showCreateCampaignModal: true 
            }, () => {
                // Check if there is a campaign hash passed in. If so, there is already a campaign created and it needs the game and theme added to it.
                // If not, then there is no campaign yet so we need to create it first.
                if (this.props.params.campaignHash) {
                    this.updateExistingCampaign();
                } else {
                    this.createCampaign();
                }
            }
        );
    }

    createCampaign () {
        // The flow from here is:
        // 1. CampaignStore.sendCampaignRegister to create the new campaign (RPC: register)
        // 2. onCampaignRegistered fires when completed.
        // 3. In onCampaignRegisterd, call GameStore.selectGame to choose the game. This will send the message (RPC: initialize)
        //      and will also internally send a campaign update (RPC: update). Both trigger events but we care about the second.
        // 4. onGameSkinInitialized is fired when complete. When fired, we need to initialize the theme on the server.
        // 5. onThemeInitialized is fired when complete. When fired, we need to get the theme descriptor so that we can get the default data collection fields that are assigned to it
        //      and add them to the campaign details. This requires we then call CampaignStore.sendCampaignUpdate.

        // Register the campaign with these details
        let newDetails = NewCampaign.defaultDetails();

        this.insertAdditionalDetails( newDetails );

        CampaignStore.sendCampaignRegister( newDetails, ConfigStore.getProductTag() );
    }

    updateExistingCampaign () {
        CampaignStore.sendGetCampaignDetails(this.props.params.campaignHash, ( campaignDetailsResponse ) => {
            if (campaignDetailsResponse.hasErrors()) {
                ErrorStore.rpcResponseError(campaignDetailsResponse);
            } else {
                this.insertAdditionalDetails( campaignDetailsResponse.result.details );
                this.saveCampaignAndSelectGame( this.props.params.campaignHash, campaignDetailsResponse.result.version, campaignDetailsResponse.result.details );
            }
        });
    }

    // Whether we create a new campaign or have been given one that was created by the API (meaning there was no game or theme set yet),
    // we need to update the details with some additional social-specifi information.
    insertAdditionalDetails ( details ) {
        //  Add social specific default details

        // Add product information
        details.product = {
            type: Constants.PRODUCT_SOCIAL
        }

        // Add notifications node
        details.notifications = {
            campaign:{
                default: true
            }
        }

        // Add the default loss information.
        // Since there are no prizes by default, it is set to 100% with an arbitrary weight of 100.
        details.loss = {
            weight: 100,
            lossPercent: 100
        }

        // If not already set, add the themeInfo for the default theme.
        details.themeInfo = {
            name: this.state.selectedTheme.theme,
            layout: this.state.selectedTheme.template
        }

        // Add mail integration info if it exists
        let user = UserStore.getImmutableState().userDetails;
        if (user.mailIntegration) {
            details.communication = user.mailIntegration.communication;
            details.forms = user.mailIntegration.forms;
        }
    }

    // Whether we just registered a new campaign or retrieved the details of an existing campaign, we need to save the campaign details returned to state and then do the game select step.
    saveCampaignAndSelectGame ( campaignHash, campaignVersion, campaignDetails ) {
        this.setState( 
            { 
                campaignHash:campaignHash, 
                campaignDetails:campaignDetails,
                campaignVersion:campaignVersion
            },
            () => {
                GameStore.selectGame( this.state.selectedGame.gameId, this.state.selectedGame.skinId, i18n.LANGUAGE, this.state.campaignHash, this.state.campaignDetails, this.state.campaignVersion );
            }
        );
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
        if (!this.state.games || !this.state.selectedTheme || !this.state.gameInfosLoaded) { return ( 
            <Loading modal={false} /> 
        ); }

        return (
            <div>
                <ActionBar buttonGroup="newcampaign" onClick={this.onNavClick.bind(this)} />
                <div className="action-bar-spacer"/>
                
                <div className="create-row">
                    <div className="create-type">
                        <div className="create-label">
                            <h2>Select Your Game</h2>
                            <div>Try out all the games and choose your favorite for your campaign!</div>
                        </div>

                        <div className="game-select">
                            {
                                this.state.games.map( ( game ) => {
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
                                })
                            }
                        </div>
                    </div>
                </div>

                { this.state.showCreateCampaignModal ? <Loading modal={true} title={i18n.stringFor('sh_label_create_campaign_label')} message={i18n.stringFor('sh_label_create_campaign_subtext')} /> : null }
                { this.state.showPreviewModal ? <PreviewModal show={true} onHide={this.onClosePreview.bind( this )} scenario="bigwin" onCloseClicked={this.onClosePreview.bind( this )} gameSrc={GameStore.resourceSrcPath( this.state.previewGame.gameId, this.state.previewGame.skinId, "&preview=true" )} orientation={this.getOrientationForGame(this.state.previewGame.gameId)} /> : null }     
            </div>
        )
    }
}

module.exports = CreateCampaign;
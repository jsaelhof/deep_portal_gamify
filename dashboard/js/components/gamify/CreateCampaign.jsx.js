import React from 'react';
import {browserHistory as History} from 'react-router';

import CampaignStore from '../../store/CampaignStore';
import ConfigStore from '../../store/ConfigStore';
import GameStore from '../../store/GameStore';
import ThemeStore from '../../store/ThemeStore';
import UserStore from '../../store/UserStore';
import GameSkinCard from '../shared/GameSkinCard.jsx';
import NewCampaign from '../shared/NewCampaign';
import i18n from '../../store/i18nStore';
import PreviewModal from '../common/GamePreviewModal.jsx';
import Loading from '../shared/Loading.jsx';
import ActionBar from '../shared/nav/ActionBar.jsx';
import Constants from '../shared/Constants';

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
            selectedTemplate: undefined,
            selectedTheme: undefined,
            campaignDetails: undefined,
            showCreateCampaignModal: false,
            showPreviewModal: false,
            selectedThemeFilter: "all"
        }

        this.calculateSkinsPerRow = this.calculateSkinsPerRow.bind(this);
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        GameStore.addEventListener( this );
        ThemeStore.addEventListener( this );

        window.addEventListener("resize", this.calculateSkinsPerRow);
    }
    componentDidMount () {
        //GameStore.getList( ConfigStore.getProductTag() );
        ThemeStore.getList( ConfigStore.getProductTag() );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        GameStore.removeEventListener( this );
        ThemeStore.removeEventListener( this );

        window.removeEventListener("resize", this.calculateSkinsPerRow);
    }

    /**
     * Figure out how many skins will fit on a row.
     * This requires knowledge of CSS styling.
     * 170 is the width of a single portrait skin. If this changes in css for any reason this calc will not work.
     * We also need to know which element to measure and it must be on the DOM.
     * This is called on every window resize AND once manually when switching to the game/skin select view.
     * TODO: If this is ever needed for a landscape game, we'd have to calculate two values...one for portrait and one for landscape...and then each block of skins would have to check it's orientation to know which value to use. 
     */
    calculateSkinsPerRow ( event ) {
        this.setState( {
            skinsPerRow: Math.floor($(".theme-type").width() / 170)
        } );
    }

    onNavClick ( id ) {
        switch (id) {
            case "cancel":
                History.push(ConfigStore.getDashboardRoute());
                break;
        }
    }

    onThemeListRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
            this.setState( { lastResponse: e.response } );
        } else {
            // Result returns an array of template objects describing each template.
            // Save the whole result to the state's template array.

            // First, insert our client-side template display order index into the object.
            e.response.result.themes.map( template => {
                template.details.displayOrder = ConfigStore.getTemplateDisplayOrder(template.templateKey);

                // Remove the server's old display_index (so we aren't confused by it anywhere).
                // Add our theme display order value in so we can sort the themes.
                template.themes.map( theme => {
                    delete theme.details.display_index;
                    theme.details.displayOrder = ConfigStore.getTemplateSkinDisplayOrder(template.templateKey, theme.themeKey);
                } );
            } );

            // Sort the templates based on their displayOrder values
            let sorted = e.response.result.themes.sort( this.sortDisplayOrder );

            // Filter out any templates that the integration config file has excluded.
            let filtered = sorted.filter( template => {
                if (!ConfigStore.isTemplateExcluded( template.templateKey )) {
                    return template;
                }
            } );

            // Sort the themes in the filtered list.
            filtered.map( template => {
                let sortedThemes = template.themes.sort( this.sortDisplayOrder );

                // Replace the unsorted list with the sorted one.
                template.themes = sortedThemes;
            } );

            this.setState( { 
                templates: filtered,
                selectedTemplate: filtered[0].templateKey // TODO: Should check ConfigStore for default template and skin. Would need to see if the default we have is included in the list from the server.
            }, () => {
                GameStore.getList( ConfigStore.getProductTag() );
            } );
        }
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

                game.skins.map( skin => {
                    skin.details.displayOrder = ConfigStore.getSkinDisplayOrder(game.gameKey, skin.skinKey);
                } );
            } );

            // Sort the games based on their displayOrder values
            let sorted = e.result.games.sort( this.sortDisplayOrder );

            // Filter out any games that the integration config file has excluded.
            let filtered = sorted.filter( game => {
                if (!ConfigStore.isGameExcluded( game.gameKey )) {
                    return game;
                }
            } );

            
            // Sort the skins in each game
            filtered.map( game => {
                game.skins = game.skins.sort( this.sortDisplayOrder );
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

                // Add the display name for each skin.
                game.skins.forEach( skin => {
                    skin.displayName = e.data.skins[skin.skinKey].displayName;
                } );
                
                // Store the update games array back in state
                this.setState( { games: games }, () => {
                    // Check if all games have a display name yet. When they do, all game infos have been loaded and handled.
                    let gameInfosLoaded = this.state.games.filter( game => !game.displayName ).length === 0;

                    // Once all game infos are loaded, update the state and proceed to loading the theme list.
                    if (gameInfosLoaded) {
                        this.setState( { gameInfosLoaded: true })
                    }
                } );
            }
        } )
    }


    onThemeSelect ( themeId ) {
        this.setState( 
            { 
                selectedTheme: themeId
            }, () => {
                this.calculateSkinsPerRow();
            }
        );
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

                ThemeStore.getThemeVersionFile( this.state.selectedTemplate, ( themeVersionData ) => {
                    templateVersion = themeVersionData.current;

                    // Store these in state for now. The next time this flow sends a campaign update we need to add this.
                    // I dont want to add another update call here so i'm saving them till later.
                    this.setState( {
                        templateVersion: templateVersion
                    }, () => {
                        ThemeStore.initializeTheme( this.state.campaignHash, this.state.selectedTheme, this.state.selectedTemplate, templateVersion );
                    } );
                } );
            } );
        } );
    }

    // Theme has been sleected, go to the editor
    onThemeInitialized ( e ) {
        ThemeStore.getThemeDescriptor(this.state.campaignHash);
    }

    

    onThemeDescriptorRetrieved ( e ) {
        let themeDescriptor = e.theme;

        // Save the theme descriptor to the server.
        // We arent waiting for this...just moving on to the next stuff
        // Someday if we ever fix saving to have proper callbacks we should wait for this to complete.
        ThemeStore.saveThemeDescriptor(
            this.state.campaignHash,
            this.state.campaignDetails.themeInfo.name,
            this.state.campaignDetails.themeInfo.layout,
            themeDescriptor
        );

        // Grab the campaign details so we can update it with info about the theme.
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

        // Add product information
        details.product = {
            type: Constants.PRODUCT_SLIDEOUT
        }

        // Add Slideout specific default details
        details.integration = {
            uiConfig: {
                pullTab: {
                    enabled: true,
                    icon: '/dashboard/images/integration/gift.png',
                    tab: '/dashboard/images/integration/tab_orange.png'
                },
                slideOut: {
                    desktop: {
                        enabled: true,
                        showOnLeaveIntent: {
                            enabled: true
                        },
                        showAfterDelay: {
                            enabled: true,
                            delay: 30
                        }
                    },
                    mobile: {
                        enabled: true,
                        showOnLeaveIntent: {
                            enabled: false
                        },
                        showAfterDelay: {
                            enabled: true,
                            delay: 30
                        }
                    }
                },
                urlFiltering: {
                    operators: ['contain', 'does not contain'],
                    filters: []
                },
                prizeBar: {
                    enabled: true,
                    countdown: 15,
                    position: 'pageTop',
                    positions: ['pageTop', 'pageBottom']
                }
            },
            campaignDesign: {
                titleColor: '#000000',
                buttonColor: '#000000',
                messageColor: '#000000',
                backgroundColor: '#000000'
            },
            leadPageDetails: [],
            advancedSettings: {
                cookie: {
                    duration: 30,
                    resetDate: ''
                },
                autoInjectCouponSet: true,
                googleMobileFriendlySet: true
            },
            emailIntegrations: []
        }

        // Add the slideout schedule node
        details.schedule = {
            monday: {
                enabled: true
            },
            tuesday: {
                enabled: true
            },
            wednesday: { 
                enabled: true
            },
            thursday: {
                enabled: true
            },
            friday: {
                enabled: true
            },
            saturday: {
                enabled: true
            },
            sunday: {
                enabled: true
            }
        }

        // Add notifications node
        details.notifications = {
            campaign: {
                before_start: false,
                before_end: false,
                on_start: false,
                on_end: false,
                on_cancel: false,
                on_schedule: false,
                on_unschedule: false,
                on_award: true,
                on_award_draw: true
            }
        }

        // If not already set, add the themeInfo for the default theme.
        details.themeInfo = {
            name: this.state.selectedTheme,
            layout: this.state.selectedTemplate
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

    onThemeFilterSelect ( selectedThemeFilter ) {
        this.setState({
            selectedThemeFilter: selectedThemeFilter
        });
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

    /**
     * @param invert Inverts the returned list. Instead of returning themes that have matching tags it returns all the ones that don't. This allows the function to be called twice, once inverted and once not, resulting in a complete list.
     */
    getThemesToDisplay ( invert ) {
        let template;

        this.state.templates.forEach(t => {
            if (t.templateKey === this.state.selectedTemplate) template = t;
        });

        return (
            template.themes.map( theme => {
                let tagsForTheme = ConfigStore.getTemplateSkinTags(template.templateKey,theme.themeKey);
                let showTheme = tagsForTheme.indexOf(this.state.selectedThemeFilter) >= 0;
                if (invert) showTheme = !showTheme;

                if (showTheme) {
                    return( <div className={"theme-preview theme-preview-"+template.templateKey.split("-")[0]} onClick={this.onThemeSelect.bind(this,theme.themeKey)}>
                                <div className="theme-preview-img-wrap">
                                    <img src="/dashboard/images/create/bottomshadow.png"/>
                                    <img src={"/dashboard/images/create/themepreview_"+ theme.themeKey +".jpg"} width={ invert ? "200px" : "250px" } />
                                </div>
                                <div>
                                    <button className="btn btn-primary round">{ConfigStore.getTemplateSkinDisplayName(template.templateKey,theme.themeKey)}</button>
                                </div>
                            </div>  )
                }
            } ).filter( el => el !== undefined )
        )
    }

    getSkinsToDisplay ( game ) {
        // Split the skins array for this game into two groups...those tagged by the current filter and those not tagged.
        // Sort each array based on the display order.
        // Then join the two arrays with the tagged in front of the untagged.
        let tagged = game.skins.filter( skin => ConfigStore.getGameSkinTags( game.gameKey, skin.skinKey ).indexOf(this.state.selectedThemeFilter) >= 0 ).sort( this.sortDisplayOrder );
        let untagged = game.skins.filter( skin => ConfigStore.getGameSkinTags( game.gameKey, skin.skinKey ).indexOf(this.state.selectedThemeFilter) < 0 ).sort( this.sortDisplayOrder );
        let skins = tagged.concat(untagged);

        // Return an array of game skin components.
        let components = [];

        // How many are returned are based on three cases.
        // 1. They have clicked "Show More": Show All the skins.
        // 2. There are fewer skins than a single row size so they will all fit: Show all the skins
        // 3. There are more skins that will fit on a single row: Show as many as will fit minus one so that we have room for the show more button.
        skins.map( (skin, index) => {
            if ( this.state[`showMore${game.gameKey}`] || game.skins.length <= this.state.skinsPerRow || (game.skins.length > this.state.skinsPerRow && index < this.state.skinsPerRow - 1) ) {
                components.push (
                    <GameSkinCard 
                        key={skin.skinKey}
                        gameId={game.gameKey}
                        skinId={skin.skinKey}
                        fallbackPreviewSkinId={game.details.default}
                        displayName={game.displayName}
                        skinDisplayName={skin.displayName}
                        orientation={this.getOrientationForGame(game.gameKey)}
                        onGameSelect={(gameId, skinId) => this.onGameSelect(gameId, skinId)}
                        // onGamePreview={(gameId, skinId) => this.onGamePreview(gameId, skinId)}
                    />
                )
            }
        } )

        // If we are not showing all for this game and there are hidden skins, add the show all button.
        if (!this.state[`showMore${game.gameKey}`] && game.skins.length > this.state.skinsPerRow) {
            components.push(
                <GameSkinCard 
                    key={"More"}
                    gameId={game.gameKey}
                    actAsShowMoreButton={true}
                    orientation={this.getOrientationForGame(game.gameKey)}
                    onShowMore={this.onShowMore.bind(this)}
                    additionalSkins={skins.length - components.length}
                />
            );
        } 
        
        return components;
    }

    onShowMore ( gameId ) {
        // Set a flag called showMore<GameId> to true to indicate the "Show More" button was clicked.
        this.setState( {
            [`showMore${gameId}`]: true
        } )
    }

    sortDisplayOrder (a,b) {
        if (parseInt(a.details.displayOrder) < parseInt(b.details.displayOrder)) {
            return - 1;
        } else {
            return 1;
        }
    }

    isThemeOrGameTagged ( tag ) {
        // Figure out whether the selected theme has a skin tagged with this tag.
        let template;

        this.state.templates.forEach(t => {
            if (t.templateKey === this.state.selectedTemplate) template = t;
        });

        let taggedThemes = template.themes.filter( theme => ConfigStore.getTemplateSkinTags( template.templateKey, theme.themeKey ).indexOf(tag) >= 0);

        // Figure out whether any games have a skin tagged with this tag.
        let taggedGames = this.state.games.filter(game => {
            return game.skins.filter( skin => ConfigStore.getGameSkinTags( game.gameKey, skin.skinKey ).indexOf(tag) >= 0 );
        });

        // Given the two arrays, return the largest length.
        // Essentially, if either one has a non-zero length
        return Math.max(taggedThemes.length,taggedGames.length) > 0;
    }

    countTaggedGames ( tag ) {
        let template;

        this.state.templates.forEach(t => {
            if (t.templateKey === this.state.selectedTemplate) template = t;
        });

        let taggedThemes = template.themes.filter( theme => ConfigStore.getTemplateSkinTags( template.templateKey, theme.themeKey ).indexOf(tag) >= 0);
        return taggedThemes.length;
        
        let taggedGames = game.skins.filter( skin => ConfigStore.getGameSkinTags( game.gameKey, skin.skinKey ).indexOf(tag) >= 0 );
        return taggedThemes.length;
    }

    render () {
        // If the game list hasn't been retrieved yet, show the loading component. Otherwise render the game selector
        if (!this.state.games || !this.state.templates || !this.state.gameInfosLoaded) { return ( 
            <Loading modal={false} /> 
        ); }

        return (
            <div>
                <ActionBar buttonGroup="newcampaign" onClick={this.onNavClick.bind(this)} />
                <div className="action-bar-spacer"/>

                { 
                    this.state.selectedTemplate && !this.state.selectedTheme ?
                        <div className="create-title">
                            <h2>Select Your Theme</h2>
                            <div>Choose a theme for your Gamified Display</div>
                        </div>
                        :
                        null
                }
                { 
                    this.state.selectedTemplate && this.state.selectedTheme ?
                        <div className="create-title">
                            <h2>Select Your Game</h2>
                            <div>Try out all the games and choose your favorite for your campaign!</div>
                        </div>
                        :
                        null
                }
                
                <div className="theme-row">
                    <div className="theme-filter">
                        <ul>
                            { 
                                Object.keys(Constants.TAGS).map( key => {
                                    if (key === "all" || this.isThemeOrGameTagged(key)) {
                                        return <li 
                                                key={key} 
                                                className={ key === this.state.selectedThemeFilter ? "theme-filter-selected" : ""} 
                                                onClick={this.onThemeFilterSelect.bind(this, key)}
                                                >
                                                    {Constants.TAGS[key]}
                                                </li>
                                    }
                                } )
                            }
                        </ul>
                    </div>

                    <div className="vertical-divider"/>

                    { this.state.selectedTemplate && !this.state.selectedTheme ?
                        <div className="theme-type">

                            {/* Show Featured Themes if not set on All */}
                            {
                                this.state.selectedThemeFilter !== "all" && this.getThemesToDisplay().length > 0 ?
                                    <div>
                                        <div className="theme-category"><h3>Featured Themes</h3></div>
                                        <div className="theme-cards theme-cards-wrap">
                                        { 
                                            this.getThemesToDisplay()
                                        }
                                        </div>
                                    </div>
                                    :
                                    null
                            }


                            {/* Show additional themes. For "all", this contains all the themes. For other filters, this needs to filter out anything that matches the featured themes for this filter. */}
                            <div>
                                {/* Only show this heading if it's not on "all" */}
                                { this.state.selectedThemeFilter !== "all" && this.getThemesToDisplay().length > 0 ? <div className="theme-category m-t-10"><h3>Additional Themes</h3></div> : null }

                                <div className="theme-cards theme-cards-wrap">
                                { 
                                    this.getThemesToDisplay(true)
                                }
                                </div>
                            </div>
                        </div>
                        :
                        null
                    }
                        


                    {
                        this.state.selectedTemplate && this.state.selectedTheme ?
                            <div className="theme-type">
                                <div className="game-select game-select-left">
                                    {
                                        this.state.games.map( ( game ) => {
                                            return (
                                                <div className="game-select-game m-b-10">
                                                    <div className="game-select-label">
                                                        <div>{ game.displayName }</div> 
                                                        <button className="btn btn-primary round" onClick={this.onGamePreview.bind(this, game.gameKey, ConfigStore.getGameDefaultSkin(game.gameKey))}>Preview Game</button>
                                                    </div>

                                                    <div className="game-select-skins">
                                                    {
                                                        this.getSkinsToDisplay( game )
                                                    }
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                            :
                            null
                    }
                </div>
                
                { this.state.showCreateCampaignModal ? <Loading modal={true} title={i18n.stringFor('sh_label_create_campaign_label')} message={i18n.stringFor('sh_label_create_campaign_subtext')} /> : null }
                { this.state.showPreviewModal ? <PreviewModal show={true} onHide={this.onClosePreview.bind( this )} scenario="bigwin" onCloseClicked={this.onClosePreview.bind( this )} gameSrc={GameStore.resourceSrcPath( this.state.previewGame.gameId, this.state.previewGame.skinId, "&preview=true" )} orientation={this.getOrientationForGame(this.state.previewGame.gameId)} /> : null }     
            </div>
        )
    }
}

module.exports = CreateCampaign;
import React from 'react';
import String from '../../../common/String.jsx.js';
import CampaignGamePreview from '../../../shared/CampaignGamePreview.jsx';
import GameStore from '../../../../store/GameStore';
import GameEditor from './GameEditor.jsx';
import i18n from '../../../../store/i18nStore';
import PreviewModal from '../../../common/GamePreviewModal.jsx';
import ConfigStore from '../../../../store/ConfigStore';
import {browserHistory as History} from 'react-router';
import _ from 'underscore';

class BasicGameEditor extends React.Component {
    constructor ( props ) {
        super( props );

        this.previewFront = {
            zIndex: 0
        }

        this.previewBack = {
            zIndex: -1
        }

        this.state = {
            initLoad: true,
            gameLang: undefined,
            gameDescriptor: undefined,
            layout: undefined,
            skinInfo: undefined,
            skill: "basic",
            showPreviewModal: false,
            previewTimestamp1: Date.now(), // This timestamp is simply a unique number, associated with the preview 1 component, that can be changed when we want that component to refresh (which reloads the preview)
            previewTimestamp2: Date.now(), // Same as the timestamp above but for the preview 2 component.
            previewPointer: 1, // This pointer tells the component which of the two preview windows to target when refreshing the preview
            preview1Style: this.previewFront, // This is the style currently assigned to preview 1. It will either be set to front or back.
            preview2Style: this.previewBack // This is the style currently assigned to preview 2. It will either be set to front or back.
        }

        this.previewFirstLoad = true // This flag is used to make sure that we don't double render on initialization. It makes sure that until the first preview loads, the second preview component will not load anything and the refreshing message will not display.
        this.previewRefreshId; // This is passed into the preview (which appends it to the url) to control when the object tag refreshes. If the url doesn't change, react doesn't reload it.
        this.dirtyPreview; // Tracks whether something has occurred that would cause the preview window to need to be re-rendered.

        if (!props.gameId || !this.props.skinId) {
            // FIXME: Handle the error
            console.log("ERROR Incomplete Game information @ GameEditor");
        }

        // This method will be called by the game preview core to get the latest unsaved game descriptor for use when previewing.
        window.deep = window.deep || {};
        window.deep.getUpdatedGameDescriptor = () => {
            return JSON.stringify(this.state.gameDescriptor);
        }
        window.deep.getUpdatedLayout = () => {
            return JSON.stringify(this.state.layout);
        }

        // This post-message handler listens for messages from the game preview.
        // The coreGameReady event tells us that the preview has loaded successfully. It's ok to show it now.
        this.onPostMessage = this.onPostMessage.bind(this);
        window.addEventListener("message", this.onPostMessage);
    }
    componentWillMount () {
        GameStore.addEventListener( this );

    }
    componentDidMount () {
        GameStore.loadLanguageFile(i18n.LANGUAGE, this.props.gameId, this.props.campaignHash);
    }
    componentWillUnmount () {
        GameStore.removeEventListener( this );
        clearTimeout(this.previewRefreshId);
        window.removeEventListener("message", this.onPostMessage);
        window.deep.getUpdatedGameDescriptor = undefined;
        window.deep.getUpdatedLayout = undefined;
    }

    componentWillReceiveProps ( newProps ) {
        // If the component is being updated, check if there is a different logo coming in.
        // If so, we need to update it in the game descriptor and set up to re-render with the logo in place.
        if (newProps.logo !== this.props.logo) {
            // Get an copy of the game descriptor to update.
            let gameDescriptor = {...this.state.gameDescriptor};

            // Apply the logo
            this.applyLogoToGameDescriptor(gameDescriptor, newProps.logo); 
            
            this.setState( {
                gameDescriptor: gameDescriptor
            }, () => {
                // Mark the preview as dirty
                this.dirtyPreview = true;

                // Update the parent with the game descriptor changes.
                this.update();
            })
        }
    }

    onLanguageFileLoaded ( event ) {
        this.setState( { 
            gameLang: event.yaml
        }, () => {
            GameStore.getGameInfo(this.props.gameId);
        } );
    }

    onPostMessage (event) {
        if (event.data) {
            try {
                let data = JSON.parse(event.data);
                if (data.deepapi && data.mode === "preview") { // Check if this is our message body AND that this message is coming from the preview window (not the live game previewv modal). Ignore if not.
                    if (data.id && data.id === "coreGameReady") {
                        if (!this.previewFirstLoad) {
                            this.setState( {
                                refreshing: false,
                                preview1Style: (this.state.previewPointer === 1) ? this.previewFront : this.previewBack,
                                preview2Style: (this.state.previewPointer === 1) ? this.previewBack : this.previewFront
                            })
                        } else {
                           this.previewFirstLoad = false;
                        }

                        // Event.source is the window that sent the post message. We want to post a message back to it to take a screenshot.
                        // It will respond with another post message back containing the screenshot data.
                        event.source.postMessage(JSON.stringify({ id:"screenshot" }), "*");
                    }
                    else if (data.id && data.id === "screenshot") {
                        this.updateScreenshot( data.data.image );
                    }
                }
            } catch (ex) {}
        }
    }

    applyLogoToGameDescriptor ( gameDescriptor, logoSrc ) {
        // Create (or append to) a new object in the descriptor to track whether this game 
        // has had an "auto" logo inserted into it. This will be used when switching skins
        // to update the new skin with the logo that was previously uploaded.
        gameDescriptor.info = gameDescriptor.info || {};
        gameDescriptor.info.autoLogo = logoSrc;

        // Set the logo as the src in any relevant elements in the game.
        gameDescriptor.files.skin.filter( ( e ) => e.logo && e.logo.auto ).forEach( elm => elm.src = logoSrc );

        // If the game has a loader, update any relevant elements in the loader as well.
        if (gameDescriptor.files.loader) {
            gameDescriptor.files.loader.forEach( e => e.src = logoSrc );
        }
    }

    onGameInfoLoaded ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle Error
        } else {
            this.setState( {
                skinInfo: e.data.skins
            }, () => {
                GameStore.loadDescriptor( 
                    this.props.gameId, 
                    this.props.skinId, 
                    this.props.campaignHash
                );
            } )
        }
    }

    onDescriptorLoaded ( e ) {
        if (!this.state.gameDescriptor) {
            this.setState( { "gameDescriptor": e.state }, () => {
                GameStore.getDetailsForGame( this.props.gameId, ConfigStore.getProductTag() );
            } );
        }
    }

    onGameDetailsRetrieved ( e ) {
        if ( e.hasErrors() ) {
            // TODO: Show the error
        } else {
            this.setState( { "gameDetails": e.result.game, initLoad: false } );
        }
    }

    // Send changes to the parent which will re-render the component.
    update ( updatedBaseSkinId ) {
        this.props.onUpdate(
            this.state.gameDescriptor, 
            (updatedBaseSkinId) ? updatedBaseSkinId : this.props.baseSkinId
        );
        this.schedulePreviewRefresh();
    }

    updateScreenshot ( data ) {
        this.props.onUpdateScreenshot( data );
    }

    /**
     * This method schedules a reload of the preview component.
     * It first cancels any previous pending refresh and starts a new one.
     * As long as new refresh events come in quick enough, the preview will not 
     * refresh. This prevents refreshing to frequently and batches multiple changes
     * into a single refresh.
     */
    schedulePreviewRefresh () {
        clearTimeout(this.previewRefreshId);
        this.previewRefreshId = setTimeout( () => {
            if (this.dirtyPreview) {
                this.dirtyPreview = false;

                // If the previewFirstLoad is false it means the first preview hasn't event loaded yet.
                // This was initially related to the GameAndPrizeEditor in the slideout editor.
                // Until the first preview loads, ignore updating the other preview panel.
                // I'm not 100% sure this the best way to handle this but i can't figure out a better solution and this works for now.
                if (!this.previewFirstLoad) {
                    let stateUpdate = {};
                    stateUpdate.previewPointer = (this.state.previewPointer === 1) ? 2 : 1;
                    stateUpdate[ "previewTimestamp" + stateUpdate.previewPointer ] = Date.now();
                    stateUpdate.refreshing = true;
                    this.setState(stateUpdate);
                }
            }
        }, 1000 );
    }

    getSkinOptions () {
        let options = [];

        let skins = _.keys(this.state.skinInfo);
        
        let sorted = skins.sort( (a,b) => {
            if ( ConfigStore.getSkinDisplayOrder(this.props.gameId, a) > ConfigStore.getSkinDisplayOrder(this.props.gameId, b) ) {
                return 1;
            } else {
                return 0;
            }
        } );

        sorted.forEach( skin => {
            // Check if the skin has been excldued by the integration config
            if (!ConfigStore.isSkinExcluded(this.props.gameId, skin)) {
                if (this.state.skinInfo.hasOwnProperty(skin)) {
                    if (skin === this.props.baseSkinId) {
                        options.push( <option key={'select_'+skin} value={skin} selected>{this.state.skinInfo[skin].displayName}</option> );
                    } else {
                        options.push( <option key={'select_'+skin} value={skin}>{this.state.skinInfo[skin].displayName}</option> );
                    }
                }
            }
        } )
        return options;
    }

    onSkinChange ( event ) {
        // Store the game descriptor and layout files for whichever skin they pick.
        // This is important because we don't want to actually call the server to change the skin.
        // If we do, it can't be undone. We want users to be able to quickly try different skins
        // and not commit until they hit save.
        // The layout file must be grabbed in addition to the descriptor because the layout is also
        // skin specific. We'll download both and then when the preview loads, it'll ask by calling 
        // the window.deep.getUpdateGameDescriptor and window.deep.getUpdatedLayout methods above.
        let newGameDescriptor, newLayout;

        // Store this skin name as the new base skin. We need to update this too so that the component
        // knows the currently selected base-skin.
        let newBaseSkinId = event.currentTarget.value;

        // Load the game descriptor for the new skin.
        this.loadGameResource( "skins/" + newBaseSkinId + "/gamedescriptor.json", (data) => {
            newGameDescriptor = data;

            // Figure out if the current game descriptor has an auto logo assigned to it already.
            // If so, we have to make sure we set that logo in the new skin.
            if (this.state.gameDescriptor.info && this.state.gameDescriptor.info.autoLogo) {
                this.applyLogoToGameDescriptor(newGameDescriptor, this.state.gameDescriptor.info.autoLogo);
            }

            // Load the layout file.
            this.loadGameResource( "skins/" + newBaseSkinId + "/layout.json", (data) => {
                newLayout = data;                

                // Mark the preview as dirty so it reloads
                this.dirtyPreview = true;
                
                // Set the data from both files and then call update.
                // We'll send the updated baseSkin and the update method always rebuilds an
                // updated game descriptor to include for saving.
                this.setState( {
                    gameDescriptor: newGameDescriptor,
                    layout: newLayout
                }, () => {
                    this.update( newBaseSkinId );
                } )
            } );
        } );
    }

    onGameEditorUpdate ( updatedGameDescriptor ) {
        this.setState( {
            gameDescriptor: updatedGameDescriptor,
        }, () => {
            this.dirtyPreview = true;
            this.update();
        } );
    }
    
    loadGameResource (path, success, retry) {
        $.ajax({
            type: 'GET',
            url: '/play/games/' + this.props.gameId + "/" + path + '?nocache=' + Math.random( 9999 ),
            success: (data) => {
                if (success) {
                    success(data);
                }
            },
            error: (xhr, status, error) => {
                if (retry === undefined) retry = 0; 
                if (retry < 5) {
                    this.loadGameResource(gameId, path, retry+1);
                } else {
                    // TODO: throw an error
                }
            }
        });
    };

    onToggleAdvanced () { 
        this.setState({ skill: this.state.skill === "basic" ? "advanced" : "basic" }, () => {
            this.dirtyPreview = true;
            this.schedulePreviewRefresh();
        });
    }

    onPreview () {
        this.setState( { showPreviewModal: true } );
    }

    onClosePreview () {
        this.setState( { showPreviewModal:false } );
    }

    onChangeGame () {
        History.push(ConfigStore.buildRoutePath('gamechange/'+this.props.campaignHash));
    }

    render () {
        let gameId = this.props.gameId;
        let skinId = this.props.skinId;

        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div>
                            <div className="panel-heading">
                                <div className="panel-heading-label">
                                    <h1>
                                        {i18n.stringFor('sh_label_game_editor')}
                                    </h1>
                                    <h3 className="subheading">{i18n.stringFor('sh_label_subtext_social_game_editor')}</h3>
                                </div>

                                <div className="form-inline m-r-8" style={{ fontSize: "12px" }}>
                                    <div className="form-group">
                                        <div>
                                            <input type="checkbox"
                                                id='advancedToggle'
                                                data-switch="color"
                                                disabled={false}
                                                name='advancedToggle'
                                                onChange={this.onToggleAdvanced.bind(this)}
                                                defaultChecked={this.state.skill === "advanced"}
                                            />
                                            <label htmlFor={'advancedToggle'} className="m-b-0">&nbsp;</label>
                                        </div>
                                    </div>

                                    <div className="form-group m-r-2 m-l-2">
                                        Advanced Mode
                                    </div>
                                </div>

                                <div className="panel-actions">
                                    <button className="btn btn-default-alt round" onClick={this.onChangeGame.bind(this)}>Change Game</button>
                                </div>
                            </div>
                            
                            { this.state.initLoad ?
                                <div className="panel-body">
                                    <h4><String code='label_loading' /></h4>
                                </div>
                                :
                                <div className="panel-body">
                                    <div className={"editor-controls-"+this.state.gameDetails.details.orientation}>
                                        {/* Create the skin dropdown */}
                                        <label><String code="sh_label_theme"/></label>
                                        <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_theme_change_warning')}</div>
                                        <div className="setting-group">
                                            <div className="setting w-400">
                                                <select name="skin" onChange={this.onSkinChange.bind(this)} className="form-control">
                                                    { this.getSkinOptions() }
                                                </select>
                                            </div>
                                        </div>

                                        {/* Add the game editing capabilities */}
                                        <GameEditor 
                                            gameId={gameId} 
                                            skinId={skinId} 
                                            campaignHash={this.props.campaignHash} 
                                            campaignDetails={this.props.campaignDetails} 
                                            gameDescriptor={this.state.gameDescriptor} 
                                            gameLang={this.state.gameLang}
                                            skill={this.state.skill}
                                            onUpdate={this.onGameEditorUpdate.bind(this)} 
                                        />
                                    </div>
                                    
                                    <aside className={"preview-window-" + this.state.gameDetails.details.orientation + " preview-window"}>
                                        <div id="main" className="game ">
                                            <div id="game-wrapper" className="game-wrapper">
                                                <div id="preview1" className="preview-game" style={this.state.preview1Style}>
                                                    <CampaignGamePreview gameId={gameId} skinId={skinId} timestamp={this.state.previewTimestamp1} skill={this.state.skill} id="1"/>
                                                </div>
                                                { !this.previewFirstLoad ? 
                                                    <div id="preview2" className="preview-game" style={this.state.preview2Style}>
                                                        <CampaignGamePreview gameId={gameId} skinId={skinId} timestamp={this.state.previewTimestamp2} skill={this.state.skill} id="2"/>
                                                    </div> 
                                                    : null
                                                }
                                                { 
                                                    this.state.refreshing ? 
                                                    <div style={
                                                        { 
                                                            backgroundColor: "rgba(255,255,255,0.5)", 
                                                            width: "100%", height: "100%", 
                                                            position: "absolute", 
                                                            zIndex: "1"
                                                        }
                                                    }>
                                                        <div style={{
                                                            textAlign: "center",
                                                            width: "100%",
                                                            marginTop: this.state.gameDetails.details.orientation === "portrait" ? "315px" : "195px",
                                                            fontWeight: "bold",
                                                            color: "#FFF",
                                                            textShadow: "2px 2px rgba(0,0,0,0.35)"
                                                        }}>
                                                        {i18n.stringFor('sh_label_refreshing_preview')}
                                                        </div>
                                                    </div> 
                                                    : null 
                                                }
                                            </div>
                                        </div>
                                        <div className="preview-button">
                                            <button className="btn btn-success round m-t-2" onClick={this.onPreview.bind(this)}>Preview Game</button>
                                        </div>
                                    </aside>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                { this.state.showPreviewModal ? 
                    <PreviewModal 
                        show={true} 
                        onHide={this.onClosePreview.bind( this )} 
                        scenario="bigwin" 
                        onCloseClicked={this.onClosePreview.bind( this )} 
                        gameSrc={GameStore.srcPath( this.props.campaignHash, this.props.gameId, this.props.skinId, "&preview=true&exitRedirect=reload" )} 
                        orientation={this.state.gameDetails.details.orientation} 
                    /> 
                    : null 
                } 
            </div>
        );

    }

}

module.exports = BasicGameEditor
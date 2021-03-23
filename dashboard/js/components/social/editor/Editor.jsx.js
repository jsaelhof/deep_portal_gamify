import React from 'react';
import {browserHistory as History} from 'react-router';
import CampaignStore from '../../../store/CampaignStore';
import ThemeStore from '../../../store/ThemeStore';
import BasicGameEditor from './game/BasicGameEditor.jsx';
import ThemeEditor from '../../shared/editor/theme/ThemeEditor.jsx';
import ProjectSetup from '../../shared/editor/project/ProjectSetup.jsx';
import GameStore from '../../../store/GameStore';
import UserStore from '../../../store/UserStore';
import i18n from '../../../store/i18nStore';
import SaveStatus from '../../shared/SaveStatus.jsx';
import Loading from '../../shared/Loading.jsx';
import CampaignValidation from '../../shared/util/CampaignValidation';
import ValidationWarningModal from '../../shared/ValidationWarningModal.jsx';
import ActionBar from '../../shared/nav/ActionBar.jsx';
import CampaignActivator from '../../shared/activation/CampaignActivator.jsx';
import ErrorStore from '../../../store/ErrorStore';
import ConfigStore from '../../../store/ConfigStore';
import PreviewUtils from '../../shared/util/PreviewUtils';
import InstantWin from './prize/InstantWin.jsx';
import DrawPrize from '../../shared/editor/prize/DrawPrize.jsx';
import EveryoneWins from '../../shared/editor/prize/EveryoneWins.jsx';
import ImageStore from '../../../store/ImageStore';
import Tracking from './tracking/Tracking.jsx';
import Schedule from './schedule/CampaignSchedule.jsx';
import Social from './social/Social.jsx';
import Order from './prize/Order.jsx';
import DataCollection from '../../shared/editor/datacollection/DataCollection.jsx';
import GrandPrizeDraw from '../../shared/editor/grandprize/GrandPrizeDraw.jsx';
import SubscriptionManager from '../../shared/payment/SubscriptionManager.jsx';
import LocalStorageStore from '../../../store/LocalStorageStore';
import Constants from '../../shared/Constants';
import _ from 'underscore';

class Editor extends React.Component {

    constructor ( props ) {

        super( props );

        this.state = {
            lastResponse: null,
            currentCampaignDetails: null,
            currentCampaign: null,
            gameDescriptor: null,
            campaignHash: this.props.params.campaignHash,
            authorizationUrl: null,
            previewSourceReady: true,
            version: 'latest',
            campaignProjectName: null,
            themeDescriptor: null,
            dirty: undefined,
            saving: false,
            gameLogoSrc: undefined,
            screenshot: undefined,
            needsPreview: props.location.query.needsPreview,
            validationErrors: undefined,
            showActivationWarning: false,
            showPreviewWarning: false,
            showCancelWarning: false,
            requiresThemePublish: false
        }
    }

    componentWillMount () {
        // Set the tab we should go to when the user hits the dashboard button (or any other way that gets them to the dashboard).
        // This will usually already be set to this value but there are cases like routing to the editor by creating a new campaign that may result in a different dashboard tab.
        LocalStorageStore.set( "dashboardTab", Constants.PRODUCT_SOCIAL );

        // ***** HANDLE WARNING THE USER ABOUT UNSAVED CHANGES ********

        // Handle user trying to go to a different website
        window.onbeforeunload = (e) => {
            if ( this.state.dirty ) {
                let message = i18n.stringFor('sh_label_unsaved_changes');
                (e || window.event).returnValue = message; // IE
                return message; // Everyone else
            }
        }

        // Handle user changing react routes (which does not create an onbeforeunload event)
        this.unregisterLeaveHook = this.props.router.setRouteLeaveHook(
            this.props.route,
            ( next ) => {
                if (this.state.dirty) {
                    return i18n.stringFor('sh_label_unsaved_changes');
                } else {
                    return true;
                }
            }
        );

        // *************************************************************

        CampaignStore.addEventListener(this);
        GameStore.addEventListener(this);
        ThemeStore.addEventListener(this);
    }

    componentDidMount (){
        ThemeStore.getThemeDescriptor(this.props.params.campaignHash);
    }

    componentWillUnmount () {
        window.onbeforeunload = undefined;
        this.unregisterLeaveHook = undefined;
        CampaignStore.removeEventListener( this );
        GameStore.removeEventListener( this );
        ThemeStore.removeEventListener(this);
    }

    onThemeDescriptorRetrieved (e) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState({
                themeDescriptor: e.theme
            }, () => {
                CampaignStore.sendGetCampaignDetails(this.props.params.campaignHash);
            } );
        }
    }

    onCampaignDetailsRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            this.setState(
                {
                    currentCampaignDetails: e.state.details,
                    currentCampaign: e.state
                },
                () => {
                    // Check if the query string has validateAssist=true.
                    // If so, we were directed here from the dashboard because of a validation error.
                    // Validate the campaign and set scrollToError to the first error. Each component 
                    // of the editor can handle whether it cares about this error and how to scroll the UI
                    // to where the error is.
                    if (this.props.location.query.validateAssist) {
                        let validationErrors = CampaignValidation.validateSocial(this.state.currentCampaignDetails, this.state.currentCampaign.status);
                    
                        if (validationErrors.length > 0) {
                            // Wrap this in a 500ms timeout because sometimes the DOM doesn't seem to have the div with the ID needed ready to scroll to yet. 
                            // This is a bit hacky but seems to improve the reliability a lot when being redirected from the dashboard.
                            setTimeout( () => {
                                this.setState({
                                    scrollToError: {...validationErrors[0]}
                                })
                            }, 500 );
                        }
                    }
                }
            );
        }
    }

    onCampaignUpdated ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            // Campaign was updated...remember the latest version of the campaign details.
            this.setState(
                {
                    currentCampaignDetails: e.state.details,
                    currentCampaign: e.state
                }
            );
        }
    }

    onNavClick ( id ) {
        switch (id) {
            case "save":
                this.save();
                break;
            case "savepreview":
                this.saveAndPreview();
                break;
            case "activate":
                this.saveAndActivate();
                break;
            case "cancelcampaign":
                this.activator.cancelCampaign(this.state.currentCampaign);
                break;
        }
    }

    save () {
        // Update the campaign details timestamp (if it exists...it should but old campaigns that don't have it can't be set)
        var updatedDetails = {...this.state.currentCampaignDetails};
        if (!updatedDetails.timestamps) updatedDetails.timestamps = {};
        updatedDetails.timestamps.modified = Date.now();

        // Save the timestamp and prize image updates back to the campaign details
        this.setState( {currentCampaignDetails: updatedDetails, saving: true}, () => {
            // Save the details to the server
            CampaignStore.sendCampaignUpdate(this.state.campaignHash, this.state.currentCampaignDetails, this.state.currentCampaign.version);
            
            // Save the game descriptor to the server
            let assets = { gameDescriptor: this.state.gameDescriptor };
            GameStore.saveCustomSkin( assets, this.state.currentCampaignDetails.selectedGame[ 'game-type' ], this.state.currentCampaignDetails.selectedGame[ 'original-skin' ], this.state.campaignHash );

            // Save the screenshot to the game
            this.saveScreenshot();

            // Save the theme descriptor to the server
            ThemeStore.saveThemeDescriptor(
                this.state.campaignHash,
                this.state.currentCampaignDetails.themeInfo.name,
                this.state.currentCampaignDetails.themeInfo.layout,
                this.state.themeDescriptor,
                () => {
                    // If required, re-publish the theme, then reset the flag for it.
                    // This has be done AFTER the theme descriptor is updated since the process uses the latest theme descriptor on the server.
                    if (this.state.requiresThemePublish) {
                        ThemeStore.publish(
                            this.state.campaignHash,
                            this.state.currentCampaignDetails.versions.template,
                            this.state.currentCampaignDetails.versions.client
                        )

                        this.setState( { requiresThemePublish: false } );
                    }
                }
            );

            setTimeout( () => {
                this.setState( { saving: false, dirty: false } );
            }, 2500 );
        });
    }

    saveAndPreview () {         
        // Update the campaign details timestamp (if it exists...it should but old campaigns that don't have it can't be set)
        var updatedDetails = {...this.state.currentCampaignDetails};
        if (!updatedDetails.timestamps) updatedDetails.timestamps = {};
        updatedDetails.timestamps.modified = Date.now();

        let newState = { currentCampaignDetails: updatedDetails, saving: true };

        let validationErrors = CampaignValidation.validateSocial(this.state.currentCampaignDetails, this.state.currentCampaign.status, true);

        // Define the save procedures to prevent repition in the handling below
        let save = () => {

            // Save the details to the server
            CampaignStore.sendCampaignUpdate(this.state.campaignHash, this.state.currentCampaignDetails, this.state.currentCampaign.version);

            // Save the game descriptor to the server
            let assets = { gameDescriptor: this.state.gameDescriptor };
            GameStore.saveCustomSkin( assets, this.state.currentCampaignDetails.selectedGame[ 'game-type' ], this.state.currentCampaignDetails.selectedGame[ 'original-skin' ], this.state.campaignHash );

            // Save the screenshot to the game
            this.saveScreenshot();

            // Save the theme descriptor to the server
            ThemeStore.saveThemeDescriptor(
                this.state.campaignHash,
                this.state.currentCampaignDetails.themeInfo.name,
                this.state.currentCampaignDetails.themeInfo.layout,
                this.state.themeDescriptor,
                () => {
                    // If required, re-publish the theme, then reset the flag for it.
                    // This has be done AFTER the theme descriptor is updated since the process uses the latest theme descriptor on the server.
                    if (this.state.requiresThemePublish) {
                        ThemeStore.publish(
                            this.state.campaignHash,
                            this.state.currentCampaignDetails.versions.template,
                            this.state.currentCampaignDetails.versions.client
                        )

                        this.setState( { requiresThemePublish: false } );
                    }
                }
            );
        }


        // If valid, open the window and save.
        // If invalid, still save but don't open the window.
        if (validationErrors.length === 0) {
            // Open the preview window.
            // This has to be done immediately to avoid the popup blocker.
            // This forwards to our preview "stub" page which handles waiting until the save is ready.
            // NOTE: CURRENTLY THERE IS NO REAL WAITING FOR SAVE...THE PAGE JUST WAITS 2.5 SECONDS.
            // If the window is closed or undefined, open a new one.
            // If it's still open from a previous save and preview attempt, it will reload.

            let previewUrl = PreviewUtils.getPreviewUrl( Constants.PRODUCT_SOCIAL, this.state.campaignHash, true, UserStore.isFeatureAuthorized(Constants.PRODUCT_SOCIAL,"activate") );
            
            if (this.state.previewWindow && !this.state.previewWindow.closed) {
                this.state.previewWindow.location = previewUrl;
                this.state.previewWindow.focus();
            } else {
                var previewWindow = window.open(previewUrl,"_blank");
                this.setState({ previewWindow: previewWindow });
            }

            // Save the timestamp back to the campaign details
            this.setState( newState, () => {
                save();

                // Set the timeout to fake it until we get actual save events working
                setTimeout( () => {
                    this.setState( { saving: false, dirty: false } );
                }, 2500 );
            });
        } else {
            // I'm cancelling showing the saving modal here
            // Since we know there's errors, just show them right way.
            // This still saves but behind the scenes.
            // The save could be removed if we don't want them to save until valid on this button. 
            // (they can still always save invalid when using the "Save" button...it's just a matter of whether "Save & Preview" should do all or nothing or do Save and cancel preview if invalid)
            newState.validationErrors = validationErrors;
            newState.showPreviewWarning = true;
            newState.saving = false;
            newState.dirty = false;
            this.setState( newState, () => {
                save();
            } );
        }
    }

    saveAndActivate () {
        // Update the campaign details timestamp (if it exists...it should but old campaigns that don't have it can't be set)
        var updatedDetails = {...this.state.currentCampaignDetails};
        if (!updatedDetails.timestamps) updatedDetails.timestamps = {};
        updatedDetails.timestamps.modified = Date.now();

        let newState = { currentCampaignDetails: updatedDetails, saving: true };

        let validationErrors = CampaignValidation.validateSocial(this.state.currentCampaignDetails, this.state.currentCampaign.status);

        // Define the save procedures to prevent repition in the handling below
        let save = () => {
            // Save the details to the server
            CampaignStore.sendCampaignUpdate(this.state.campaignHash, this.state.currentCampaignDetails, this.state.currentCampaign.version);

            // Save the game descriptor to the server
            let assets = { gameDescriptor: this.state.gameDescriptor };
            GameStore.saveCustomSkin( assets, this.state.currentCampaignDetails.selectedGame[ 'game-type' ], this.state.currentCampaignDetails.selectedGame[ 'original-skin' ], this.state.campaignHash );

            // Save the screenshot to the game
            this.saveScreenshot();

            // Save the theme descriptor to the server
            ThemeStore.saveThemeDescriptor(
                this.state.campaignHash,
                this.state.currentCampaignDetails.themeInfo.name,
                this.state.currentCampaignDetails.themeInfo.layout,
                this.state.themeDescriptor,
                () => {
                    // If required, re-publish the theme, then reset the flag for it.
                    // This has be done AFTER the theme descriptor is updated since the process uses the latest theme descriptor on the server.
                    if (this.state.requiresThemePublish) {
                        ThemeStore.publish(
                            this.state.campaignHash,
                            this.state.currentCampaignDetails.versions.template,
                            this.state.currentCampaignDetails.versions.client
                        )

                        this.setState( { requiresThemePublish: false } );
                    }
                }
            );
        }


        // If valid, open the window and save.
        // If invalid, still save but don't open the window.
        if (validationErrors.length === 0) {
            this.setState( newState, () => {
                save();

                // Set the timeout to fake it until we get actual save events working
                setTimeout( () => {
                    this.setState( { saving: false, dirty: false }, () => {
                        if (UserStore.isFeatureAuthorized(Constants.PRODUCT_SOCIAL,"activate")) {
                            this.activator.activate( this.state.currentCampaign, Constants.PRODUCT_SOCIAL );
                        } else {
                            // Show subscribe dialog
                            this.subscriptionManager.showSubscribeDialog();
                        }
                    } );
                }, 2500 );
            } );
        } else {
            // I'm cancelling showing the saving modal here
            // Since we know there's errors, just show them right way.
            // This still saves but behind the scenes.
            // The save could be removed if we don't want them to save until valid on this button. 
            // (they can still always save invalid when using the "Save" button...it's just a matter of whether "Save & Preview" should do all or nothing or do Save and cancel preview if invalid)
            newState.validationErrors = validationErrors;
            newState.showActivationWarning = true;
            newState.saving = false;
            newState.dirty = false;
            this.setState( newState, () => {
                save();
            } );
        }
    }

    onPaymentAuthorizationReceived(e) {
        let userIdentifier = UserStore.get('userIdentifier');


        if( e.response && ! e.response.hasErrors() ) {

            let authorization = e.response.result.proxyResponse;

            this.setState(
                // the line below needs to change ...
                { authorizationUrl: authorization }
            );
        }
    }

    onThemeDescriptorUpdated(themeDescriptor) {
        // the theme editor has updated the theme descriptor.  Save the new theme descriptor
        this.setState({ dirty: true, themeDescriptor: themeDescriptor });
    }

    onUpdateProjectSetup(params) {

        if (this.state.currentCampaignDetails) {

            // Grab a copy of the campaign details to mutate.
            let details   = {...this.state.currentCampaignDetails};

            details.name = params.name;

            this.setState(
                {
                    dirty: true,
                    currentCampaignDetails: details,
                }
            );


        }
    }

    //onUpdateGameAndPrizeEditor ( prizes, instantEvents, gameDescriptor, baseSkinId, dontChangeDirtyState ) {
    onUpdateGameEditor ( gameDescriptor, baseSkinId ) {

        // Grab a copy of the campaign details to mutate.
        let updatedCampaignDetails = {...this.state.currentCampaignDetails};

        // Update the base skin id. We do this because aren't actually chaning skins through the server's API.
        updatedCampaignDetails.selectedGame["original-skin"] = baseSkinId;
        
            this.setState( {
                dirty: true,
                currentCampaignDetails: updatedCampaignDetails,
                gameDescriptor: gameDescriptor
            })
    }

    onUpdateInstantWinPrizes ( prizes, instantEvents, loss ) {
        this.updatePrizes( prizes, instantEvents, "instantEvents", loss );
    }

    onUpdateDraws ( prizes, multiDrawEvents ) {
        this.updatePrizes( prizes, multiDrawEvents, "multiDrawEvents" );
    }

    onUpdateEveryoneWinsPrizes ( prizes, giveawayEvents ) {
        this.updatePrizes( prizes, giveawayEvents, "giveawayEvents" );
    }

    updatePrizes ( prizes, prizeEvents, eventKey, loss ) {
        // Save any new prize image data to the server.
        // This is currently used in a fire-and-forget manner.
        // When the upload call repsonds, it gives us the final path on the server which technically should be included in the prize as the image_path instead of just the final part we have.
        // The current way works but has two drawbacks:
        // 1) The path has to be pieced together when the prize is rendered and we have to hardcode a portion of the path based on what we know about how the server works.
        // 2) It doesn't worry about whether this succeeds. It just does it.

        // Loop over all the prizes and upload the src data for any prize image that has it.
        // Once the upload is configured, remove the src data.
        // This way, on the next update, this prize won't have it's image uploaded again (unless it is changed). 
        let isUploading = false;
        for (let key in prizes) {
            let prize = prizes[key];

            let assets = {}
            let assetsToUpload = 0;

            // Does the prize have new image data?
            if (prize.image_src) {
                // Configure an asset upload
                assets[prize.id] = {
                    assetFile: prize.image_path,
                    assetSrc: prize.image_src
                }
                assetsToUpload++;

                // Remove the data for the image
                delete prize.image_src;
            }

            // If there are any images to upload, send them now.
            if (assetsToUpload > 0) {
                isUploading = true;
                ImageStore.uploadImageAssets( this.state.campaignHash, assets, ( data ) => {
                    window.frames.preview.postMessage( JSON.stringify( { type: 'prize', data: prizes, multiDrawEvents: this.state.currentCampaignDetails.multiDrawEvents } ), "*" );
                } );
            }
        }

        // Grab a copy of the campaign details to mutate.
        let updatedCampaignDetails = {...this.state.currentCampaignDetails};

        // Update the prizes object
        updatedCampaignDetails.prizes = prizes;

        // Update the list of events in the updated campaign details.
        updatedCampaignDetails[eventKey] = prizeEvents;

        if (loss !== undefined) {
            // Update the loss data
            updatedCampaignDetails.loss = loss;
        }

        // Update state and then call the theme preview to have it refresh with the new prize data.
        this.setState( {
            dirty: true,
            currentCampaignDetails: updatedCampaignDetails
        }, () => {
            // If we aren't uploading any images, just refresh right away.
            // If we are, then wait for the image upload to finish and refresh then.
            // This avoids a double refresh that will flash a 404 for the new image while it is uploading.
            if (!isUploading) {
                window.frames.preview.postMessage( JSON.stringify( { type: 'prize', data: prizes, multiDrawEvents: this.state.currentCampaignDetails.multiDrawEvents } ), "*" );
            }
        })
    }

    onUpdateGameScreenshot ( imageData ) {
        this.setState( { 
            screenshot: imageData
        }, () => {
            // Check if this campaign was flagged as needing a preview image saved. If so, auto save the first screenshot that comes in.
            if (this.state.needsPreview) {
                this.setState( { needsPreview: false }, () => {
                    this.saveScreenshot();
                } );
            }
        } );
    }

    saveScreenshot () {
        if (this.state.screenshot) {
            GameStore.upload( 
                this.state.campaignHash, 
                this.state.currentCampaignDetails.selectedGame[ 'game-type' ], 
                this.state.campaignHash, 
                {
                    screenshot: { 
                        assetFile: 'campaign/previewscreenshot.png', 
                        assetSrc: this.state.screenshot 
                    } 
                } 
            );
        }
    }

    onAssetUploaded ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
            console.error("Error uploading asset", e.response);
        }
    }

    onUpdatePlayerPageDetails (key, value) {

        if (this.state.currentCampaignDetails) {

            // Grab a copy of the campaign details to mutate.
            let details = {...this.state.currentCampaignDetails};

            details.integration.leadPageDetails[key] = value;

            this.setState(
                {
                    dirty: true,
                    currentCampaignDetails: details
                }
            );

        }
    }


    onUpdateTriggerEditor (params) {

        if (this.state.currentCampaignDetails) {

            // Grab a copy of the campaign details to mutate.
            let details = {...this.state.currentCampaignDetails};

            details.integration.uiConfig = params ;

            this.setState(
                {
                    dirty: true,
                    currentCampaignDetails: details
                }
            );

        }
    }

    onUpdateTrackingLinks ( updatedLinks ) {
        if (this.state.currentCampaignDetails) {
            // Grab a copy of the campaign details to mutate.
            let details = {...this.state.currentCampaignDetails};

            details.tracking.links = updatedLinks;

            this.setState(
                {
                    dirty: true,
                    currentCampaignDetails: details
                }
            );
        }
    }

    onUpdateSchedule ( startDate, endDate, timezone ) {
        if (this.state.currentCampaignDetails) {
            // Grab a copy of the campaign details to mutate.
            let details = {...this.state.currentCampaignDetails};

            details.startDate = startDate;
            details.endDate = endDate;
            details.timezone = timezone;

            this.setState(
                {
                    dirty: true,
                    currentCampaignDetails: details
                }
            );
        }
    }

    onUpdateGrandPrize ( grandPrizeDraw ) {
        // Grab a copy of the campaign details to mutate.
        let details = {...this.state.currentCampaignDetails};
        details.grandPrizeDraw = grandPrizeDraw;
        this.setState( {
            dirty: true,
            currentCampaignDetails: details
        } );
    }

    onUpdateOrder ( updatedPrizes ) {
        let details = {...this.state.currentCampaignDetails};

        details.prizes = updatedPrizes;

        this.setState({
            dirty: true,
            currentCampaignDetails: details
        }, () => {
            window.frames.preview.postMessage( JSON.stringify( { type: 'prize', data: updatedPrizes, multiDrawEvents: this.state.currentCampaignDetails.multiDrawEvents } ), "*" );
        } );
    }

    onUpdateSocial ( updatedThemeDescriptor, updatedWebsite, requiresThemePublish ) {
        let details = {...this.state.currentCampaignDetails};

        details.website = updatedWebsite;

        let stateUpdate = {
            dirty: true,
            themeDescriptor: updatedThemeDescriptor,
            currentCampaignDetails: details
        }

        // NOTE: requiresThemePublish indicates if part of the update to the themedescriptor requires that we republish the theme.
        // Once this comes in as true, it must stay true until the next save resets it. 
        // So we don't just use the argument value, we only use it if it's true and ignore ever setting it to a falsey value.
        if (requiresThemePublish) {
            stateUpdate.requiresThemePublish = true;
        }

        this.setState(stateUpdate);
    }

    onUpdateDataCollection ( updatedForms ) {
        let details = {...this.state.currentCampaignDetails};

        details.forms = updatedForms;

        this.setState(
            {
                dirty: true,
                currentCampaignDetails: details
            }
        );
    }

    onGameAssetFileUploaded ( id, gameSrc, fullSrc ) {
        this.setState( { gameLogoSrc: gameSrc } );
    }

    onValidationWarningConfirm ( error ) {
        this.setState({
            showPreviewWarning: false,
            showActivationWarning: false,
            scrollToError: error,
            validationErrors: undefined
        });
    }

    onValidationWarningCancel () {
        this.setState({
            showPreviewWarning: false,
            showActivationWarning: false,
            scrollToError: undefined,
            validationErrors: undefined
        });
    }

    // Figure out if the current validation error is applicable to the target component.
    // If so, that component should be passed the error so that internally it can figure out what to do with it (ideally scroll the UI to bring the error into view).
    doesErrorApplyToTarget ( target ) {
        return (this.state.scrollToError && this.state.scrollToError.target === target) ? {...this.state.scrollToError} : undefined;
    }

    // This method needs to be called once the subcomponent that is managing the validation error has actually scrolled to the error.
    // This is so we can clear the error so that subsequent changes that cause renders do not keep re-scrolling back to the error spot again (which may have been fixed).
    onScrollToErrorComplete () {
        this.setState( { scrollToError: undefined } );
    }

    onActivated ( campaignHash ) {
        CampaignStore.sendGetCampaignDetails(this.props.params.campaignHash);
    }

    onCancelled () {
        History.push(ConfigStore.getDashboardRoute());
    }

    getCampaignStatusMessage ( status ) {
        switch (status) {
            case CampaignStore.STATUS_SCHEDULED:
            case CampaignStore.STATUS_RUNNING:
                return "Active";
                break;
            default:
                return undefined;
                break;
        }
    }

    getActionBarButtonGroup () {
        if (CampaignStore.isActive(this.state.currentCampaign.status)) {
            return "editor_active";
        } else if (CampaignStore.isComplete(this.state.currentCampaign.status)) {
            return "editor_complete";
        } else {
            return "editor";
        }
    }

    render () {
       
        if ( !this.state.currentCampaignDetails || !this.state.themeDescriptor ) { return <Loading modal={false} />; }

        return (
            <div>
                <ActionBar 
                    buttonGroup={ this.getActionBarButtonGroup() } 
                    onClick={this.onNavClick.bind(this)} 
                    status={this.state.currentCampaign.status}
                    showActivateCampaign={ this.state.currentCampaign.status === CampaignStore.STATUS_UNSHEDULED } 
                    featureAuth={UserStore.isFeatureAuthorized(Constants.PRODUCT_SOCIAL,"activate")}
                />
                <div className="action-bar-spacer"/>

                {/* If the campaign is done it shouldn't be edited. To lock the whole thing in a quick and dirty way, i'm putting a div shade over the whole works. */}
                { CampaignStore.isComplete(this.state.currentCampaign.status) ?
                    <div className="ui-blocker"></div>
                    :
                    null
                }

                {/** Project Setup **/}
                { ConfigStore.getEditorSectionEnabled("project") ?
                    <ProjectSetup
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateProjectSetup.bind(this)}
                    />
                    :
                    null
                }


                {/** Play Page Details **/}
                { ConfigStore.getEditorSectionEnabled("theme") ?
                    <ThemeEditor
                        previewShadow={true}
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        themeDescriptor={this.state.themeDescriptor}
                        syncLogoWithGame={true}
                        onThemeDescriptorUpdated={this.onThemeDescriptorUpdated.bind(this)}
                        onGameAssetFileUploaded={this.onGameAssetFileUploaded.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("datacollection") ?
                    <DataCollection 
                        campaignDetails={this.state.currentCampaignDetails}
                        onUpdate={this.onUpdateDataCollection.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("grandprizedraw") ?
                    <GrandPrizeDraw
                        campaignDetails={this.state.currentCampaignDetails}
                        onUpdate={this.onUpdateGrandPrize.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("instant") ?
                    <InstantWin 
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateInstantWinPrizes.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.INSTANT_WIN_PRIZE_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("giveaway") ?
                    <EveryoneWins 
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateEveryoneWinsPrizes.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.EVERYONE_WINS_PRIZE_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("draw") ?
                    <DrawPrize 
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateDraws.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.DRAW_PRIZE_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("prizedisplay") && _.size(this.state.currentCampaignDetails.prizes) > 0 ?
                    <Order
                        campaignDetails={this.state.currentCampaignDetails}
                        onUpdate={this.onUpdateOrder.bind(this)}
                    />
                    :
                    null
                }

                {/** Game And Prize Editor **/}
                { ConfigStore.getEditorSectionEnabled("game") ?
                    <BasicGameEditor 
                        logo={this.state.gameLogoSrc}
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        gameId={this.state.currentCampaignDetails.selectedGame["game-type"]}
                        skinId={this.state.currentCampaignDetails.selectedGame["skin-name"]}
                        baseSkinId={this.state.currentCampaignDetails.selectedGame["original-skin"]}
                        onUpdate={this.onUpdateGameEditor.bind(this)}
                        onUpdateScreenshot={this.onUpdateGameScreenshot.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("socialmedia") ?
                    <Social
                        website={this.state.currentCampaignDetails.website}
                        campaignHash={this.state.campaignHash}
                        themeDescriptor={this.state.themeDescriptor}
                        onUpdate={this.onUpdateSocial.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("tracking") ?
                    <Tracking
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateTrackingLinks.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("schedule") ?
                    <Schedule
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateSchedule.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.SCHEDULE_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { CampaignStore.isUnscheduled(this.state.currentCampaign.status) ?
                    <div className="editor-call-to-action">
                        <div className="title">{i18n.stringFor("editor_cta_title")}</div>
                        <div className="message">{i18n.stringFor("editor_cta_message")}</div>
                        {
                            UserStore.isFeatureAuthorized(Constants.PRODUCT_SOCIAL,"activate") ? 
                                <button className={ "action-button btn-call-to-action"} onClick={this.onNavClick.bind(this,"activate")}>{ i18n.stringFor("editor_cta_button") }</button>
                                :
                                <button className={ "action-button btn-call-to-subscribe"} onClick={this.onNavClick.bind(this,"activate")}>{ i18n.stringFor("editor_cts_button") }</button>
                        }
                    </div>
                    :
                    null
                }
            
                <SaveStatus saved={ false } show={ this.state.dirty !== undefined && this.state.dirty === true } />
                <SaveStatus saved={ true } show={ this.state.dirty !== undefined && this.state.dirty === false } />
                
                { 
                    (this.state.showActivationWarning || this.state.showPreviewWarning) ? 
                    <ValidationWarningModal 
                        validationErrors={this.state.validationErrors} 
                        onConfirm={this.onValidationWarningConfirm.bind(this)} 
                        onCancel={this.onValidationWarningCancel.bind(this)}
                        trigger={this.state.showActivationWarning ? "activate" : "preview"} /> 
                    : null 
                }

                {
                    this.state.saving ?
                    <Loading modal={true} title={i18n.stringFor('label_saving')} /> 
                    : null
                }

                <SubscriptionManager
                    onSubscribed={ ()=> { this.forceUpdate() } }
                    ref={(subscriptionManager) => { this.subscriptionManager = subscriptionManager; }}
                />

                <CampaignActivator 
                    product={Constants.PRODUCT_SOCIAL}
                    onActivated={ this.onActivated.bind(this) }
                    onCancelled={ this.onCancelled.bind(this) }
                    ref={(activator) => { this.activator = activator; }}
                />

                <div className="help-spacer"/>
            </div>

        )
    }
}

module.exports = Editor;

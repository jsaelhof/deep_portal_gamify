import React from 'react';
import {browserHistory as History} from 'react-router';
import CampaignStore from '../../store/CampaignStore';
import ThemeStore from '../../store/ThemeStore';
import SlideoutTriggerEditor from './sections/SlideoutTriggerEditor.jsx';
import GameAndPrizeEditor from './sections/GameAndPrizeEditor.jsx';
import GrandPrizeDraw from '../shared/editor/grandprize/GrandPrizeDraw.jsx';
import LegacyCampaignDetails from './sections/CampaignDetails.jsx';
import ProjectSetup from '../shared/editor/project/ProjectSetup.jsx';
import GameStore from '../../store/GameStore';
import UserStore from '../../store/UserStore';
import i18n from '../../store/i18nStore';
import SaveStatus from '../shared/SaveStatus.jsx';
import Loading from '../shared/Loading.jsx';
import CampaignValidation from '../shared/util/CampaignValidation';
import ValidationWarningModal from '../shared/ValidationWarningModal.jsx';
import ActionBar from '../shared/nav/ActionBar.jsx';
import CampaignActivator from '../shared/activation/CampaignActivator.jsx';
import ErrorStore from '../../store/ErrorStore';
import ConfigStore from '../../store/ConfigStore';
import PreviewUtils from '../shared/util/PreviewUtils';
import DrawPrize from '../shared/editor/prize/DrawPrize.jsx';
import Schedule from '../shared/editor/schedule/WeeklySchedule.jsx';
import ThemeEditor from '../shared/editor/theme/ThemeEditor.jsx';
import Integration from '../shared/editor/integration/Integration.jsx';
import SubscriptionManager from '../shared/payment/SubscriptionManager.jsx';
import DataCollection from '../shared/editor/datacollection/DataCollection.jsx';
import LocalStorageStore from '../../store/LocalStorageStore';
import Constants from '../shared/Constants';
import LegacyWarning from './sections/LegacyWarning.jsx';

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
            themeProperties: null,
            themeDescriptor: null,
            dirty: undefined,
            saving: false,
            gameLogoSrc: undefined,
            screenshot: undefined,
            needsPreview: props.location.query.needsPreview,
            validationErrors: undefined,
            showActivationWarning: false,
            showPreviewWarning: false
        }
    }

    componentWillMount () {
        // Set the tab we should go to when the user hits the dashboard button (or any other way that gets them to the dashboard).
        // This will usually already be set to this value but there are cases like routing to the editor by creating a new campaign that may result in a different dashboard tab.
        LocalStorageStore.set( "dashboardTab", Constants.PRODUCT_SLIDEOUT );

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

    componentDidUpdate () {
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
            this.setState( {
                currentCampaignDetails: e.state.details,
                currentCampaign: e.state
            }, () => {
                if (this.isLegacy()) {
                    ThemeStore.getThemeProperties( this.props.params.campaignHash );
                } else {
                    this.onLoadComplete();
                }
            } );
        }
    }

    // LEGACY FOR TEMPLATE-03 ONLY
    onThemePropertiesRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.setState(
                {
                    themeProperties: e.properties
                },
                () => {
                    this.onLoadComplete();
                }
            );
        }
    }

    onLoadComplete () {
        // Check if the query string has validateAssist=true.
        // If so, we were directed here from the dashboard because of a validation error.
        // Validate the campaign and set scrollToError to the first error. Each component 
        // of the editor can handle whether it cares about this error and how to scroll the UI
        // to where the error is.
        if (this.props.location.query.validateAssist) {
            let validationErrors = CampaignValidation.validateSlideout(this.state.currentCampaignDetails, this.state.currentCampaign.status);

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

        // Save the timestamp back to the campaign details
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
                this.state.themeDescriptor
            );

            if (this.isLegacy()) {
                // Save the theme props to the server
                ThemeStore.saveThemeProperties(
                    this.state.campaignHash,
                    this.state.currentCampaignDetails.themeInfo.name,
                    this.state.currentCampaignDetails.themeInfo.layout,
                    this.state.themeProperties
                );
            }

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

        let validationErrors = CampaignValidation.validateSlideout(this.state.currentCampaignDetails, this.state.currentCampaign.status, true);

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
                this.state.themeDescriptor
            );

            if (this.isLegacy()) {
                // Save the theme props to the server
                ThemeStore.saveThemeProperties(
                    this.state.campaignHash,
                    this.state.currentCampaignDetails.themeInfo.name,
                    this.state.currentCampaignDetails.themeInfo.layout,
                    this.state.themeProperties
                );
            }
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
            
            let previewUrl = PreviewUtils.getDemoStorePreviewUrl( Constants.PRODUCT_SLIDEOUT, this.state.campaignHash, true, UserStore.isFeatureAuthorized(Constants.PRODUCT_SLIDEOUT,"activate") );
            
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

        let validationErrors = CampaignValidation.validateSlideout(this.state.currentCampaignDetails, this.state.currentCampaign.status);

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
                this.state.themeDescriptor
            );

            if (this.isLegacy()) {
                // Save the theme props to the server
                ThemeStore.saveThemeProperties(
                    this.state.campaignHash,
                    this.state.currentCampaignDetails.themeInfo.name,
                    this.state.currentCampaignDetails.themeInfo.layout,
                    this.state.themeProperties
                );
            }
        }


        // If valid, open the window and save.
        // If invalid, still save but don't open the window.
        if (validationErrors.length === 0) {
            this.setState( newState, () => {
                save();

                // Set the timeout to fake it until we get actual save events working
                setTimeout( () => {
                    this.setState( { saving: false, dirty: false }, () => {
                        if (UserStore.isFeatureAuthorized(Constants.PRODUCT_SLIDEOUT,"activate")) {
                            this.activator.activate( this.state.currentCampaign, Constants.PRODUCT_SLIDEOUT );
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

    // LEGACY TEMPALTE-03 ONLY
    onUpdateCampaignDesign(campaignDesign,thDescriptor,thProperties) {
        let details = {...this.state.currentCampaignDetails};
        details.integration.campaignDesign = campaignDesign;

        this.setState(
            {
                dirty: true,
                currentCampaignDetails: details,
                themeDescriptor: thDescriptor,
                themeProperties: thProperties
            },

            function () {
                window.frames.preview.postMessage( JSON.stringify( { type: 'descriptors', data: { themeDescriptor: thDescriptor, themeProperties: thProperties } } ), "*" );
            }
        );
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

    onUpdateGameAndPrizeEditor ( prizes, instantEvents, gameDescriptor, baseSkinId, secretSave ) {

        // Grab a copy of the campaign details to mutate.
        let updatedCampaignDetails = {...this.state.currentCampaignDetails};

        // Update the base skin id. We do this because aren't actually chaning skins through the server's API.
        updatedCampaignDetails.selectedGame["original-skin"] = baseSkinId;
        
        // Update the prizes object
        updatedCampaignDetails.prizes = prizes;

        // Update the list of instantEvents in the updated campaign details.
        updatedCampaignDetails.instantEvents = instantEvents;

        // Figure out if we are marking the state dirty. Generally this is always true.
        // But if secretSave is true, then just leave the dirty state however it already is.
        // We do this because we are forcing an update to the campaign without showing the user (done for creating default prizes on slideout games)
        let markDirty = (secretSave) ? this.state.dirty : true;

        // Update the state of the currentCampaign with the updated details.
        if (gameDescriptor) {
            this.setState( {
                dirty: markDirty,
                currentCampaignDetails: updatedCampaignDetails,
                gameDescriptor: gameDescriptor
            })
        } else {
            this.setState( {
                dirty: markDirty,
                currentCampaignDetails: updatedCampaignDetails
            })
        }

        // If secretSave is true then push this update to the server but don't show the usual "changes saved" notifications. Just quietly update it in the background.
        if (secretSave) {
        // Save the details to the server
            CampaignStore.sendCampaignUpdate(this.state.campaignHash, updatedCampaignDetails, this.state.currentCampaign.version, (response) => {
            if (response.hasErrors()) {
                ErrorStore.rpcResponseError( response );
            } else {
                // Save the update campaign info to state.
                this.setState({
                    currentCampaign: response.result,
                    currentCampaignDetails: response.result.details
                });
            }
        });
    }
    }

    onUpdateDraws ( prizes, multiDrawEvents ) {
        this.updatePrizes( prizes, multiDrawEvents, "multiDrawEvents" );
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


    onUpdateTriggerEditor (uiConfig, themeDescriptor) {
        let stateUpdate = {
            dirty: true
        };

        // Grab a copy of the campaign details to mutate.
        let details = {...this.state.currentCampaignDetails};
        details.integration.uiConfig = uiConfig ;
        stateUpdate.currentCampaignDetails = details;

        // Theme Descriptor is only updated when the prize banner is updated so it may be undefined.
        if (themeDescriptor) {
            stateUpdate.themeDescriptor = themeDescriptor;
        }

        this.setState(stateUpdate);
    }

    onUpdateSchedule ( schedule, timezone ) {
        console.log("Schedule Upadre",schedule);
        // Grab a copy of the campaign details to mutate.
        let details = {...this.state.currentCampaignDetails};

        // Update the prizes object
        details.schedule = schedule;
        details.timezone = timezone;

        // Update state and then call the theme preview to have it refresh with the new prize data.
        this.setState( {
            dirty: true,
            currentCampaignDetails: details
        } );
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
 
    // LEGACY TEMPALTE-03 ONLY
    onGameLogoUploaded ( gameSrc, fullSrc ) {
        this.setState( { gameLogoSrc: gameSrc } );
    }

    // LEGACY TEMPALTE-03 ONLY
    onThemeLogoUploaded ( themeProperties ) {
        this.setState( { themeProperties: themeProperties }, function () {
            window.frames.preview.postMessage( JSON.stringify( { type: 'descriptors', data: { themeDescriptor: this.state.themeDescriptor, themeProperties: this.state.themeProperties } } ), "*" );
        } );
    }

    // LEGACY TEMPALTE-03 ONLY
    onThemeLogoRemoved ( themeProperties ) {
        this.setState( { themeProperties: themeProperties }, function () {
            window.frames.preview.postMessage( JSON.stringify( { type: 'descriptors', data: { themeDescriptor: this.state.themeDescriptor, themeProperties: this.state.themeProperties } } ), "*" );
        } );
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


    // New Activation

    onActivated ( campaignHash ) {
        CampaignStore.sendGetCampaignDetails(this.props.params.campaignHash);
    }

    onCancelled () {
        History.push(ConfigStore.getDashboardRoute());
    }

    onGoToIntegration () {
        History.push(ConfigStore.buildRoutePath("integration","portal"));
    }

    isLegacy () {
        return this.state.currentCampaignDetails.themeInfo.layout === "template-03";
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
        if ( !this.state.currentCampaignDetails || !this.state.themeDescriptor || (this.isLegacy() && !this.state.themeProperties) ) { return <Loading modal={false} />; }

        return (
            <div>
                <ActionBar 
                    buttonGroup={ this.getActionBarButtonGroup() } 
                    onClick={this.onNavClick.bind(this)} 
                    status={this.state.currentCampaign.status}
                    showActivateCampaign={ this.state.currentCampaign.status === CampaignStore.STATUS_UNSHEDULED } 
                    featureAuth={UserStore.isFeatureAuthorized(Constants.PRODUCT_SLIDEOUT,"activate")}
                />
                <div className="action-bar-spacer"/>

                {/* If the campaign is done it shouldn't be edited. To lock the whole thing in a quick and dirty way, i'm putting a div shade over the whole works. */}
                { CampaignStore.isComplete(this.state.currentCampaign.status) ?
                    <div className="ui-blocker"></div>
                    :
                    null
                }

                { !CampaignStore.isComplete(this.state.currentCampaign.status) && this.isLegacy() ?
                    <LegacyWarning/>
                    :
                    null
                }
                
                {/** Project Setup **/}
                { ConfigStore.getEditorSectionEnabled("project") ?
                    <ProjectSetup
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        onUpdate={this.onUpdateProjectSetup.bind(this)}
                    />
                    :
                    null
                }


                {/** Play Page Details **/}
                { ConfigStore.getEditorSectionEnabled("theme") ?
                    this.isLegacy() ?
                        <LegacyCampaignDetails
                            campaignDetails={this.state.currentCampaignDetails}
                            campaignHash={this.state.campaignHash}
                            themeProperties={this.state.themeProperties}
                            themeDescriptor={this.state.themeDescriptor}
                            onUpdate={this.onUpdateCampaignDesign.bind(this)}
                            onGameLogoUploaded={this.onGameLogoUploaded.bind(this)}
                            onThemeLogoUploaded={this.onThemeLogoUploaded.bind( this )}
                            onThemeLogoRemoved={this.onThemeLogoRemoved.bind( this )}
                            gameId={this.state.currentCampaignDetails.selectedGame["game-type"]}
                        />
                        :
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

                { ConfigStore.getEditorSectionEnabled("datacollection") && !this.isLegacy() ?
                    <DataCollection 
                        campaignDetails={this.state.currentCampaignDetails}
                        onUpdate={this.onUpdateDataCollection.bind(this)}
                    />
                    :
                    null
                }

                {/** Game And Prize Editor **/}
                { ConfigStore.getEditorSectionEnabled("game") ?
                    <GameAndPrizeEditor 
                        logo={this.state.gameLogoSrc}
                        campaign={this.state.currentCampaign}
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        campaignStatus={this.state.currentCampaign.status}
                        gameId={this.state.currentCampaignDetails.selectedGame["game-type"]}
                        skinId={this.state.currentCampaignDetails.selectedGame["skin-name"]}
                        baseSkinId={this.state.currentCampaignDetails.selectedGame["original-skin"]}
                        onUpdate={this.onUpdateGameAndPrizeEditor.bind(this)}
                        onUpdateScreenshot={this.onUpdateGameScreenshot.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.GAME_AND_PRIZE_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("grandprizedraw") && !this.isLegacy() ?
                    <GrandPrizeDraw
                        campaignDetails={this.state.currentCampaignDetails}
                        onUpdate={this.onUpdateGrandPrize.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("draw") && !this.isLegacy() ?
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

                {/** Customer UI Triggers **/}
                { ConfigStore.getEditorSectionEnabled("triggers") ?
                    <SlideoutTriggerEditor
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignHash={this.state.campaignHash}
                        themeDescriptor={this.state.themeDescriptor}
                        onUpdate={this.onUpdateTriggerEditor.bind(this)}
                        scrollToError={ this.doesErrorApplyToTarget(CampaignValidation.TRIGGER_EDITOR) }
                        onScrollToErrorComplete={this.onScrollToErrorComplete.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("schedule") ?
                    <Schedule
                        campaignDetails={this.state.currentCampaignDetails}
                        campaignStatus={this.state.currentCampaign.status}
                        onUpdate={this.onUpdateSchedule.bind(this)}
                    />
                    :
                    null
                }

                { ConfigStore.getEditorSectionEnabled("integration") ?
                    <Integration />
                    :
                    null
                }

                { CampaignStore.isUnscheduled(this.state.currentCampaign.status) ?
                    <div className="editor-call-to-action">
                        <div className="title">{i18n.stringFor("editor_cta_title")}</div>
                        <div className="message">{i18n.stringFor("editor_cta_message")}</div>
                        {
                            UserStore.isFeatureAuthorized(Constants.PRODUCT_SLIDEOUT,"activate") ? 
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
                    product={Constants.PRODUCT_SLIDEOUT}
                    forceSingleActiveCampaign={true}
                    onActivated={ this.onActivated.bind(this) }
                    onCancelled={ this.onCancelled.bind(this) }
                    onGoToIntegration={ this.onGoToIntegration.bind(this) }
                    ref={(activator) => { this.activator = activator; }}
                />

                <div className="help-spacer"/>
            </div>

        )
    }
}

module.exports = Editor;

import React from 'react';
import String from '../../common/String.jsx.js';
import GUID from '../../../util/guid.js';
import NumericTextInput from '../../shared/NumericTextInput.jsx';
import TextInput from '../../shared/TextInput.jsx';
import CampaignGamePreview from '../../shared/CampaignGamePreview.jsx';
import Modal from '../../common/Modal.jsx';
import GameStore from '../../../store/GameStore';
import CampaignStore from '../../../store/CampaignStore';
import GameEditor from './GameEditor.jsx';
import i18n from '../../../store/i18nStore';
import CampaignValidation from '../../shared/util/CampaignValidation';
import ScrollUtils from '../../shared/util/ScrollUtils.js';
import PreviewModal from '../../common/GamePreviewModal.jsx';
import ConfigStore from '../../../store/ConfigStore';
import _ from 'underscore';

class GameAndPrizeEditor extends React.Component {
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
            gameDescriptor: undefined,
            layout: undefined,
            skinInfo: undefined,
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
            console.log("ERROR Incomplete Game information @ GameAndPrizeEditor");
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
        GameStore.getGameInfo(this.props.gameId);
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
                this.update( this.props.campaignDetails.prizes, this.props.campaignDetails.instantEvents );
            })
        }
    }

    componentDidUpdate () {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one). In this components case, all the errors that are being checked are in the prize table
        // so just scroll there.
        if (this.props.scrollToError) {
            if (this.props.scrollToError.prizeId) {
                ScrollUtils.smoothScroll(this.props.scrollToError.prizeId, () => { this.props.onScrollToErrorComplete() } );
            } else {
                ScrollUtils.smoothScroll("PrizeTable", () => { this.props.onScrollToErrorComplete() } );
            }
        }
    }

    onPostMessage (event) {
        if (event.data) {
            try {
                let data = JSON.parse(event.data);
                if (data.deepapi) { // Check if this is our message body. Ignore if not.
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
            this.setState( { "gameDetails": e.result.game }, () => {
                this.initPrizes();
            } );
        }
    }


    // Send changes to the parent which will re-render the component.
    // secretSave tells the parent that this update should not change the current dirty state and should do a coverrt save (don't show the user it's happening).
    // We do this when creating default prizes on a new campaign to prevent new campaigns
    // from immediately showing a dirty state and to save their default prizes.
    update ( updatedPrizes, updatedInstantEvents, updatedBaseSkinId, secretSave ) {

        let updatedGameDescriptor = {...this.state.gameDescriptor};

        // Clean the game descriptor of old prize assignments. 
        // This needs to be done so that when a prize is deleted, it actually gets removed.
        updatedGameDescriptor.prizes.prizeList.forEach( ( prize ) => {
            prize.prizeId = null; // Set to null instead of undefined as that is the default state of an unassigned prize in the game descriptor.
            delete prize.winPercent;
            this.resetGameDescriptorPrizeData(updatedGameDescriptor); // Reset all game elements that are linked to prizes. These will get re-added if applicable below.
        } );

        // Go through the instant events and add all the prize info into the game descriptor.
        updatedInstantEvents.forEach(guid => {
            let prizeData = updatedPrizes[guid];

            // Add the prize id's to the game descriptor
            updatedGameDescriptor.prizes.prizeList[prizeData.displayIndex].prizeId = guid;

            // Add the win percentage to the game descriptor. This is needed so that we can determine how to hand out prizes in demo mode.
            updatedGameDescriptor.prizes.prizeList[prizeData.displayIndex].winPercent = prizeData.winPercent;

            // Given the gameDescriptor, the prize id and the prize data, go to the descriptor and assign applicable prize data 
            // to the game descriptor elements based on the prize.
            this.updateGameDescriptorWithPrizeData( updatedGameDescriptor, guid, updatedPrizes[guid] );
        });

        this.setState( { 
            gameDescriptor: updatedGameDescriptor
        }, () => {
            // Call the parent with the update information
            // If no updatedBaseSkinId is provided, then just keep the existing one.
            this.props.onUpdate(
                updatedPrizes, 
                updatedInstantEvents, 
                updatedGameDescriptor, 
                (updatedBaseSkinId) ? updatedBaseSkinId : this.props.baseSkinId,
                (secretSave) ? secretSave : false
            );
            this.schedulePreviewRefresh();
        } );
    }

    getTotalWinPercent () {
        // Calculate the total win percent of all rpizes to make sure it's valid
        let totalWinPercent = 0;

        if (this.props.campaignDetails.instantEvents) {
            this.props.campaignDetails.instantEvents.forEach(guid => {
                let prizeData = this.props.campaignDetails.prizes[guid];

                // Add this prizes win percent to the total.
                totalWinPercent += parseFloat(prizeData.winPercent);
            });

            return this.fixPrecision(totalWinPercent);
        }
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
                // If this is a new campaign, it will automatically generate default prizes which creates an update.
                // This is a duplicate update so we don't want to render it, throw up the refreshing message and swap the pointer.
                // Instead, until the first preview loads, ignore updating the other preview panel.
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

    /**
     * IMPORTANT: This method loops over the game's prizes list and fills in customized values.
     * What cutomizations are assigned to what game elements is not very dynamic. 
     * Currently, the prize title is always assigned to any and all text elements associated with the prize.
     * We could add more things like prize colors etc at some point in the future in which case they
     * would be added here as well. But this is a bit problematic, There really isn't anything in the game descriptor to tell it WHAT
     * thing to assign to it's prize. It works because there's an assumption being made.
     * What if a prize had two text fields associated with it (which it can) but they should be for different values?
     * How do this class know that without any information?
    **/
    updateGameDescriptorWithPrizeData ( updatedGameDescriptor, id, prizeData ) {
        updatedGameDescriptor.prizes.prizeList.forEach( ( p ) => {
            // Find the prize in the gameDescriptor with this id.
            if (p.prizeId === id) {
                // First check if the game descriptor actually implememented any text assoiciations for this prize.
                if (p.elements && p.elements.data && p.elements.data.text) {
                    // If so, loop over the id pointers found
                    p.elements.data.text.forEach( ( elementId ) => {
                        // For each pointer found, find it in the gameDescriptor's text section and set it's value.
                        updatedGameDescriptor.data.text[elementId].value = prizeData.title;
                    } )
                }
            }
        } );
    }

    /**
     * Note: This is really bad, similar to the issues with the updateGameDescriptorWithPrizeData method.
     * Here, we have to go thorugh the game descriptor's prize "pointers" and reset them in case they have old information from a deleted prize.
     * It's no hard to go through them but how do i know what their original values were?
     * I guess the best solution is probably what the old portal did and load the game descriptor for the original skin id this one was created from
     * and then reset the pointed elements to their original values.
     * Since we are only working with prize names at this point and we are way out of time, I'm just hardcoding it to 10% Off because thats 
     * what all the games are currently using. 
     * FIXME: Load the original game descriptor and copy the values for each pointer from there.
     * FIXME: Do not copy the whole thing because we don't want to reset all changes...just prize related information.
     */
    resetGameDescriptorPrizeData ( updatedGameDescriptor ) {
        updatedGameDescriptor.prizes.prizeList.forEach( ( p ) => {
            // First check if the game descriptor actually implememented any text assoiciations for this prize.
            if (p.elements && p.elements.data && p.elements.data.text) {
                // If so, loop over the id pointers found
                p.elements.data.text.forEach( ( elementId ) => {
                    // For each pointer found, find it in the gameDescriptor's text section and set it's value.
                    updatedGameDescriptor.data.text[elementId].value = "10% Off";
                } )
            }
        } );
    }


    initPrizes () {

        if( this.state.gameDescriptor.prizes !== undefined ) {

            // Check to see if the right number of prizes exist
            let minPrizes = this.state.gameDescriptor.prizes.min;
            let maxPrizes = this.state.gameDescriptor.prizes.max;

            if (!this.props.campaignDetails.instantEvents || this.props.campaignDetails.instantEvents.length < minPrizes) {
                // Not enough prizes, create them
                let existingPrizes = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.length : 0;
                this.createNewPrizes(minPrizes - existingPrizes, true);
            }

            this.setState({initLoad: false});
        }
    }

    // SecretSave tells the editor (parent) to do a covert campaign update without informing the user. 
    // This is done only to save the default prize(s) to the campaign.
    createNewPrizes ( numberOfPrizes, secretSave ) {
        // Make a copy of both the prizes and instantEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedInstantEvents = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.slice() : [];

        let initIndex = updatedInstantEvents.length;

        for (let i=0; i<numberOfPrizes; i++) {
            let guid = GUID.guid();

            let prizeText;

            // Try to find a pointer to the game's default text for each prize.
            // If it can't or the game doesn't have one, then just make a default name.
            try {
                let pointer = this.state.gameDescriptor.prizes.prizeList[initIndex + i].elements.data.text[0];
                if (pointer) {
                    prizeText = this.state.gameDescriptor.data.text[pointer].value;
                }
            } catch (e) {}

            if (prizeText === undefined) prizeText = "Prize " + (initIndex + (i+1));

            // Update the prizes object 
            updatedPrizes[guid] = {
                id: guid,
                quantity: "-1",
                title: prizeText,
                description: "",
                winPercent: (initIndex === 0) ? "100" : "0", // If this is prize 0 being created, make sure it has a non-zero weight and a 100% win percentage. This ensures the system won't ever have a non-100% total.
                weight: (initIndex === 0) ? "100" : "0",
                product_type: "incentive",
                type: "instant",
                displayIndex: (initIndex + i).toString()
            }

            // Update the instant events with the prize id
            updatedInstantEvents.push( guid );
        }

        this.dirtyPreview = true;
        
        this.update( updatedPrizes, updatedInstantEvents, undefined, secretSave ); 
    }

    onPrizeWeightChange ( id, weight ) {
        // If the weight can't be parsed, treat it as 0 in the calulation.
        // The input field prevents almost all cases so this would typically only happen if the weight is an empty string (user backspaces all chars)
        if (isNaN(parseFloat(weight))) weight = "0";

        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].weight = weight;

        this.updateWinPercentsForPrizes(updatedPrizes,this.props.campaignDetails.instantEvents);

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified instantEvents.
        this.update( updatedPrizes, this.props.campaignDetails.instantEvents );
    }

    updateWinPercentsForPrizes ( prizesObject, instantEventsObject ) {
        // Set a var to track the totals.
        let totalWeight = 0;
        let totalPercent = 0;

        // Go through all the prizes and total up all the weights.
        for (let prizeId of instantEventsObject) {
            totalWeight += parseFloat(prizesObject[prizeId].weight);
        }

        // Once totaled, go through the list of prizes again and calculate the percentage, and assign it.
        for (let i=0; i<instantEventsObject.length; i++) {
            // Get the prize id to work on
            let prizeId = instantEventsObject[i];

            // Calculate the percentage.
            // If this is NOT the last prize, do the real calculation.
            // If this IS the last prize, calulate it as (1-totalPercent).
            // This ensures that any imprecision does not result in a total percent like 99.99999 or 100.0000001.
            let percent;
            if (totalWeight === 0) {
                percent = 0;
            } else if (i !== instantEventsObject.length - 1) {
                percent = 100 * (parseFloat(prizesObject[prizeId].weight) / totalWeight);
                percent = this.fixPrecision(percent);
            } else {
                percent = this.fixPrecision(100 - totalPercent);
            }
            totalPercent += percent;

            // Update the value in the prizes.
            prizesObject[prizeId].winPercent = percent.toString();
        }
    }

    fixPrecision( num ) {
        let precision = 2;
        return parseFloat(num.toFixed(precision));
    }

    onPrizeQuantityChange ( id, quantity ) {
        this.prizeDataChange(id, "quantity", quantity);
    }

    onPrizeNameChange ( id, name ) {
        this.dirtyPreview = true;
        this.prizeDataChange(id, "title", name);
    }

    onPrizeCouponCodeChange ( id, couponCode ) {
        this.prizeDataChange(id, "coupon_code", couponCode);
    }

    prizeDataChange ( id, key, value ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id][key] = value;
        
        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified instantEvents.
        this.update( updatedPrizes, this.props.campaignDetails.instantEvents );
    }

    onDeletePrize ( prizeId ) {
        this.dirtyPreview = true;

        // Make a copy of both the prizes and instantEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedInstantEvents = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.slice() : [];

        // Delete the prize data object
        delete updatedPrizes[prizeId];

        // Delete the instant events entry
        updatedInstantEvents.splice(updatedInstantEvents.indexOf(prizeId),1);

        // Loop over the updated list of instant prizes and reset their display order. This re-numbers them so that we don't end up with prizes 1, 2, and 4 when 3 is deleted.
        // This is also important when we call update later in this method as update uses the displayIndex to assign the prizes to the prize slots in the game descriptor.
        updatedInstantEvents.forEach( (prizeId, index) => {
            updatedPrizes[prizeId].displayIndex = index;
        } );

        // Re-calc the win percents now that the prize has been removed.
        this.updateWinPercentsForPrizes(updatedPrizes,updatedInstantEvents);

        // Update the parent.
        this.update( updatedPrizes, updatedInstantEvents );
    }

    generatePrizeTable () {

        let validationErrors = CampaignValidation.validateSlideout( this.props.campaignDetails );
        let hasInvalidWinPercent = validationErrors.filter(error => error.id === "invalidWinPercent").length > 0;

        let rowMap = [
            {
                id: "prizenum",
                label: "",
                css: 'prize-number'
            },
            {
                id: "prizename",
                label: i18n.stringFor('sh_label_prize_row_prize_name'),
                css: 'prize-name'
            },
            {
                id: "couponcode",
                label: i18n.stringFor('sh_label_prize_row_coupon_code'),
                css: 'prize-coupon'
            },
            {
                id: "weight",
                label: "",
                css: 'prize-probability'
            },
            {
                id: "slash",
                label: "",
                css: 'prize-slash'
            },
            {
                id: "percent",
                label: "",
                css: 'prize-percent'
            },
            {
                id: "delete",
                label: "",
                css: 'prize-delete'
            }
        ]

        // Create an array to store all of the rows
        let rows = [];

        // Build the header row
        let headerCells = rowMap.map( ( element ) => {
            switch (element.id) {
                case "prizenum":
                case "prizename":
                case "couponcode":
                case "delete":
                    return <th key={ '_header_' + element.id }> {element.label} </th>;
                    break;
                case "weight":
                    return <th key={ '_header_' + element.id } colSpan="3">
                        <span>{i18n.stringFor('sh_label_prize_row_weight')}&nbsp;&nbsp;/&nbsp;&nbsp;{i18n.stringFor('sh_label_prize_row_win_percent')}</span>
                        <a className="help-icon help-tooltip left">
                            <i className="material-icons">help_outline</i>
                            <div className="arrow"></div>
                            <div className="summary" style={ { width: "500px" } }>
                                <h4>{i18n.stringFor('sh_label_tooltip_winpercent_title')}</h4>
                                <p>{i18n.stringFor('sh_label_tooltip_winpercent_1')}</p>
                                <p>{i18n.stringFor('sh_label_tooltip_winpercent_2')}</p>
                                <p>{i18n.stringFor('sh_label_tooltip_winpercent_3')}</p>
                                <p>{i18n.stringFor('sh_label_tooltip_winpercent_4')}</p>
                                <p>{i18n.stringFor('sh_label_tooltip_prizeweight')} ÷ {i18n.stringFor('sh_label_tooltip_total_prizeweight')}</p>
                                <p>{i18n.stringFor('sh_label_tooltip_prizeweight_example')}</p>
                            </div>
                        </a>
                    </th>;
                    break;
            }
        } );

        // Create the cells
        let numPrizes = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.length : 0;

        for (let i=0; i<numPrizes; i++) {

            let prize = this.props.campaignDetails.prizes[this.props.campaignDetails.instantEvents[i]];
            let hasErrors;

            let cells = rowMap.map( ( element ) => {
                switch (element.id) {
                    case "prizenum":
                        return <td key={'_td_'+element.id} className={element.css}>
                                {parseInt(prize.displayIndex)+1}
                            </td>
                        break;
                    case "couponcode":
                        hasErrors = validationErrors.filter(error => (error.id === "missingCouponCode" && error.prizeId === prize.id )).length > 0;
                        return <td key={'_td_'+element.id} className={element.css}>
                                <TextInput error={hasErrors} id={prize.id} name={element.id} value={prize.coupon_code} onChange={this.onPrizeCouponCodeChange.bind(this)}/>
                            </td>
                        break;
                    case "prizename":
                        hasErrors = validationErrors.filter(error => (error.id === "invalidPrizeTitle" && error.prizeId === prize.id )).length > 0;
                        return <td key={'_td_'+element.id} className={element.css}>
                                <TextInput error={hasErrors} id={prize.id} name={element.id} value={prize.title} onChange={this.onPrizeNameChange.bind(this)}/>
                            </td>
                        break;
                    case "quantity":
                        return <td key={'_td_'+element.id} className={element.css}>
                                <NumericTextInput id={prize.id} name={element.id} value={prize.quantity} allowNegative={true} integer={true} onChange={this.onPrizeQuantityChange.bind(this)}/>
                            </td>
                        break;
                    case "weight":
                        return <td key={'_td_'+element.id} className={element.css}>
                                <NumericTextInput error={hasInvalidWinPercent} id={prize.id} value={prize.weight} onChange={this.onPrizeWeightChange.bind(this)}/>
                            </td>
                        break;
                    case "slash":
                        return <td key={'_td_'+element.id} className={element.css}>/</td> 
                        break;
                    case "percent":
                        return <td key={'_td_'+element.id} className={element.css}>
                                {prize.winPercent + "%"}
                            </td>
                        break;
                    case "delete":
                        if( this.state.gameDescriptor.prizes !== undefined ) {
                            // Get the minimum number of prizes. We can't go below this number so the first N prize rows won't get delete buttons.
                            let minPrizes = this.state.gameDescriptor.prizes.min;

                            // If the campaign is unscheduled, prizes can be added and deleted EXCEPT for the minimum required prizes for the game.
                            // Once the campaign has been activated, it will either be RUNNING or SUSPENDED. In either case, prizes cannot be deleted as it will cause errors for some users.
                            // Technically new prizes can be added but we would have to figure out how to make them deleteable until they save. But since they have to save to preview, it's likely that 
                            // users might end up stuck with new prizes that they could only "remove" by weighting them to zero.
                            if ( this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED ) {
                                if (i < minPrizes) {
                                    return <td key={'_td_'+element.id} className={element.css}>
                                        <button className="btn">
                                            <a className="help-tooltip button-tooltip top">
                                            <i className="material-icons md-18">lock_outline</i>
                                                <div className="arrow"></div>
                                                <div className="summary">
                                                    <h4>{i18n.stringFor("sh_tooltip_min_prizes").replace("{0}",minPrizes)}</h4>
                                                </div>
                                            </a>
                                        </button>
                                    </td>
                                } else {
                                    return <td key={'_td_'+element.id} className={element.css}>
                                        <button className="btn" onClick={this.onDeletePrize.bind(this,prize.id)}>
                                            <a className="help-tooltip button-tooltip top">
                                            <i className="material-icons md-18">close</i>
                                                <div className="arrow"></div>
                                                <div className="summary">
                                                    <h4><String code="sh_delete_prize"/></h4>
                                                </div>
                                            </a>
                                        </button>
                                    </td>
                                }
                            } else {
                                return <td key={'_td_'+element.id} className={element.css}>
                                    <button className="btn">
                                        <a className="help-tooltip button-tooltip top">
                                        <i className="material-icons md-18">lock_outline</i>
                                            <div className="arrow"></div>
                                            <div className="summary">
                                                <h4>{i18n.stringFor("sh_tooltip_locked_prize")}</h4>
                                            </div>
                                        </a>
                                    </button>
                                </td>
                            }
                        } else {
                            return <td key={'_td_'+element.id} className={element.css}></td>;
                        }
                        
                        break;
                }
            } );

            rows.push(<tr id={prize.id} key={i}>{cells}</tr>);
        }

        rows.push(
            <tr key="winPercentRow">
                <td></td>
                <td></td>
                <td></td>
                <td colSpan="3"><div className={ (hasInvalidWinPercent) ? "invalid-field" : "" }><String code="label_total"/>: {this.getTotalWinPercent()}%</div></td>
                <td></td>
            </tr>
        )

        return (
            <table className="table prize-table">
                <thead>
                    <tr key="header">{headerCells}</tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }

    onAddPrize () {
        if (this.canAddPrize()) {
            this.createNewPrizes(1, false);
        }
    }

    canAddPrize () {
        return this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED && (!this.props.campaignDetails.instantEvents || this.props.campaignDetails.instantEvents.length < this.state.gameDescriptor.prizes.max);
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
        } );
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
                // Since the prizes and instantEvents aren't changing we'll send the current values.
                // We'll send the updated baseSkin and the update method always rebuilds an
                // updated game descriptor to include for saving.
                this.setState( {
                    gameDescriptor: newGameDescriptor,
                    layout: newLayout
                }, () => {
                    this.update( this.props.campaignDetails.prizes, this.props.campaignDetails.instantEvents, newBaseSkinId );
                } )
            } );
        } );
    }

    onGameEditorUpdate ( updatedGameEditor ) {
        this.setState( {
            gameDescriptor: updatedGameEditor,
        }, () => {
            this.dirtyPreview = true;
            this.update( this.props.campaignDetails.prizes, this.props.campaignDetails.instantEvents );
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

    onPreview () {
        this.setState( { showPreviewModal: true } );
    }

    onClosePreview () {
        this.setState( { showPreviewModal:false } );
    }

    render () {
        if (this.state.initLoad) {
            return (
                <div>
                    <aside className="preview-window m-t-1">
                    </aside>

                    <div className="settings">
                        <div className="container">
                            <div className="panel panel-default">
                                <div className="panel-heading">
                                    <div className="panel-heading-label">
                                        <h1>
                                            {i18n.stringFor('sh_label_game_editor')}
                                        </h1>
                                        <h3 className="subheading">{i18n.stringFor('sh_label_subtext_game_editor')}</h3>
                                    </div>
                                </div>
                                <div className="panel-body">
                                    <h4><String code='label_loading' /></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {

            let gameId = this.props.gameId;
            let skinId = this.props.skinId;

            return (
                <div>

                    <div className="settings">
                        <div className="container">
                            <div className="panel panel-default">
                                <div className="panel-heading">
                                    <div className="panel-heading-label">
                                        <h1>
                                            {i18n.stringFor('sh_label_game_editor')}
                                        </h1>
                                        <h3 className="subheading">{i18n.stringFor('sh_label_subtext_game_editor')}</h3>
                                    </div>
                                </div>
                                <div className="panel-body">
                                    <div className="col-sm-5 col-md-6 m-t-2">
                                        <div className="form">
                                            {/* <h3 className="m-t-0">Settings</h3> */}
                                            <div className="setting-group">
                                                <div className="setting">
                                                    <label><String code="sh_label_theme"/></label>
                                                    <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_theme_change_warning')}</div>
                                                    <select name="skin" onChange={this.onSkinChange.bind(this)} className="form-control">
                                                        { this.getSkinOptions() }
                                                    </select>
                                                </div>
                                            </div>
                                            <GameEditor gameId={gameId} skinId={skinId} campaignHash={this.props.campaignHash} gameDescriptor={this.state.gameDescriptor} onUpdate={this.onGameEditorUpdate.bind(this)} />
                                        </div>
                                    </div>
                                    <div className="col-sm-7 col-md-6 m-t-2">
                                        <aside className="preview-window preview-window-portrait gap-b-md">
                                            <div id="main" className="game portrait">
                                                <div id="game-wrapper" className="game-wrapper">
                                                    <div id="preview1" className="preview-game" style={this.state.preview1Style}>
                                                        <CampaignGamePreview gameId={gameId} skinId={skinId} timestamp={this.state.previewTimestamp1} id="1"/>
                                                    </div>
                                                    { !this.previewFirstLoad ? 
                                                        <div id="preview2" className="preview-game" style={this.state.preview2Style}>
                                                            <CampaignGamePreview gameId={gameId} skinId={skinId} timestamp={this.state.previewTimestamp2} id="2"/>
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
                                                                marginTop: "315px",
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
                                                <button className="btn btn-success round m-t-2" onClick={this.onPreview.bind(this)}>Live Game Preview</button>
                                            </div>
                                        </aside>
                                    </div>
                                    <div className="col-xs-12 m-t-2">
                                        <div id="PrizeTable">
                                            <h3><String code="sh_label_prizes"/></h3>
                                            {
                                                this.generatePrizeTable()
                                            }
                                            {
                                                this.canAddPrize() ?
                                                <button className="btn btn-primary round m-b-3" onClick={this.onAddPrize.bind(this)}>{i18n.stringFor('sh_label_add_prize')}</button>
                                                :
                                                this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED ?
                                                    <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_max_prizes')}</div>
                                                    :
                                                    <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_prizes_locked')}</div>
                                            }
                                        </div>
                                    </div>
                                </div>
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

}

module.exports = GameAndPrizeEditor
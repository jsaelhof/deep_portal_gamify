import React from 'react';
import _ from 'underscore';
import String from '../../../common/String.jsx';
import i18n from '../../../../store/i18nStore';
import CampaignValidation from '../../util/CampaignValidation';
import CampaignStore from '../../../../store/CampaignStore';
import ConfigStore from '../../../../store/ConfigStore';
import GUID from '../../../../util/guid';
import TextInput from '../../TextInput.jsx';
import TextArea from '../../TextArea.jsx';
import NumericTextInput from '../../NumericTextInput.jsx';
import ScrollUtils from '../../util/ScrollUtils';
import { DateTimePicker } from 'react-widgets';
import CampaignUtils from '../../util/CampaignUtils';
import CurrentTime from '../schedule/CurrentTime.jsx';
import ImageAsset from '../image/ImageAsset.jsx';

class DrawPrize extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {};
    }

    componentDidUpdate () {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one). In this components case, all the errors that are being checked are in the prize table
        // so just scroll there.
        if (this.props.scrollToError) {
            if (this.props.scrollToError.drawId) {
                ScrollUtils.smoothScroll(this.props.scrollToError.drawId, () => { this.props.onScrollToErrorComplete() } );
            } else if (this.props.scrollToError.prizeId) {
                ScrollUtils.smoothScroll(this.props.scrollToError.prizeId, () => { this.props.onScrollToErrorComplete() } );
            }
        }
    }

    findDraw ( multiDrawEvents, drawId ) {
        let foundDraw;
        multiDrawEvents.forEach( draw => {
            if (draw.id === drawId ) {
                foundDraw = draw;
            }
        } );

        return foundDraw;
    }

    insertNewPrize ( drawId, productType ) {
        // Make a copy of both the prizes and multiDrawEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedMultiDrawEvents = [...this.props.campaignDetails.multiDrawEvents];
        
        // Get a reference to the draw
        let draw = this.findDraw( updatedMultiDrawEvents, drawId );

        // Get a blank prize template
        let newPrize = this.getBlankPrize( productType );

        // Update the prizes object 
        updatedPrizes[newPrize.id] = newPrize;

        // Update the prize events of the correct draw with the prize id
        draw.prizes.push( newPrize.id );
        
        this.props.onUpdate( updatedPrizes, updatedMultiDrawEvents ); 
    }

    getBlankPrize ( productType ) {
        // Update the prizes object 

        let winnerMessage = ConfigStore.getPrizeMessage("drawWinnerMessage");
        if (!winnerMessage) winnerMessage = i18n.stringFor("draw_winner_message");

        return {
            id: GUID.guid(),
            show: "true",
            quantity: "1",
            title: "",
            description: "",
            product_type: productType,
            type: "draw",
            displayIndex: CampaignUtils.getNextPrizeDisplayIndex(this.props.campaignDetails),
            winMessage: winnerMessage
        }
    }

    onPrizeQuantityChange ( id, quantity ) {
        // Do the parseInt/toString thing to sanitize. This removes leading 0's in the string as well as any decimal portion.
        this.prizeDataChange(id, "quantity", parseInt(quantity).toString());
    }

    onPrizeNameChange ( id, name ) {
        this.prizeDataChange(id, "title", name);
    }

    onPrizeCouponCodeChange ( id, couponCode ) {
        this.prizeDataChange(id, "coupon_code", couponCode);
    }

    onPrizeDescriptionChange ( id, prizeDescription ) {
        this.prizeDataChange(id, "description", prizeDescription);
    }

    onPrizeWinMessageChange ( id, winMessage ) {
        this.prizeDataChange(id, "winMessage", winMessage);
    }

    prizeDataChange ( id, key, value ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id][key] = value;
        
        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified multiDrawEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.multiDrawEvents );
    }

    onPrizeImageChange ( id, data, file ) {        
        let type = file.type.split( '/' ).pop();
        let fileName = GUID.randomHex() + "." + type;

        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].image = fileName;
        updatedPrizes[id].image_type = file.type;
        updatedPrizes[id].image_src = data;
        updatedPrizes[id].image_path = "/prizes/" + fileName;
        updatedPrizes[id].image_removed = false;

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified multiDrawEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.multiDrawEvents );
    }

    onToggleVisible ( id ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].image_removed = !updatedPrizes[id].image_removed;

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified multiDrawEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.multiDrawEvents );
    }

    onDeletePrize ( drawId, prizeId ) {
        // Make a copy of both the prizes and drawEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedMultiDrawEvents = this.props.campaignDetails.multiDrawEvents ? [...this.props.campaignDetails.multiDrawEvents] : [];

        // Delete the prize data object
        delete updatedPrizes[prizeId];

        // Delete the multi draw event prizes entry
        let draw = this.findDraw( updatedMultiDrawEvents, drawId );
        let prizes = draw.prizes;
        prizes.splice(prizes.indexOf(prizeId),1);

        // Update the parent
        this.props.onUpdate( updatedPrizes, updatedMultiDrawEvents );
    }

    generatePrizeTable ( drawId, campaignDetails, campaignStatus ) {

        let validationErrors = CampaignValidation.validate( ConfigStore.getProductType(), campaignDetails );

        let rowMap = [
            {
                id: "prizenum",
                label: "",
                css: 'prize-number'
            },
            {
                id: "prizeimage",
                label: "Image",
                css: 'prize-image'
            },
            {
                id: "prizedetails",
                label: "Prize Details",
                css: 'prize-details'
            },
            {
                id: "quantity",
                label: "Quantity",
                css: 'prize-quantity'
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
                case "prizeimage":
                case "prizedetails":
                case "quantity":
                case "delete":
                    return <th key={ '_header_' + element.id }> {element.label} </th>;
                    break;
            }
        } );

        // Figure out how many prizes there are
        let draw = this.findDraw( campaignDetails.multiDrawEvents, drawId );

        // Track the total quantity
        let totalQuantity = 0;

        if (draw.prizes.length === 0) {
            return <div className="m-t-4 m-b-4">No Draw Prizes Configured</div>
        } else {
            // Create the cells
            draw.prizes.forEach( (prizeId, i) => {
                let prize = campaignDetails.prizes[prizeId];

                let cells = rowMap.map( ( element ) => {
                    switch (element.id) {
                        case "prizenum":
                            return <td key={'_td_'+element.id} className={element.css}>
                                    {i+1}
                                </td>
                            break;
                        case "prizeimage":
                            return <td key={'_td_'+element.id} className={element.css}>
                                <ImageAsset 
                                    key={prize.id}
                                    id={prize.id}
                                    mini={true}
                                    initialSource={prize.image_path ? "/customthemes/"+this.props.campaignHash+"/"+prize.image_path : "/dashboard/images/prize/defaultprize_01.png"}
                                    removed={prize.image_removed}
                                    removable={true}
                                    onSetImgSource={this.onPrizeImageChange.bind(this)}
                                    onToggleVisible={this.onToggleVisible.bind(this)}
                                />
                            </td>
                            break;
                        case "prizedetails":
                            let hasInvalidPrizeTitle = validationErrors.filter(error => (error.id === "invalidPrizeTitle" && error.prizeId === prize.id )).length > 0;
                            let hasMissingCouponCode = validationErrors.filter(error => (error.id === "missingCouponCode" && error.prizeId === prize.id )).length > 0;
                            return <td key={'_td_'+element.id} className={element.css}>
                                    {
                                        prize.product_type === "physical" ?
                                        <div className="m-b-2">
                                            <TextInput error={hasInvalidPrizeTitle} id={prize.id} name={element.id} value={prize.title} placeholder={i18n.stringFor("placeholder_prizename")} onChange={this.onPrizeNameChange.bind(this)}/>
                                        </div>
                                        :
                                        <div className="m-b-2 prize-details-coupon-wrapper">
                                            <div>
                                                <TextInput error={hasInvalidPrizeTitle} id={prize.id} name={element.id} value={prize.title} placeholder={i18n.stringFor("placeholder_prizename")} onChange={this.onPrizeNameChange.bind(this)}/>
                                            </div>
                                            <div>
                                                <TextInput error={hasMissingCouponCode} id={prize.id} name={element.id} value={prize.coupon_code} placeholder={i18n.stringFor("placeholder_couponcode")} onChange={this.onPrizeCouponCodeChange.bind(this)}/>
                                            </div>
                                        </div>
                                    }
                                    <div className="m-b-2">
                                        <TextArea id={prize.id} onChange={this.onPrizeDescriptionChange.bind(this)} value={ prize.description } placeholder={i18n.stringFor("placeholder_description")} />
                                    </div>
                                    <div>
                                        <TextInput id={prize.id} onChange={this.onPrizeWinMessageChange.bind(this)} value={ prize.winMessage } placeholder={i18n.stringFor("placeholder_winmessage")} />
                                    </div>
                                </td>
                            break;
                        case "quantity":
                            totalQuantity += parseInt(prize.quantity);
                            return <td key={'_td_'+element.id} className={element.css}>
                                    <div className="m-b-2">
                                        <NumericTextInput id={prize.id} name={element.id} value={ prize.quantity } allowNegative={false} integer={true} onChange={this.onPrizeQuantityChange.bind(this)}/>
                                    </div>
                                </td>
                            break;
                        case "delete":
                            // If the campaign is unscheduled, prizes can be added and deleted EXCEPT for the minimum required prizes for the game.
                            // Once the campaign has been activated, it will either be RUNNING or SUSPENDED. In either case, prizes cannot be deleted as it will cause errors for some users.
                            // Technically new prizes can be added but we would have to figure out how to make them deleteable until they save. But since they have to save to preview, it's likely that 
                            // users might end up stuck with new prizes they didnt intend.
                            if ( campaignStatus === CampaignStore.STATUS_UNSHEDULED ) {
                                let minPrizes = 1; // A draw needs at least one prize.
                                if (draw.prizes.length === minPrizes) {
                                    return <td key={'_td_'+element.id} className={element.css}>
                                        <button className="btn">
                                            <a className="help-tooltip button-tooltip top">
                                            <i className="material-icons md-18">lock_outline</i>
                                                <div className="arrow"></div>
                                                <div className="summary">
                                                    <h4>{i18n.stringFor("sh_tooltip_min_draw_prizes")}</h4>
                                                </div>
                                            </a>
                                        </button>
                                    </td>
                                } else {
                                    return <td key={'_td_'+element.id} className={element.css}>
                                        <button className="btn" onClick={this.onDeletePrize.bind(this,drawId,prize.id)}>
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
                            break;
                    }
                } );

                rows.push(<tr id={prizeId} key={prizeId}>{cells}</tr>);
            } );

            rows.push(
                <tr key="totalQuantity">
                    <td></td>
                    <td></td>
                    <td><div className="prize-quantity-total-label"><String code="label_total_draw_winners"/>:</div></td>
                    <td><div className="prize-quantity-total">{totalQuantity}</div></td>
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
    }

    onAddPhysicalPrize ( drawId ) {
        if (this.canAddPrize()) {
            this.insertNewPrize( drawId, "physical" );
        }
    }

    onAddDiscountPrize ( drawId ) {
        if (this.canAddPrize()) {
            this.insertNewPrize( drawId, "incentive" );
        }
    }

    canAddPrize () {
        return this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED;
    }

    canAddDraw () {
        return this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED;
    }

    onAddDraw () {
        let updatedPrizes = { ...this.props.campaignDetails.prizes };
        let updatedMultiDrawEvents = this.props.campaignDetails.multiDrawEvents ? [ ...this.props.campaignDetails.multiDrawEvents ] : this.props.campaignDetails.multiDrawEvents = [];

        let newPrize = this.getBlankPrize( "physical" );

        let drawId = GUID.guid();

        let displayIndex = CampaignUtils.getNextDrawDisplayIndex(this.props.campaignDetails);

        updatedMultiDrawEvents.push( {
            "id": drawId,
            "label": "Draw #" + (displayIndex + 1),
            "description": undefined,
            "prizes": [ newPrize.id ],
            "options": {
                // "start": i18n.moment().add(1, 'days').format( CampaignStore.dateInputFormat ),
                // "end": i18n.moment().add(3, 'days').format( CampaignStore.dateInputFormat )
            },
            "displayIndex": displayIndex
        } );

        updatedPrizes[newPrize.id] = newPrize;

        // Update the parent.
        this.props.onUpdate( updatedPrizes, updatedMultiDrawEvents );
    }

    generateDrawTable ( campaignDetails, campaignStatus ) {

        let validationErrors = CampaignValidation.validate( ConfigStore.getProductType(), campaignDetails, campaignStatus );

        let draws = [];

        // Create the draws
        let numDraws = campaignDetails.multiDrawEvents ? campaignDetails.multiDrawEvents.length : 0;

        for (let i=0; i<numDraws; i++) {
            let draw = campaignDetails.multiDrawEvents[i];

            let hasInvalidDrawTitle = validationErrors.filter(error => (error.id === "invalidDrawTitle" && error.drawId === draw.id )).length > 0;
            let drawDateMissing = validationErrors.filter(error => (error.id === "drawDateMissing" && error.drawId === draw.id )).length > 0;
            let startDateMissing = validationErrors.filter(error => (error.id === "startDateMissing" && error.drawId === draw.id )).length > 0;
            let drawOccursInThePast = validationErrors.filter(error => (error.id === "drawOccursInThePast" && error.drawId === draw.id )).length > 0;
            let startOccursAfterDraw = validationErrors.filter(error => (error.id === "startOccursAfterDraw" && error.drawId === draw.id )).length > 0;

            draws.push(
                <div key={draw.id} id={draw.id} className="multi-draw m-b-14 m-t-8">
                    <div>
                        {/* <div className="multi-draw-title m-b-4">Draw #{draw.displayIndex + 1}</div> */}

                        <div className="m-b-2 w-350">	
                            <h4>Draw Name</h4>
                            <TextInput error={ hasInvalidDrawTitle } id={draw.id} name="drawName" value={draw.label} placeholder={"Draw Name"} onChange={this.onDrawNameChange.bind(this)}/>	
                        </div>

                        <div className="date-time-select-group form-group m-t-6 m-b-4">
                            <h4>Start Date</h4>
                            <DateTimePicker 
                                min={ new Date() }
                                value={ draw.options.start ? new Date(draw.options.start) : undefined } 
                                format={CampaignStore.dateTimePickerDateFormat} 
                                time={false} 
                                placeholder="Date"
                                readonly={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                disabled={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                onChange={ this.onDrawDateChange.bind(this, draw.id, "start") } 
                            />

                            <DateTimePicker 
                                value={ draw.options.start ? new Date(draw.options.start) : undefined } 
                                format={CampaignStore.dateTimePickerTimeFormat}
                                date={false}
                                placeholder="Time"
                                readonly={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                disabled={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                onChange={ this.onDrawTimeChange.bind(this, draw.id, "start") } 
                            />

                            { CampaignStore.isNotUnscheduled(campaignStatus) ?
                                <i className="material-icons schedule-lock">lock_outline</i>
                                :
                                null
                            }

                            { startDateMissing ?
                                <div className="invalid-field date-time-select-error">Set a starting date for the draw.</div>
                                :
                                startOccursAfterDraw ? 
                                    <div className="invalid-field date-time-select-error">The Start Date must occur before the Draw Date.</div>
                                    :
                                    null
                            }
                        </div>
                        <div className="date-time-select-group form-group m-t-4 m-b-2">
                            <h4>Draw Date</h4>
                            <DateTimePicker 
                                min={ new Date() }
                                value={ draw.options.end ? new Date(draw.options.end) : undefined } 
                                format={CampaignStore.dateTimePickerDateFormat} 
                                time={false} 
                                placeholder="Date"
                                readonly={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                disabled={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                onChange={ this.onDrawDateChange.bind(this, draw.id, "end") } 
                            />

                            <DateTimePicker 
                                value={ draw.options.end ? new Date(draw.options.end) : undefined } 
                                format={CampaignStore.dateTimePickerTimeFormat}
                                date={false}
                                placeholder="Time"
                                readonly={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                disabled={ CampaignStore.isNotUnscheduled(campaignStatus) }
                                onChange={ this.onDrawTimeChange.bind(this, draw.id, "end") } 
                            />

                            { CampaignStore.isNotUnscheduled(campaignStatus) ?
                                <i className="material-icons schedule-lock">lock_outline</i>
                                :
                                null
                            }

                            { drawDateMissing ?
                                <div className="invalid-field date-time-select-error">Set a date for the draw to take place.</div>
                                :
                                drawOccursInThePast ? 
                                    <div className="invalid-field date-time-select-error">This date occurs in the past.</div>
                                    :
                                    null
                            }
                        </div>
                        <div className="date-time-select-group form-group m-t-2 m-b-8">
                            <CurrentTime 
                                timezone={campaignDetails.timezone}
                            />
                        </div>
                    </div>
                    { 
                        this.generatePrizeTable( draw.id, campaignDetails, campaignStatus ) 
                    }

                    { 
                        this.canAddPrize() ?
                            <div className="m-t-8">
                                <button className="btn btn-primary round m-b-3 m-r-4" onClick={this.onAddPhysicalPrize.bind(this, draw.id)}>+ Add Draw Prize</button>
                                <button className="btn btn-default round m-b-3 m-r-4" onClick={this.onDeleteDraw.bind(this, draw.id)}>Remove Draw</button>
                            </div>
                            :
                            null
                    }


                    <hr className="m-t-8" />
                </div>
            );
        }

        return (
            <div>{ draws }</div>
        );
    }

    onDrawNameChange ( id , drawName ) {
        this.drawDataChange(id, "label", drawName);
    }

    onDrawDescriptionChange ( id , drawDescription ) {
        this.drawDataChange(id, "description", drawDescription);
    }

    drawDataChange ( id, key, value ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedMultiDrawEvents = [ ...this.props.campaignDetails.multiDrawEvents ];

        this.findDraw( updatedMultiDrawEvents, id )[key] = value;
        
        // Update the parent. Since we're only modifying existing multiDrawEvent data (not adding/modifying prizes), we'll send the unmodifed prizes and the updated multiDrawEvents.
        this.props.onUpdate( this.props.campaignDetails.prizes, updatedMultiDrawEvents );
    }

    onDrawDateChange ( id, dateKey, dateObj, display ) {
        if (dateObj !== null) {
            // Grab the campaign details so we can update and then assign the updated details back.
            let updatedMultiDrawEvents = [ ...this.props.campaignDetails.multiDrawEvents ];

            let draw = this.findDraw( updatedMultiDrawEvents, id );
            draw.options[dateKey] = i18n.moment( dateObj ).format( CampaignStore.dateInputFormat );

            // Update the parent. Since we're only modifying existing multiDrawEvent data (not adding/modifying prizes), we'll send the unmodifed prizes and the updated multiDrawEvents.
            this.props.onUpdate( this.props.campaignDetails.prizes, updatedMultiDrawEvents );
        }
    }

    onDrawTimeChange ( id, dateKey, dateObj, display ) {
        if (dateObj !== null) {
            // Grab the campaign details so we can update and then assign the updated details back.
            let updatedMultiDrawEvents = [ ...this.props.campaignDetails.multiDrawEvents ];

            let draw = this.findDraw( updatedMultiDrawEvents, id );

            // There seems to be a bug in the date time picker component.
            // If you manually type in a time (not just select one from the dropdown...thats fine), then the date resets to today's date.
            // So to fix it, i have manage time changes separately and build it by getting the date from the campaign details and the time from this new date object, then piece it together.
            let date = i18n.moment( draw.options[dateKey] ).format( CampaignStore.dateOnlyInputFormat );
            let time = i18n.moment( dateObj ).format( CampaignStore.timeOnlyInputFormat );

            draw.options[dateKey] = date + " " + time;

            // Update the parent. Since we're only modifying existing multiDrawEvent data (not adding/modifying prizes), we'll send the unmodifed prizes and the updated multiDrawEvents.
            this.props.onUpdate( this.props.campaignDetails.prizes, updatedMultiDrawEvents );
        }
    }

    onDeleteDraw ( id ) {
        // Delete prizes
        // Make a copy of both the prizes and drawEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedMultiDrawEvents = this.props.campaignDetails.multiDrawEvents ? [...this.props.campaignDetails.multiDrawEvents] : [];

        let draw = this.findDraw( updatedMultiDrawEvents, id );
        let prizes = draw.prizes;

        // Loop over all the prizes and remove the ones that are part of this draw.
        prizes.forEach( prizeId => {
            delete updatedPrizes[prizeId];
        } );

        // Get a new array with this draw removed.
        updatedMultiDrawEvents = _.reject( updatedMultiDrawEvents, draw => { return draw.id === id } );

        // Update the parent
        this.props.onUpdate( updatedPrizes, updatedMultiDrawEvents );
    }

    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <div className="panel-title">
                                    <h1>Draw Prizes</h1>
                                </div>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="w-800 m-t-1 m-b-6">
                                <div className="m-b-2">Draw Prizes allow you to enter your players into a draw for one or more prizes. You can configure multiple draws, each with their own set of prizes. Need help? See <a href="https://support.deepmarkit.com/hc/en-us/articles/360008099333" target="_blank">our guide on draws and draw prizes</a>.</div>
                            </div>

                            <div>
                                { 
                                    this.props.campaignDetails.multiDrawEvents && this.props.campaignDetails.multiDrawEvents.length > 0 ?
                                        this.generateDrawTable( this.props.campaignDetails, this.props.campaignStatus ) 
                                        :
                                        null
                                }
                            </div>

                            { this.canAddDraw() ?
                                <button className="btn btn-primary round m-b-3" onClick={this.onAddDraw.bind(this)}>+ New Draw</button>
                                :
                                <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_social_draws_locked')}</div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = DrawPrize;
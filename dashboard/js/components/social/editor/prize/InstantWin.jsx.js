import React from 'react';
import _ from 'underscore';
import String from '../../../common/String.jsx';
import i18n from '../../../../store/i18nStore';
import CampaignValidation from '../../../shared/util/CampaignValidation';
import CampaignStore from '../../../../store/CampaignStore';
import ConfigStore from '../../../../store/ConfigStore';
import GUID from '../../../../util/guid';
import TextInput from '../../../shared/TextInput.jsx';
import TextArea from '../../../shared/TextArea.jsx';
import NumericTextInput from '../../../shared/NumericTextInput.jsx';
import ScrollUtils from '../../../shared/util/ScrollUtils';
import CampaignUtils from '../../../shared/util/CampaignUtils';
import ImageAsset from '../../../shared/editor/image/ImageAsset.jsx';

class Prizes extends React.Component {

    constructor ( props ) {
        super( props );
    }

    componentDidUpdate (newProps) {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one).
        if (this.props.scrollToError) {
            ScrollUtils.smoothScroll(this.props.scrollToError.prizeId, () => { this.props.onScrollToErrorComplete() } );
        }
    }

    getTotalWeight () {
        let totalWeight = 0;

        if (this.props.campaignDetails.instantEvents) {
            this.props.campaignDetails.instantEvents.forEach(guid => {
                let prizeData = this.props.campaignDetails.prizes[guid];

                // Add this prizes win percent to the total.
                totalWeight += parseInt(prizeData.weight);
            });

            return totalWeight;
        }
    }

    // NOTE: Do not read these directly all the time. Sometimes we need to pass in the updated but not yet saved versions to calculate with.
    // Thats why i made them arguments instead of using the campaign. We can choose which ones are relvenat based on the situation.
    getTotalPrizeWinPercent ( prizes, instantEvents ) {
        // Calculate the total win percent of all rpizes to make sure it's valid
        let totalWinPercent = 0;

        if (instantEvents) {
            instantEvents.forEach(guid => {
                let prizeData = prizes[guid];

                // Add this prizes win percent to the total.
                totalWinPercent += parseFloat(prizeData.winPercent);
            });
        }

        return this.fixPrecision(totalWinPercent);
    }

    getTotalWinPercent () {
        return this.fixPrecision( this.getTotalPrizeWinPercent( this.props.campaignDetails.prizes, this.props.campaignDetails.instantEvents ) + this.props.campaignDetails.loss.lossPercent );
    }

    createNewPrize ( productType ) {
        // Make a copy of both the prizes and instantEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedInstantEvents = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.slice() : [];
        let updatedLoss = {...this.props.campaignDetails.loss};

        let guid = GUID.guid();

        let winnerMessage;
        if (productType === "physical") {
            winnerMessage = ConfigStore.getPrizeMessage("physicalWinnerMessage");
            if (!winnerMessage) winnerMessage = i18n.stringFor("physical_winner_message");
        } if (productType === "incentive") {
            winnerMessage =  ConfigStore.getPrizeMessage("couponWinnerMessage");
            if (!winnerMessage) winnerMessage = i18n.stringFor("coupon_winner_message");
        }

        // Update the prizes object 
        updatedPrizes[guid] = {
            id: guid,
            show: "true",
            quantity: "0",
            title: "",
            description: "",
            winPercent: "0",
            weight: "0",
            product_type: productType,
            type: "instant",
            displayIndex: CampaignUtils.getNextPrizeDisplayIndex(this.props.campaignDetails),
            winMessage: winnerMessage
        }

        // Update the instant events with the prize id
        updatedInstantEvents.push( guid );
        
        this.updateWinPercents( updatedPrizes, updatedInstantEvents, updatedLoss );
    }

    onPrizeWeightChange ( id, weight ) {
        // If the weight can't be parsed, treat it as 0 in the calulation.
        // The input field prevents almost all cases so this would typically only happen if the weight is an empty string (user backspaces all chars)
        if (isNaN(parseFloat(weight))) weight = "0";

        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].weight = weight;

        let updatedLoss = {...this.props.campaignDetails.loss};

        this.updateWinPercents(updatedPrizes,this.props.campaignDetails.instantEvents,updatedLoss);
    }

    onLossWeightChange ( id, weight ) {
        // Save the new loss weight.
        // Then update the win percentages for all prizes based on the new value.
        // Once updated, recalculate the new percentage of the loss scenario.
        // Then update the parent.

        let updatedPrizes = {...this.props.campaignDetails.prizes};

        let updatedLoss = {...this.props.campaignDetails.loss};
        updatedLoss.weight = parseInt(weight);

        this.updateWinPercents(updatedPrizes,this.props.campaignDetails.instantEvents,updatedLoss);
    }

    updateWinPercents ( prizesObject, instantEventsObject, lossObject ) {
        // Set a var to track the totals.
        let totalWeight = 0;
        let totalPercent = 0;

        // Go through all the prizes and total up all the weights.
        for (let prizeId of instantEventsObject) {
            totalWeight += parseFloat(prizesObject[prizeId].weight);
        }
        
        // Add the weight of the no-win scenario
        totalWeight += lossObject.weight;

        // Once totaled, go through the list of prizes again and calculate the percentage, and assign it.
        for (let i=0; i<instantEventsObject.length; i++) {
            // Get the prize id to work on
            let prizeId = instantEventsObject[i];

            // Calculate the percentage.
            let percent;
            if (totalWeight === 0) {
                percent = 0;
            } else {
                percent = 100 * (parseFloat(prizesObject[prizeId].weight) / totalWeight);
                percent = this.fixPrecision(percent);
            } 

            totalPercent += percent;

            // Update the value in the prizes.
            prizesObject[prizeId].winPercent = percent.toString();
        }

        // Update the loss scenario percentage.
        // If the totalWeight is 0, then all weights have been set to 0 manually and cannot be assumed to be 100 - totalWinPercent because if
        // all the other prizes are 0 weight as well, 100 - 0 is 100 but the percent can't be 100 if the weight is 0.
        lossObject.lossPercent = lossObject.weight === 0 ? 0 : this.fixPrecision( 100 - this.getTotalPrizeWinPercent( prizesObject, instantEventsObject ) );

        this.props.onUpdate( prizesObject, instantEventsObject, lossObject );
    }

    fixPrecision( num ) {
        let precision = 2;
        return parseFloat(num.toFixed(precision));
    }

    onPrizeQuantityChange ( id, quantity ) {
        // Do the parseInt/toString thing to sanitize. This removes leading 0's in the string as well as any decimal portion.
        this.prizeDataChange(id, "quantity", parseInt(quantity).toString());
    }

    onPrizeUnlimitedChange ( id ) {
        this.prizeDataChange(id, "quantity", (this.props.campaignDetails.prizes[id].quantity === "-1") ? "0" : "-1");
    }

    onPrizeNameChange ( id, name ) {
        this.dirtyPreview = true;
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
        
        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified instantEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.instantEvents, this.props.campaignDetails.loss );
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

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified instantEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.instantEvents, this.props.campaignDetails.loss );
    }

    onToggleVisible ( id ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].image_removed = !updatedPrizes[id].image_removed;

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified instantEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.instantEvents, this.props.campaignDetails.loss );
    }

    onDeletePrize ( prizeId ) {
        this.dirtyPreview = true;

        // Make a copy of both the prizes and instantEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedInstantEvents = this.props.campaignDetails.instantEvents ? this.props.campaignDetails.instantEvents.slice() : [];
        let updatedLoss = {...this.props.campaignDetails.loss};

        // Delete the prize data object
        delete updatedPrizes[prizeId];

        // Delete the instant events entry
        updatedInstantEvents.splice(updatedInstantEvents.indexOf(prizeId),1);
        
        // Re-calc the win percents now that the prize has been removed.
        this.updateWinPercents(updatedPrizes,updatedInstantEvents,updatedLoss);
    }

    isWinPercentValid () {
        return this.getTotalWinPercent() === 100;
    }

    generatePrizeTable () {

        let validationErrors = CampaignValidation.validate( ConfigStore.getProductType(), this.props.campaignDetails );
        let hasInvalidWinPercent = !this.isWinPercentValid();

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
                case "prizeimage":
                case "prizedetails":
                case "quantity":
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
                        let quantity = parseInt(prize.quantity);
                        return <td key={'_td_'+element.id} className={element.css}>
                                { quantity < 0 ?
                                    null
                                    :
                                    <div className="m-b-2">
                                        <NumericTextInput id={prize.id} name={element.id} value={ prize.quantity } allowNegative={false} integer={true} onChange={this.onPrizeQuantityChange.bind(this)}/>
                                    </div>
                                }
                                <div>
                                    <input type="checkbox" name="unlimited" value="unlimited" onChange={this.onPrizeUnlimitedChange.bind(this,prize.id)}/>
                                    <label htmlFor="unlimited">Unlimited</label>
                                </div>
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
                        // If the campaign is unscheduled, prizes can be added and deleted EXCEPT for the minimum required prizes for the game.
                        // Once the campaign has been activated, it will either be RUNNING or SUSPENDED. In either case, prizes cannot be deleted as it will cause errors for some users.
                        // Technically new prizes can be added but we would have to figure out how to make them deleteable until they save. But since they have to save to preview, it's likely that 
                        // users might end up stuck with new prizes that they could only "remove" by weighting them to zero.
                        if ( this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED ) {
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

            rows.push(<tr id={prize.id} key={i}>{cells}</tr>);
        }

        rows.push(
            <tr key="lossRow">
                <td></td>
                <td></td>
                <td>No Winners</td>
                <td>-</td>
                <td key={'_td_weight'} className="prize-probability">
                    <NumericTextInput error={hasInvalidWinPercent} id="loss" value={ this.props.campaignDetails.loss.weight } onChange={this.onLossWeightChange.bind(this)}/>
                </td>
                <td key={'_td_slash'} className="prize-slash">/</td> 
                <td key={'_td_percent'} className="prize-percent">
                    {this.props.campaignDetails.loss.lossPercent + "%"}
                </td>
                <td></td>
            </tr>
        )

        rows.push(
            <tr key="winPercentRow">
                <td></td>
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

    onAddPhysicalPrize () {
        if (this.canAddPrize()) {
            this.createNewPrize( "physical" );
        }
    }

    onAddDiscountPrize () {
        if (this.canAddPrize()) {
            this.createNewPrize( "incentive" );
        }
    }

    canAddPrize () {
        return this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED;
    }

    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    Instant Win Prizes
                                </h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="w-800 m-t-1 m-b-6">
                                <div className="m-b-2">Instant Win prizes are awarded to the player immediately upon completion of game play. Prizes can be physical items or discount/coupon codes. Prizes are awarded based on odds that you define for them. You may also define how often players that will not win an Instant Win prize. Need help? See <a href="https://support.deepmarkit.com/hc/en-us/articles/360008098913" target="_blank">our guide on Instant Win Prizes</a>.</div>
                            </div>

                            <div id="PrizeTable">
                                { 
                                    this.props.campaignDetails.instantEvents && this.props.campaignDetails.instantEvents.length > 0 ?
                                        this.generatePrizeTable() 
                                        :
                                        null
                                }

                                { this.canAddPrize() ?
                                    <div className="m-t-8">
                                        <button className="btn btn-primary round m-b-3 m-r-4" onClick={this.onAddPhysicalPrize.bind(this)}>+ Add Physical Prize</button>
                                        <button className="btn btn-primary round m-b-3" onClick={this.onAddDiscountPrize.bind(this)}>+ Add Discount Prize</button>
                                    </div>
                                    :
                                    <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_social_prizes_locked')}</div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Prizes;
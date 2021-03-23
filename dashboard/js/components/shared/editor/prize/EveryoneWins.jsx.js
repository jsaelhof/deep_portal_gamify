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
import ScrollUtils from '../../../shared/util/ScrollUtils';
import CampaignUtils from '../../../shared/util/CampaignUtils';
import ImageAsset from '../../../shared/editor/image/ImageAsset.jsx';

class EveryoneWins extends React.Component {

    constructor ( props ) {
        super( props );
    }

    componentDidMount () {
        // If the giveaway events does not exist and there are default prizes passed in, create the default prizes.
        // DO NOT do this if the giveawayEvents exists and is just empty or less than the length of the default prizes as 
        // that would indicate that someone has deleted the prizes entirely or below the number of prizes created by default
        // which is ok give nthe current requirements. If this class ever needs to support a true minimum number of prizes
        // then we will need to factor that in but in that case the UI should be set up so that users cannot delete prizes
        // below the minimum.
        if (!this.props.campaignDetails.giveawayEvents && this.props.defaultPrizes && this.props.defaultPrizes.length > 0) {
            this.props.defaultPrizes.forEach(defaultPrize => {
                this.createNewPrize( defaultPrize.type, defaultPrize, true );
            });
        }
    }

    componentDidUpdate () {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one).
        if (this.props.scrollToError) {
            ScrollUtils.smoothScroll(this.props.scrollToError.prizeId, () => { this.props.onScrollToErrorComplete() } );
        }
    }

    createNewPrize ( productType, defaultPrizeData, secretSave ) {
        // Make a copy of both the prizes and giveawayEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedGiveawayEvents = this.props.campaignDetails.giveawayEvents ? this.props.campaignDetails.giveawayEvents.slice() : [];

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
            quantity: "-1",
            title: (defaultPrizeData && defaultPrizeData.title) || "",
            description: (defaultPrizeData && defaultPrizeData.description) || "",
            winPercent: "0",
            weight: "0",
            product_type: productType,
            type: "giveaway",
            displayIndex:  CampaignUtils.getNextPrizeDisplayIndex(this.props.campaignDetails),
            awardExclusive: "false",
            winMessage: winnerMessage
        }

        // Update the giveaway events with the prize id
        updatedGiveawayEvents.push( guid );
        
        this.props.onUpdate( updatedPrizes, updatedGiveawayEvents, secretSave ); 
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

    onPrizeExclusiveChange ( id ) {
        this.prizeDataChange(id, "awardExclusive", this.props.campaignDetails.prizes[id].awardExclusive === "true" ? "false" : "true" );
    }

    prizeDataChange ( id, key, value ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id][key] = value;
        
        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified giveawayEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.giveawayEvents );
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

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified giveawayEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.giveawayEvents );
    }

    onToggleVisible ( id ) {
        // Grab the campaign details so we can update and then assign the updated details back.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        updatedPrizes[id].image_removed = !updatedPrizes[id].image_removed;

        // Update the parent. Since we're only modifying existing prize values (not adding new prizes), we'll send the updated prizes and the existing unmodified giveawayEvents.
        this.props.onUpdate( updatedPrizes, this.props.campaignDetails.giveawayEvents, this.props.campaignDetails.loss );
    }

    onDeletePrize ( prizeId ) {
        this.dirtyPreview = true;

        // Make a copy of both the prizes and giveawayEvents objects because we'll be modifying them.
        let updatedPrizes = {...this.props.campaignDetails.prizes};
        let updatedGiveawayEvents = this.props.campaignDetails.giveawayEvents ? this.props.campaignDetails.giveawayEvents.slice() : [];

        // Delete the prize data object
        delete updatedPrizes[prizeId];

        // Delete the giveaway events entry
        updatedGiveawayEvents.splice(updatedGiveawayEvents.indexOf(prizeId),1);

        // Re-calc the win percents now that the prize has been removed.
        this.props.onUpdate( updatedPrizes, updatedGiveawayEvents );
    }

    generatePrizeTable () {

        let validationErrors = CampaignValidation.validate( ConfigStore.getProductType(), this.props.campaignDetails );

        let rowMap = [];
        rowMap.push(
            {
                id: "prizenum",
                label: "",
                css: 'prize-number'
            }
        );

        if (!this.props.hidePrizeImage) {
            rowMap.push(
                {
                    id: "prizeimage",
                    label: "Image",
                    css: 'prize-image'
                }
            );
        }

        rowMap.push(
            {
                id: "prizedetails",
                label: "Prize Details",
                css: 'prize-details'
            }
        );

        rowMap.push(
            {
                id: "delete",
                label: "",
                css: 'prize-delete'
            }
        );

        // Create an array to store all of the rows
        let rows = [];

        // Build the header row
        let headerCells = rowMap.map( ( element ) => {
            switch (element.id) {
                case "prizenum":
                case "prizeimage":
                case "prizedetails":
                case "delete":
                    return <th key={ '_header_' + element.id }> {element.label} </th>;
                    break;
            }
        } );

        // Create the cells
        let numPrizes = this.props.campaignDetails.giveawayEvents ? this.props.campaignDetails.giveawayEvents.length : 0;

        for (let i=0; i<numPrizes; i++) {

            let prize = this.props.campaignDetails.prizes[this.props.campaignDetails.giveawayEvents[i]];

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
                                { this.props.hideWinMessage ?
                                    null
                                    :
                                    <div>
                                        <TextInput id={prize.id} onChange={this.onPrizeWinMessageChange.bind(this)} value={ prize.winMessage } placeholder={i18n.stringFor("placeholder_winmessage")} />
                                    </div>
                                }
                                { this.props.hideExclusive ?
                                    null
                                    :
                                    <div className="prize-exclusive">
                                        <input type="checkbox" defaultChecked={ prize.awardExclusive === "true" } onChange={ this.onPrizeExclusiveChange.bind(this, prize.id) }/>
                                        <label>Only award this prize if no other prize is won</label>
                                    </div>
                                }
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
        return this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED && (!this.props.maxPrizes || !this.props.campaignDetails.giveawayEvents || this.props.campaignDetails.giveawayEvents.length < this.props.maxPrizes);
    }

    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    Everyone Wins Prizes
                                </h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="w-800 m-t-1 m-b-6">
                                {
                                    this.props.hideExclusive ?
                                        <div className="m-b-2">Everyone Wins prizes are awarded to all players. Need help? See <a href="https://support.deepmarkit.com/hc/en-us/articles/360007985314" target="_blank">our guide on Everyone Wins prizes</a>.</div>
                                        :
                                        <div className="m-b-2">Everyone Wins prizes are awarded to all players. Optionally you may choose to only award them if no other prize was awarded. Need help? See <a href="https://support.deepmarkit.com/hc/en-us/articles/360007985314" target="_blank">our guide on Everyone Wins prizes</a>.</div>
                                }
                            </div>
                            
                            <div id="EveryoneWinsTable">
                                { 
                                    this.props.campaignDetails.giveawayEvents && this.props.campaignDetails.giveawayEvents.length > 0 ?
                                        this.generatePrizeTable() 
                                        :
                                        null
                                }

                                { this.canAddPrize() ?
                                    <div className="m-t-8">
                                        { this.props.hidePhysical ? null : <button className="btn btn-primary round m-b-3 m-r-4" onClick={this.onAddPhysicalPrize.bind(this)}>+ Add Physical Prize</button> }
                                        { this.props.hideDiscount ? null : <button className="btn btn-primary round m-b-3" onClick={this.onAddDiscountPrize.bind(this)}>+ Add Discount Prize</button> }
                                    </div>
                                    :
                                    this.props.campaignStatus === CampaignStore.STATUS_UNSHEDULED ?
                                        <div style={{ color: "#999", fontSize: "12px", padding: "5px 0" }}>{i18n.stringFor('sh_label_max_prizes_campaign')}</div>
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

module.exports = EveryoneWins;
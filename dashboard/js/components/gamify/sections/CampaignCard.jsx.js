import React from 'react';

import { browserHistory as History } from 'react-router';
import GameStore from '../../../store/GameStore';
import CampaignStore from '../../../store/CampaignStore';
import ConfigStore from '../../../store/ConfigStore';
import i18n from '../../../store/i18nStore';
import Modal from '../../common/Modal.jsx';
import String from '../../common/String.jsx';
import UserStore from '../../../store/UserStore';
import Loading from '../../shared/Loading.jsx';
import _ from 'underscore';
import CampaignUtils from '../../shared/util/CampaignUtils';
import TimezoneStore from '../../../store/TimezoneStore';
import Confirm from '../../shared/Confirm.jsx';

class CampaignCard extends React.Component {
    constructor ( props ) {
        super( props );

        let user = UserStore.getImmutableState();

        this.state = {
            stats: undefined,
            cloning: false,
            deleteing: false,
            showConfirmDelete: false,
            authorizationUrl: undefined,
            displayName: undefined,
            gameDetails: undefined,
            legacyCloneWarning: false
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        GameStore.addEventListener( this );
    }
    componentDidMount () {
        // If the game has been selected, get the info for it.
        // Otherwise, the card will render to show that there is no game selected yet.
        if (this.props.campaignDetails.selectedGame) {
            GameStore.getGameInfo( this.getGameId() );
            GameStore.getDetailsForGame( this.getGameId(), ConfigStore.getProductTag(this.props.product) );
        }

        CampaignStore.getCampaignStats( 
            [ this.props.campaignHash ],
            ["PRIZES", "DRAWS", "LEADS", "VIEWS", "ACTIVE"]
        );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        GameStore.removeEventListener( this );
    }
    onGameInfoLoaded ( e ) {
        // TODO: This check exists because other cards will ask for the same requests and this event will fire with their data.
        // Refactor the game store to allow you to pass in an onSuccess handler for this specific request.
        if (this.props.campaignDetails.selectedGame && e.data.name === this.getGameId()) {
            this.setState( { displayName: e.data.game.displayName } );
        }
    }
    onGameDetailsRetrieved ( e ) {
        if (e.result && e.result.game) {
            // TODO: This check exists because other cards will ask for the same requests and this event will fire with their data.
            // Refactor the game store to allow you to pass in an onSuccess handler for this specific request.
            if (this.props.campaignDetails.selectedGame && e.result.game.gameKey === this.getGameId()) {
                this.setState( { gameDetails: e.result.game } );
            } 
        }
    }
    onCampaignStatsRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // TODO: Handle the error
        } else {
            if (e.response.modifiedResult[this.props.campaignHash]) {
                this.setState( { stats: e.response.modifiedResult[this.props.campaignHash] } );
            }
        }
    }

    onView () {
        this.props.onView( this.props.campaignHash );
    }
    onEdit () {
        History.push(
            ConfigStore.buildRoutePath('edit/'+this.props.campaignHash+(this.state.needsPreview ? '?needsPreview=true' : ''), this.props.product)
        );
    }
    onGameSelect () {
        History.push(
            ConfigStore.buildRoutePath('newcampaign/'+this.props.campaignHash, this.props.product)
        )
    }
    onDelete () {
        this.setState( { showConfirmDelete: true } );
    }
    onConfirmDelete () {}
    onCancelDelete () {
        this.setState( { showConfirmDelete: false } );
    }
    onDeleteComplete () {
        this.setState( { showConfirmDelete: false } );
        this.props.onRefreshCampaignList(this.props.product);
    }
    onClone () {
        CampaignStore.clone( this.props.campaignHash, 'Copy of ' + this.props.name, ( e ) => {
            if ( e.response && e.response.hasErrors() ) {
                // TODO: Handle the error
                this.setState( { cloning: false } );
            } else {
                this.props.onRefreshCampaignList(this.props.product);
                this.setState( { cloning: false } );
            }
        } );
        this.setState( { cloning: true } );
    }
    onLegacyClone () {
        this.setState( { legacyCloneWarning: true } );
    }
    onConfirmLegacyCloneWarning () {
        this.setState( { legacyCloneWarning: false } );
    }
    onCancel () {
        this.props.onCancel( this.props.campaignHash );
    }
    onActivate () {
        this.props.onActivate( this.props.campaignHash );
    }
    onWinners () {
        History.push(ConfigStore.buildRoutePath('winners/'+this.props.campaignHash, this.props.product));
    }

    isActive () {
        return this.props.status === CampaignStore.STATUS_ACTIVE;
    }

    getGameId () {
        return this.props.campaignDetails.selectedGame["game-type"];
    }

    getSkinId () {
        return this.props.campaignDetails.selectedGame["skin-name"];
    }

    //
    onPaymentAuthorizationReceived(e) {

        if( e.response && !e.response.hasErrors() ) {

            let authorization = e.response.result.proxyResponse;

            this.setState(
                // the line below needs to change ...
                { authorizationUrl: authorization }
            );
        }
    }

    countDays ( minutes ) {
        //divide by 60 minutes to get hours and by 24 hours to get days.
        // use Math.ceil to round up to the nearest integer.
        if (minutes === 0 || minutes === undefined) {
            return 0;
        } else {
            return Math.ceil( ( ( minutes || 0 ) / 60 ) / 24 );
        }
    }

    getLeadsPerDay ( minutes, leads ) {
        let days = this.countDays(minutes);
        if (days === 0) {
            return 0;
        } else {
            let leadsPerDay = leads / days;
            let formattedLeadsPerDay = leadsPerDay.toFixed(1);
            if (formattedLeadsPerDay.split(".")[1] === "0") {
                return formattedLeadsPerDay.split(".")[0];
            } else {
                return formattedLeadsPerDay;
            }
        }
    }

    calculateConversionRate ( stats ) {
        let leads = stats.LEADS || 0;
        let views = stats.VIEWS ? stats.VIEWS.CAMPAIGN_VIEW || 0 : 0;
        let rate = leads/views;

        // Check if this campaigns has no leads or views.
        // If so, 0/0 results in NaN for the rate.
        // Just set it to 0 since this campaign has not been used at all.
        if (leads === 0 && views === 0) {
            return 0;
        }

        // Check if there are leads but no views. This will result in a rate of "infinity".
        // This probably shouldn't happen under normally circumstances but i've been seeing it in dev. 
        // In this case, I guess show 100% conversion because you have more leads than views.
        if (leads > 0 && views === 0) {
            return 1;
        } 
        
        // Check if there are more leads than views.
        // This probably shouldn't happen under normally circumstances but i've been seeing it in dev. 
        // In this case, I guess show 100% conversion because you have more leads than views.
        if (leads > views) {
            return 1;
        }

        // This should have been caught above but if for any other reason there is a rate greater than 1, just set it to 1.
        if (rate > 1) {
            return 1;
        }

        // Not sure what would result in a negative rate but if so, return 0.
        if (rate < 0) {
            return 0;
        }

        // No special cases left to check, if we got here, just return the calculated rate.
        return rate;
    }

    formatConversionRate ( rate ) {
        return Math.floor(rate*100);
    }

    getStatusLabel () {
        switch (this.props.status) {
            case CampaignStore.STATUS_UNSHEDULED:
                return "Draft";
                break;
            case CampaignStore.STATUS_RUNNING:
            case CampaignStore.STATUS_SCHEDULED:
                return "Active";
                break;
            case CampaignStore.STATUS_DELETED:
            case CampaignStore.STATUS_CANCELLED:
            case CampaignStore.STATUS_SUSPENDED:
            case CampaignStore.STATUS_ENDED:
                return "Ended"
                break;
        }
    }

    getStatusClass () {
        switch (this.props.status) {
            case CampaignStore.STATUS_UNSHEDULED:
                return "status-draft";
                break;
            case CampaignStore.STATUS_RUNNING:
            case CampaignStore.STATUS_SCHEDULED:
                return "status-running";
                break;
            case CampaignStore.STATUS_DELETED:
            case CampaignStore.STATUS_CANCELLED:
            case CampaignStore.STATUS_SUSPENDED:
            case CampaignStore.STATUS_ENDED:
                return "status-ended";
                break;
        }
    }

    getCardButtons () {
        // If this is a template 3 campaign, we don't want to let them clone it. We want to deprecate it.
        let cloneHandler = (this.props.campaignDetails.themeInfo.layout === "template-03") ? this.onLegacyClone : this.onClone;
                    
        if (this.props.campaignDetails.selectedGame) {
            if (CampaignStore.isComplete(this.props.status)) {
                return <div className="card-ctrl">
                    <button className="card-button" onClick={this.onEdit.bind(this)}><i className="material-icons">edit</i>{i18n.stringFor("sh_label_edit")}</button>
                    <button className="card-button" onClick={this.onView.bind(this)}><i className="material-icons">search</i>{i18n.stringFor("sh_label_preview")}</button>
                    { ConfigStore.getPermission("campaign","clone") ? <button className="card-button" onClick={cloneHandler.bind(this)}><i className="material-icons">content_copy</i>{i18n.stringFor("sh_label_clone")}</button> : null }
                    { ConfigStore.getPermission("campaign","delete") ? <button className="card-button" onClick={this.onDelete.bind(this)}><i className="material-icons">delete</i>{i18n.stringFor("sh_label_delete")}</button> : null }
                    <button className="card-button" onClick={this.onWinners.bind(this)}><i className="material-icons">star</i>{i18n.stringFor("sh_label_winners")}</button>
                </div>
            } else if (CampaignStore.isActive(this.props.status)) {
                return <div className="card-ctrl">
                    <button className="card-button" onClick={this.onEdit.bind(this)}><i className="material-icons">edit</i>{i18n.stringFor("sh_label_edit")}</button>
                    <button className="card-button" onClick={this.onView.bind(this)}><i className="material-icons">search</i>{i18n.stringFor("sh_label_preview")}</button>
                    { ConfigStore.getPermission("campaign","clone") ? <button className="card-button" onClick={cloneHandler.bind(this)}><i className="material-icons">content_copy</i>{i18n.stringFor("sh_label_clone")}</button> : null }
                    <button className="card-button" onClick={this.onCancel.bind(this)}><i className="material-icons">cancel</i>{i18n.stringFor("sh_label_cancel_campaign")}</button>
                    <button className="card-button" onClick={this.onWinners.bind(this)}><i className="material-icons">star</i>{i18n.stringFor("sh_label_winners")}</button>
                </div>
            } else {
                return <div className="card-ctrl">
                    <button className="card-button" onClick={this.onEdit.bind(this)}><i className="material-icons">edit</i>{i18n.stringFor("sh_label_edit")}</button>
                    <button className="card-button" onClick={this.onView.bind(this)}><i className="material-icons">search</i>{i18n.stringFor("sh_label_preview")}</button>
                    <button className="card-button" onClick={this.onActivate.bind(this)}><i className="material-icons">power_settings_new</i>{i18n.stringFor("sh_label_activate")}</button>
                    { ConfigStore.getPermission("campaign","clone") ? <button className="card-button" onClick={cloneHandler.bind(this)}><i className="material-icons">content_copy</i>{i18n.stringFor("sh_label_clone")}</button> : null }
                    { ConfigStore.getPermission("campaign","delete") ? <button className="card-button" onClick={this.onDelete.bind(this)}><i className="material-icons">delete</i>{i18n.stringFor("sh_label_delete")}</button> : null }
                </div>
            }
        } else {
            return <div className="card-ctrl">
                <button className="card-button" onClick={this.onGameSelect.bind(this)}><i className="material-icons">mobile_friendly</i>{i18n.stringFor("sh_label_game_select")}</button>
                { ConfigStore.getPermission("campaign","delete") ? <button className="card-button" onClick={this.onDelete.bind(this)}><i className="material-icons">delete</i>{i18n.stringFor("sh_label_delete")}</button> : null }
            </div>
        }
    }

    getDrawRows () {
        let rows = [];
        
        if (_.size(this.props.campaignDetails.multiDrawEvents) > 0) {
            rows.push(
                _.map(this.props.campaignDetails.multiDrawEvents, draw => {
                    let entries = this.state.stats.DRAWS[draw.id];
                    return (
                        <div key={draw.id} className="prize-row">
                            <div className="prize-icon">
                                <img src="/dashboard/images/dashboard/icons/draw.png"/>
                            </div>
                            <div className="prize-id">
                                <div className="prize-label">{draw.label}</div>
                                <div className="prize-sublabel">{draw.options.end ? TimezoneStore.getMomentInTimezone(draw.options.end,this.props.campaignDetails.timezone).format(CampaignStore.dateDisplayFormat) : null}</div>
                            </div>
                            <div className="prize-award">
                                <div className="prize-label">{ entries }</div>
                                <div className="prize-sublabel">Entries</div>
                            </div>
                        </div>
                    );
                } )
            )
        }
            
        if (this.props.campaignDetails.grandPrizeDraw && this.props.campaignDetails.grandPrizeDraw.enabled) {
            rows.push(
                <div key={"grandprizedraw"} className="prize-row">
                    <div className="prize-icon">
                        <img src="/dashboard/images/dashboard/icons/grandprizedraw.png"/>
                    </div>
                    <div className="prize-id">
                        <div className="prize-label">CASH CLUB 50/50 Draw</div>
                        <div className="prize-sublabel">{TimezoneStore.getMomentInTimezone(undefined,this.props.campaignDetails.timezone).endOf('month').format(CampaignStore.dateDisplayFormat)}</div>
                    </div>
                    <div className="prize-award">
                        <div className="prize-label"><i className="material-icons">check</i></div>
                        <div className="prize-sublabel">Enabled</div>
                    </div>
                </div>
            );
        }

        return rows
    };

    render () {
        // If a game is selected, we have to wait for the display name and the game details.
        // If a game is not selected, the alternate render of the card does not require this information.
        // In both cases, the stats call must complete.
        let loaded = (this.props.campaignDetails.selectedGame) ?
            this.state.stats && this.state.displayName && this.state.gameDetails
            :
            this.state.stats;

        if (!loaded) return null;

        return (
            <div className="social-card">
                <div className="card-info">
                    <div className="card-header">
                        <div>
                            <div className="campaign-label">{this.props.name}</div>
                            <div className="game-label">
                                { this.state.displayName ? this.state.displayName : "" }
                            </div>
                        </div>
                        <div className="card-status">
                            <div className={this.getStatusClass()}>{this.getStatusLabel()}</div>
                        </div>
                    </div>
                    
                    <div className="card-content">
                        { this.props.campaignDetails.selectedGame ?
                            <div className={ "card-preview-" + this.state.gameDetails.details.orientation + " card-preview" }>
                                <img
                                    className={ "img-" + this.state.gameDetails.details.orientation }
                                    src={"/campaignplay/"+this.getSkinId()+"/games/"+this.getGameId()+"/campaign/previewscreenshot.png?timestamp="+this.props.lastModified} 
                                    onError={(e) => {
                                        this.setState( { "needsPreview": true } );
                                        e.currentTarget.src = "/dashboard/images/previewunavailable_"+ this.state.gameDetails.details.orientation +".png";
                                    }}
                                    onClick={this.onEdit.bind(this)}
                                />
                            </div>
                            :
                            <div className={ "card-preview-portrait card-preview" }>
                                <img
                                    className={ "img-portrait" }
                                    src={"/dashboard/images/dashboard/nogameselected_portrait.png"} 
                                    onClick={this.onGameSelect.bind(this)}
                                />
                            </div>
                        }
                        <div className="card-stats">
                            <div className="main-stats">
                                <div className={"circle-progress c100 p"+this.formatConversionRate(this.calculateConversionRate(this.state.stats))}>
                                    <div className="circle-label-main">{this.formatConversionRate(this.calculateConversionRate(this.state.stats))}<span style={{ fontSize:"0.7em" }}>%</span></div>
                                    <div className="circle-label-sub">Conversion<br/>Rate</div>
                                    <div className="slice">
                                        <div className="bar" style={{ transform: "rotate("+(360*this.calculateConversionRate(this.state.stats))+"deg)"}}/>
                                        <div className="fill"/>
                                    </div>
                                </div>
                                <div className="stat-column">
                                    <div className="main-stat">
                                        <div className="main-stat-icon">
                                            <img src="/dashboard/images/dashboard/icons/impressions.png"/>
                                        </div>
                                        <div className="main-stat-info">
                                            <div className="main-stat-label">Impressions</div>
                                            <div className="main-stat-value">{this.state.stats.VIEWS ? this.state.stats.VIEWS.CAMPAIGN_VIEW || 0 : 0}</div>
                                        </div>
                                    </div>
                                    <div className="main-stat">
                                        <div className="main-stat-icon">
                                            <img src="/dashboard/images/dashboard/icons/participants.png"/>
                                        </div>
                                        <div className="main-stat-info">
                                            <div className="main-stat-label">Leads Collected</div>
                                            <div className="main-stat-value">{this.state.stats.LEADS || 0}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-divider"/>
                                <div className="stat-column">
                                    <div className="main-stat">
                                        <div className="main-stat-icon">
                                            <img src="/dashboard/images/dashboard/icons/days.png"/>
                                        </div>
                                        <div className="main-stat-info">
                                            <div className="main-stat-label">Days</div>
                                            <div className="main-stat-value">{this.countDays( this.state.stats.ACTIVE )}</div>
                                        </div>
                                    </div>
                                    <div className="main-stat">
                                        <div className="main-stat-icon">
                                            <img src="/dashboard/images/dashboard/icons/leadsperday.png"/>
                                        </div>
                                        <div className="main-stat-info">
                                            <div className="main-stat-label">Leads / Day</div>
                                            <div className="main-stat-value">{this.getLeadsPerDay( this.state.stats.ACTIVE, this.state.stats.LEADS )}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="award-stats">
                                {/* Display the prizes block. This includes both instant win and everyone wins prizes */}
                                <div className="prize-stats">
                                    <div className="prize-header">Prizes</div>
                                    <div className="prizes">
                                        {
                                            _.filter(this.props.campaignDetails.prizes, () => { return prize => prize.type === "instant" || prize.type === "giveaway" } ).length > 0 ?
                                                _.map(this.props.campaignDetails.prizes, prize => {
                                                    let unlimited = prize.quantity === "-1";
                                                    let awarded = this.state.stats.PRIZES[prize.id].awarded;
                                                    if (prize.type === "instant") {
                                                        return (
                                                            <div key={prize.id} className="prize-row">
                                                                <div className="prize-icon">
                                                                    <img src="/dashboard/images/dashboard/icons/prize.png"/>
                                                                </div>
                                                                <div className="prize-id">
                                                                    <div className="prize-label">{prize.title}</div>
                                                                    <div className="prize-sublabel">{ unlimited ? "Unlimited" : null }</div>
                                                                </div>
                                                                <div className="prize-award">
                                                                    <div className="prize-label">{ unlimited ? awarded : awarded + " of " + prize.quantity + ""}</div>
                                                                    <div className="prize-sublabel">Awarded</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (prize.type === "giveaway") {
                                                        return (
                                                            <div key={prize.id} className="prize-row">
                                                                <div className="prize-icon">
                                                                    <img src="/dashboard/images/dashboard/icons/everyonewins.png"/>
                                                                </div>
                                                                <div className="prize-id">
                                                                    <div className="prize-label">{prize.title}</div>
                                                                    <div className="prize-sublabel">Everyone Wins</div>
                                                                </div>
                                                                <div className="prize-award">
                                                                    <div className="prize-label">{ awarded }</div>
                                                                    <div className="prize-sublabel">Awarded</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                } )
                                                :
                                                <div className="prize-row no-prize-label">
                                                    No Prizes Configured
                                                </div>
                                            
                                        }
                                    </div>
                                </div>

                                {/* Display the draws */}
                                <div className="prize-stats">
                                    <div className="prize-header">Draws</div>
                                    <div className="prizes">
                                        {
                                            _.size(this.props.campaignDetails.multiDrawEvents) > 0 || (this.props.campaignDetails.grandPrizeDraw && this.props.campaignDetails.grandPrizeDraw.enabled) ? 
                                                this.getDrawRows()
                                            :
                                            <div className="prize-row no-prize-label">
                                                No Draws Configured
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        { this.getCardButtons() }
                    </div>
                </div>


                <div className="clearfix"/>

                { this.state.showConfirmDelete ? 
                    <ConfirmCancelModal 
                        onDeleteComplete={this.onDeleteComplete.bind( this )}
                        onCancelDelete={this.onCancelDelete.bind(this)} 
                        onConfirmDelete={this.onConfirmDelete.bind(this)} 
                        show={true} 
                        campaignHash={this.props.campaignHash} /> 
                    : null 
                }

                { this.state.cloning ? 
                    <Loading 
                        modal={true}
                        title={i18n.stringFor( 'label_campaign_clone_notify_header' )} 
                        message={i18n.stringFor( 'label_campaign_clone_notify_body' )} 
                    />
                    : null 
                }

                {
                    this.state.legacyCloneWarning ?
                    <Confirm 
                        title="Unable To Clone"
                        message="We're sorry, this campaign uses features that are no longer supported. Unfortunately this means that we are unable to create a clone. Creating a new campaign is quick, easy and provides the most up-to-date features."
                        onConfirm={this.onConfirmLegacyCloneWarning.bind(this)}
                    />
                    :
                    null
                }
            </div>
        );
    }
};

class ConfirmCancelModal extends React.Component {
    constructor( props ) {
        super( props );
        this.state = { 
            loading: true,
            deleteing: false,
            campaignDetails: undefined
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
    }
    componentDidMount () {
        if ( !this.props.campaignHash ) {
            this.props.onDone();
        } else {
            CampaignStore.sendGetCampaignDetails( this.props.campaignHash );
        }
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
    }
    onCampaignDetailsRetrieved ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response, loading: false } );
        } else {
            this.setState( { campaignDetails: e.response.result, loading: false } );
        }
    }
    
    onCampaignStatusUpdated ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            this.setState( { lastResponse: e.response } );
        } else {
            // Update the campaign info
            this.setState({ campaignDetails: e.response.result }, () => {
                switch (e.response.result.status) {
                    case CampaignStore.STATUS_DELETED:
                        this.props.onDeleteComplete();
                        break;
                    case CampaignStore.STATUS_CANCELLED:
                        this.deleteCampaign(this.state.campaignDetails.status);
                        break;
                }
            });
        }
    }

    deleteCampaign ( currentStatus ) {
        switch (currentStatus) {
            case CampaignStore.STATUS_UNSHEDULED:
            case CampaignStore.STATUS_ENDED:
            case CampaignStore.STATUS_CANCELLED:
                CampaignStore.sendCampaignUpdateStatus( this.props.campaignHash, CampaignStore.STATUS_DELETED, this.state.campaignDetails.version );
                break;
            case CampaignStore.STATUS_SCHEDULED:
            case CampaignStore.STATUS_RUNNING:
            case CampaignStore.STATUS_SUSPENDED:
                CampaignStore.sendCampaignUpdateStatus( this.props.campaignHash, CampaignStore.STATUS_CANCELLED, this.state.campaignDetails.version );
                break;
        }
    }

    onConfirm () {
        this.setState( { deleteing: true }, () => {
            this.props.onConfirmDelete();
            this.deleteCampaign(this.state.campaignDetails.status);
        } );
    }

    onCancel () {
        this.props.onCancelDelete();
    }

    render() {
        if (this.state.loading || this.state.deleteing) return null;

        return (
            <Modal show={this.props.show} onHide={this.onCancel.bind( this )} className="sh-modal">
                <div className="modal-header-large modal-center">
                    <String code='label_confirm_cancel_campaign_title'/>
                </div>
                <div className="modal-body modal-center">
                    <div>{i18n.stringFor('label_confirm_cancel_campaign_body')}</div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-danger round modal-button" onClick={this.onConfirm.bind( this )}><String code='label_confirm'/></button>
                    <button className="btn btn-default round modal-button" onClick={this.onCancel.bind( this )}><String code='label_cancel'/></button>
                </div>
            </Modal>
        );
    }
}



export default CampaignCard;
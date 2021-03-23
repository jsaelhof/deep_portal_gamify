import React from 'react';
import CampaignStore from '../../../store/CampaignStore';
import ConfigStore from '../../../store/ConfigStore';
import LocalStorageStore from '../../../store/LocalStorageStore';
import UserStore from '../../../store/UserStore';
import { browserHistory as History } from 'react-router';
import LeadDashboard from './LeadDashboard.jsx';
import CampaignList from './CampaignList.jsx';
import Confirm from '../../shared/Confirm.jsx';
import ValidationWarningModal from '../../shared/ValidationWarningModal.jsx';
import CampaignActivator from '../../shared/activation/CampaignActivator.jsx';
import CampaignValidation from '../../shared/util/CampaignValidation';
import SubscriptionManager from '../../shared/payment/SubscriptionManager.jsx';
import PreviewUtils from '../../shared/util/PreviewUtils';
import i18n from '../../../store/i18nStore';
import _ from 'underscore';
import Constants from '../../shared/Constants';

class Dashboard extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            enabledProducts: [],
            campaigns: {},
            activeList: undefined,
            validationErrors: undefined,
            invalidCampaignPointer: undefined, // This is used to remember which campaign was invalid (either when activating or previewing) so that after the modal dialog, we can know what campaign to go to.
            showPreviewWarning: false,
            showActivationWarning: false,
            showAutoActivatePrompt: false,
            postSubscribeActivate: undefined // This is used when a user is attempting to activate a campaign (either manually or using auto-activate loop from preview) but is blocked by the subscription process. We'll use this hash to leave a note for ourseleves after the payment completes.
        }

        let allProducts = [Constants.PRODUCT_SLIDEOUT,Constants.PRODUCT_EMAIL_BANNER,Constants.PRODUCT_SOCIAL];
        allProducts.map( product => {
            if (ConfigStore.isProductEnabled( product )) {
                this.state.enabledProducts.push(product);
            }
        } );
        
        // Try to find the last tab the user was using.
        // If it can't be found, just use the first tab.
        let lastKnownTab = LocalStorageStore.get("dashboardTab");
        if (lastKnownTab && this.state.enabledProducts.indexOf(lastKnownTab) >= 0) {
            this.state.activeList = lastKnownTab;
        } else {
            this.state.activeList = this.state.enabledProducts[0];
        }

        // Try and get hideEnded from the local storage.
        let hideEnded = LocalStorageStore.get("dashboardHideEnded");
        if (hideEnded !== undefined) {
            this.state.hideEnded = hideEnded;
        } else {
            this.state.hideEnded = true;
        }
    }

    componentWillMount () {
        // Check if there are any messages left by the server in the User object.
        // If so, handle them as required.
        for (let messageId in UserStore.getMessages()) {
            switch (messageId) {
                // For aweber messages, we need to forward to the mail integration page to finish handling aweber connection.
                case "aweber":
                    History.push( ConfigStore.buildRoutePath("mailintegration") );
                    break;
            }
        }

        // Request the campaigns for each product type.
        this.state.enabledProducts.map( product => {
            if (ConfigStore.isProductEnabled( product )) {
                CampaignStore.getCampaignList( ConfigStore.getProductTag(product), this.handleCampaignList.bind(this, product) );
            }
        } );
    }

    componentDidMount () {
        // Hack...for some reason when component did mount is called it positions the tab hihglight a bit to the right.
        // Waiting just a bit and then moving it again fixes it. Maybe i can figure out later when i have more time why that happens.
        // Seems like something to do with the dom measurments at that precise time.
        setTimeout( () => {
            this.moveTab( true );
        }, 100 );

        this.moveTab( true );
    }

    handleCampaignList ( product, e ) {
        let campaignList = e.result.campaignList;

        // Check for a list of campaigns to show exclusively if a list was passed in.
        // This was added for an integration with ITN (Tradeshow) where we needed to only show a single campaign even if there were multiple.
        // I built the feature so it could support more than one if ever needed.
        if (CampaignStore.getCampaignFilter()) {
            let campaignsToShow = CampaignStore.getCampaignFilter();
            campaignList = _.filter(campaignList, campaign => {
                if (campaignsToShow.indexOf(campaign.campaignHash) >= 0) {
                    return campaign;
                }
            });
        } 

        let updatedCampaigns = { ...this.state.campaigns };
        updatedCampaigns[product] = campaignList;

        this.setState( {
            campaigns: updatedCampaigns
        }, () => {
            if (this.isInitialized()) {
                // Check if there is a message in the local storage to activate a campaign. 
                // This would have been left by the preview window's activate campaign button.
                if (window.localStorage) {
                    let autoActivate = window.localStorage.getItem("gamifyActivateCampaign");
                    if (autoActivate) {
                        try {
                            autoActivate = JSON.parse(autoActivate);
                            if (Date.now() - autoActivate.timestamp < 120000) {
                                window.localStorage.removeItem("gamifyActivateCampaign");
                                let campaignData = this.findCampaignByHash(autoActivate.campaignHash);
                                if (campaignData) {
                                    // Check if the user is allowed to activate or if they have to subscribe first.
                                    if (!UserStore.isFeatureAuthorized(campaignData.product,"activate")) {
                                        // Show subscribe dialog
                                        this.setState( { postSubscribeActivate: campaignData.campaign.campaignHash }, () => {
                                            this.subscriptionManager.showSubscribeDialog();
                                        } );
                                    } else {
                                        this.setState( { showAutoActivatePrompt: true, autoActivateCampaign: campaignData.campaign, autoActivateProduct: campaignData.product } );
                                    }
                                }
                            }
                        } catch (e) {}
                    } 
                } 
            } 
        } )
    }

    isInitialized () {
        return this.state.enabledProducts.filter( product => this.state.campaigns[product] ).length === this.state.enabledProducts.length;
    }

    refreshCampaignList ( product ) {
        CampaignStore.getCampaignList(ConfigStore.getProductTag(product), this.handleCampaignList.bind(this, product));
    }

    moveTab ( init ) {
        let tab = $($("#tab-"+this.state.activeList)[0]);

        let hl = $(".dashtop-tab-highlight");

        if (init) {
            hl.css({
                width: tab.width(),
                marginLeft: tab.position().left
            });
        } else {
            hl.animate({
                width: tab.width(),
                marginLeft: tab.position().left
            }, 250);
        }
    }

    onChangeList ( listId ) {
        this.setState( { 
            activeList: listId
        }, () => {
            if (this.leadbar) this.leadbar.refresh();
            LocalStorageStore.set( "dashboardTab", listId );
            this.moveTab();
        } );
    }

    onView ( campaignHash ) {
        let campaignData = this.findCampaignByHash( campaignHash );

        switch (campaignData.product) {
            case Constants.PRODUCT_SOCIAL:
            case Constants.PRODUCT_SURVEY:
                this.validate( campaignData.campaign, campaignData.product, () => { window.open(PreviewUtils.getPreviewUrl(campaignData.product, campaignHash, false, UserStore.isFeatureAuthorized(campaignData.product,"activate")), '_blank' ); }, "preview", true );
                break;
            case Constants.PRODUCT_SLIDEOUT:
            case Constants.PRODUCT_EMAIL_BANNER:
                this.validate( campaignData.campaign, campaignData.product, () => { window.open(PreviewUtils.getDemoStorePreviewUrl(campaignData.product,campaignHash, false, UserStore.isFeatureAuthorized(campaignData.product,"activate")), '_blank' ); }, "preview", true );
                break;
        }
    }

    onGoToIntegration () {
        History.push(ConfigStore.buildRoutePath("integration"));
    }

    // Activation Component Handlers

    onActivate ( campaignHash ) {
        let campaignData = this.findCampaignByHash( campaignHash );

        if (UserStore.isFeatureAuthorized(campaignData.product,"activate")) {
            this.validate( campaignData.campaign, campaignData.product, () => { this.activator.activate( campaignData.campaign, campaignData.product ); }, "activate" );
        } else {
            // Show subscribe dialog
            this.setState( { postSubscribeActivate: campaignHash }, () => {
                this.subscriptionManager.showSubscribeDialog();
            } );
        }
    }

    onCancel ( campaignHash ) {
        let campaignData = this.findCampaignByHash( campaignHash );
        this.activator.cancelCampaign(campaignData.campaign, campaignData.product);
    }

    onActivated ( campaignHash, product ) {
        this.setState({ autoActivateCampaign: undefined, autoActivateProduct: undefined });
        this.refreshCampaignList(product);
    }

    onCancelled ( campaignHash, product ) {
        this.refreshCampaignList(product);
    }

    // Auto Activate Handlers

    onAutoActivateConfirm () {
        // We already have the campaign here but we need to get the product it's associated with.
        this.setState({ showAutoActivatePrompt: false }, () => {
            this.validate( this.state.autoActivateCampaign, this.state.autoActivateProduct, () => { this.activator.activate( this.state.autoActivateCampaign, this.state.autoActivateProduct ); }, "activate" );
        });
    }

    onAutoActivateCancel () {
        this.setState({ showAutoActivatePrompt: false, autoActivateCampaign: undefined, autoActivateProduct: undefined });
    }

    // Utils

    findCampaignByHash ( campaignHash ) {
        for (var product in this.state.campaigns) {
            for (let i=0; i<this.state.campaigns[product].length; i++) {
                if (this.state.campaigns[product][i].campaignHash === campaignHash) {
                    return { campaign: this.state.campaigns[product][i], product: product };
                }
            }
        }
    }

    validate ( campaign, product, onValid, warningType, ignoreSchedule ) {
        // Get an array of validation errors. If it's empty, the campaign is valid.
        // If not, we need to offer to send the user to the editor for this campaign so that they can see the errors.
        let validationErrors = CampaignValidation.validate( product, campaign.details, campaign.status, ignoreSchedule );

        if (validationErrors.length > 0) {
            this.setState( {
                showActivationWarning: warningType === "activate",
                showPreviewWarning: warningType === "preview",
                validationErrors: validationErrors,
                invalidCampaignPointer: campaign.campaignHash,
                invalidCampaignProduct: product
            } );
        } else {
            onValid();
        }
    }

    onValidationWarningConfirm ( currentError ) {
        let campaignHash = this.state.invalidCampaignPointer;
        let product = this.state.invalidCampaignProduct;
        this.setState( { 
            validationErrors: undefined,
            invalidCampaignPointer: undefined,
            invalidCampaignProduct: undefined
        }, () => {
            History.push(ConfigStore.buildRoutePath("edit/"+campaignHash+"?validateAssist=true",product));
        } );
    }

    onValidationWarningCancel ( currentError ) {
        this.setState( { 
            showActivationWarning: false,
            showPreviewWarning: false,
            validationErrors: undefined,
            invalidCampaignPointer: undefined,
            invalidCampaignProduct: undefined
        } );
    }

    onHideEnded () {
        this.setState( { hideEnded: !this.state.hideEnded }, () => {
            LocalStorageStore.set("dashboardHideEnded", this.state.hideEnded);
        } );
    }

    getDisplayName ( product ) {
        switch (product) {
            case Constants.PRODUCT_SLIDEOUT:
                return "Gamified Displays";
                break;
            case Constants.PRODUCT_EMAIL_BANNER:
                return "Email Collection Displays";
                break;
            case Constants.PRODUCT_SOCIAL:
                return "Social Media Promotions";
                break;
        }
    }

    render () {
        let canCreate = (ConfigStore.isProductEnabled(Constants.PRODUCT_SOCIAL) && ConfigStore.getPermission("campaign","create")) || 
        (ConfigStore.isProductEnabled(Constants.PRODUCT_EMAIL_BANNER) && ConfigStore.getPermission("campaign","create")) || 
        (ConfigStore.isProductEnabled(Constants.PRODUCT_SLIDEOUT) && ConfigStore.getPermission("campaign","create"));

        return (
            <div>
                <div className="dashtop">
                    { ConfigStore.showLeadBar ? 
                        <LeadDashboard 
                            ref={(leadbar) => { this.leadbar = leadbar; }}
                        /> 
                        : 
                        null 
                    }

                    { 
                        canCreate
                        ?
                            <div className="dashtop-new-campaign" onClick={ () => { History.push(ConfigStore.buildRoutePath("create")) } }>
                                <i className="material-icons">add</i> Create New Campaign
                            </div>
                            :
                            null
                    }

                    <div className="dashtop-tabbar">
                        <div className="dashtop-tabs">
                            <ul>
                                { 
                                    this.state.enabledProducts.map( listId => {
                                        return <li 
                                                    key={listId} 
                                                    id={"tab-"+listId} 
                                                    className={ this.state.activeList === listId ? "dashtop-tab-active" : "dashtop-tab-inactive" }
                                                    onClick={ this.onChangeList.bind(this, listId) }
                                                >
                                                { this.getDisplayName(listId) }
                                                </li>;
                                    } )
                                }
                            </ul>
                            <div className="dashtop-tab-highlight"/>
                        </div>

                        <div className="dashtop-settings">
                            <div class="dashtop-setting dashtop-checkbox" onClick={this.onHideEnded.bind(this)}>
                                { this.state.hideEnded ? 
                                    <div className="dashtop-checkbox-checked"/>
                                    :
                                    <div className="dashtop-checkbox-unchecked"/>
                                }
                                <div>Hide Ended Campaigns</div>
                            </div>
                        </div>
                    </div>
                </div>

                { ConfigStore.isProductEnabled(Constants.PRODUCT_SLIDEOUT) ? 
                    <CampaignList 
                        displayName={this.getDisplayName(Constants.PRODUCT_SLIDEOUT)}
                        show={this.state.activeList === Constants.PRODUCT_SLIDEOUT}
                        hideEnded={this.state.hideEnded} 
                        location={this.props.location} 
                        product={Constants.PRODUCT_SLIDEOUT} 
                        campaigns={this.state.campaigns[Constants.PRODUCT_SLIDEOUT]}
                        onView={this.onView.bind(this)}
                        onActivate={this.onActivate.bind(this)}
                        onCancel={this.onCancel.bind(this)}
                        onRefreshCampaignList={this.refreshCampaignList.bind(this)}
                    />
                    :
                    null
                }
                
                { ConfigStore.isProductEnabled(Constants.PRODUCT_EMAIL_BANNER) ? 
                    <CampaignList 
                        displayName={this.getDisplayName(Constants.PRODUCT_EMAIL_BANNER)}
                        show={this.state.activeList === Constants.PRODUCT_EMAIL_BANNER} 
                        hideEnded={this.state.hideEnded} 
                        location={this.props.location} 
                        product={Constants.PRODUCT_EMAIL_BANNER} 
                        campaigns={this.state.campaigns[Constants.PRODUCT_EMAIL_BANNER]}
                        onView={this.onView.bind(this)}
                        onActivate={this.onActivate.bind(this)}
                        onCancel={this.onCancel.bind(this)}
                        onRefreshCampaignList={this.refreshCampaignList.bind(this)}
                    />
                    :
                    null
                }
                
                { ConfigStore.isProductEnabled(Constants.PRODUCT_SOCIAL) ? 
                    <CampaignList 
                        displayName={this.getDisplayName(Constants.PRODUCT_SOCIAL)}
                        show={this.state.activeList === Constants.PRODUCT_SOCIAL} 
                        hideEnded={this.state.hideEnded} 
                        location={this.props.location} 
                        product={Constants.PRODUCT_SOCIAL} 
                        campaigns={this.state.campaigns[Constants.PRODUCT_SOCIAL]}
                        onView={this.onView.bind(this)}
                        onActivate={this.onActivate.bind(this)}
                        onCancel={this.onCancel.bind(this)}
                        onRefreshCampaignList={this.refreshCampaignList.bind(this)}
                    />
                    :
                    null
                }

                {
                    this.state.showAutoActivatePrompt ?
                        <Confirm 
                            title={i18n.stringFor("sh_label_confirm_activation_title")}
                            message={i18n.stringFor("sh_label_confirm_activation_message").replace("{0}",this.state.autoActivateCampaign.details.name)}
                            onConfirm={this.onAutoActivateConfirm.bind(this)} 
                            onCancel={this.onAutoActivateCancel.bind(this)} 
                        />
                        : null
                }

                <SubscriptionManager
                    onSubscribed={ ()=> { this.forceUpdate() } }
                    ref={(subscriptionManager) => { this.subscriptionManager = subscriptionManager; }}
                />

                <CampaignActivator 
                    onActivated={ this.onActivated.bind(this) }
                    onCancelled={ this.onCancelled.bind(this) }
                    onGoToIntegration={ this.onGoToIntegration.bind(this) }
                    ref={(activator) => { this.activator = activator; }}
                />

                {
                    (this.state.showActivationWarning || this.state.showPreviewWarning) ? 
                        <ValidationWarningModal 
                            validationErrors={this.state.validationErrors} 
                            onConfirm={this.onValidationWarningConfirm.bind(this)} 
                            onCancel={this.onValidationWarningCancel.bind(this)}
                            trigger={this.state.showActivationWarning ? "activate" : "preview"} /> 
                        : null 
                }
            </div>
        )
    }

}

module.exports = Dashboard;
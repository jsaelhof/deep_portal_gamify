import React from 'react';
import {browserHistory as History} from 'react-router';

import CampaignStore from '../../../store/CampaignStore';
import ConfigStore from '../../../store/ConfigStore';
import ThemeStore from '../../../store/ThemeStore';
import UserStore from '../../../store/UserStore';
import NewCampaign from '../../shared/NewCampaign';
import i18n from '../../../store/i18nStore';
import Loading from '../../shared/Loading.jsx';
import ActionBar from '../../shared/nav/ActionBar.jsx';
import Constants from '../../shared/Constants';

class CreateCampaign extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            templates: undefined,
            gameInfosLoaded: undefined,
            campaignHash: undefined,
            selectedTemplate: undefined,
            selectedTheme: undefined,
            campaignDetails: undefined,
            showCreateCampaignModal: false,
            selectedThemeFilter: "all"
        }
    }
    componentWillMount () {
        CampaignStore.addEventListener( this );
        ThemeStore.addEventListener( this );
    }
    componentDidMount () {
        ThemeStore.getList( ConfigStore.getProductTag() );
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener( this );
        ThemeStore.removeEventListener( this );
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
            let sorted = e.response.result.themes.sort( ( a, b ) => {
                if (parseInt(a.details.displayOrder) < parseInt(b.details.displayOrder)) {
                    return - 1;
                } else {
                    return 1;
                }
            } );

            // Filter out any templates that the integration config file has excluded.
            let filtered = sorted.filter( template => {
                if (!ConfigStore.isTemplateExcluded( template.templateKey )) {
                    return template;
                }
            } );

            // Sort the themes in the filtered list.
            filtered.map( template => {
                let sortedThemes = template.themes.sort( ( a, b ) => {
                    if (parseInt(a.details.displayOrder) < parseInt(b.details.displayOrder)) {
                        return - 1;
                    } else {
                        return 1;
                    }
                } );

                // Replace the unsorted list with the sorted one.
                template.themes = sortedThemes;
            } );
            
            this.setState( { templates: filtered } );
        }
    }

    

    onTemplateSelect ( templateId ) {
        this.setState( 
            { 
                selectedTemplate: templateId
            }
        );
    }

    onThemeSelect ( themeId ) {
        this.setState( 
            { 
                selectedTheme: themeId,
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
        // 4. onThemeInitialized is fired when complete. When fired, we need to get the theme descriptor so that we can get the default data collection fields that are assigned to it
        //      and add them to the campaign details. This requires we then call CampaignStore.sendCampaignUpdate.

        // Register the campaign with these details
        let newDetails = NewCampaign.defaultDetails();

        this.insertAdditionalDetails( newDetails );

        CampaignStore.sendCampaignRegister( newDetails, ConfigStore.getProductTag() );
    }

    onCampaignRegistered ( e ) {
        if (e.response && e.response.hasErrors()) {
            this.setState( { lastResponse: e.response } );
        } else {
            this.saveCampaignAndSelectGame( e.response.result.campaignHash, e.response.result.version, e.response.result.details );
        }
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
            type: Constants.PRODUCT_EMAIL_BANNER
        }

        // Add Slideout specific default details
        details.integration = {
            uiConfig: {
                slideOut: {
                    desktop: {
                        enabled: true,
                        showOnLeaveIntent: {
                            enabled: true
                        },
                        showAfterDelay: {
                            enabled: true,
                            delay: 15
                        }
                    },
                    mobile: {
                        enabled: true,
                        showOnLeaveIntent: {
                            enabled: false
                        },
                        showAfterDelay: {
                            enabled: true,
                            delay: 15
                        }
                    }
                },
                urlFiltering: {
                    operators: ['contain', 'does not contain'],
                    filters: []
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
            }
        );
    }

    // Theme has been sleected, go to the editor
    onThemeInitialized ( e ) {
        ThemeStore.getThemeDescriptor(this.state.campaignHash);
    }

    onThemeDescriptorRetrieved ( e ) {
        let details = {...this.state.campaignDetails};
        
        // Pull the default forms from the themedescriptor and set it in the campaign details.
        // This initializes the campaign with whatever default form fields the theme dictates.
        details.forms = e.theme.defaultforms;

        // We need to set the template and client versions in the campaign details.
        // These are used when we make '/campaign/custom/theme/publish' calls to re-template the index file.
        // Currently i'm doing this because we need to call publish when the social sharing post info changes so that the template's opengraph info gets updated.
        // They maybe used later for other things.
        details.versions = {
            template: this.state.templateVersion
        }

        this.setState( { 
            campaignDetails: details
        }, () => {
            CampaignStore.sendCampaignUpdate( this.state.campaignHash, this.state.campaignDetails, this.state.campaignVersion, () => {
                this.setState( { showCreateCampaignModal: false } );
                History.push(ConfigStore.buildRoutePath("edit/" + this.state.campaignHash));
            } );
        } );
    }

    onThemeFilterSelect ( selectedThemeFilter ) {
        this.setState({
            selectedThemeFilter: selectedThemeFilter
        });
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
                                    <img src={"/dashboard/images/create/themepreview_"+ theme.themeKey +".jpg"}/>
                                </div>
                                <div>
                                    <button className="btn btn-primary round">{ConfigStore.getTemplateSkinDisplayName(template.templateKey,theme.themeKey)}</button>
                                </div>
                            </div>  )
                }
            } ).filter( el => el !== undefined )
        )
    }

    isThemeTagged ( tag ) {
        let template;

        this.state.templates.forEach(t => {
            if (t.templateKey === this.state.selectedTemplate) template = t;
        });

        return template.themes.filter( theme => {
            let tagsForTheme = ConfigStore.getTemplateSkinTags(template.templateKey,theme.themeKey);
            return tagsForTheme.indexOf(tag) >= 0;
        } ).length > 0;
    }

    render () {
        if (!this.state.templates) { return ( 
            <Loading modal={false} /> 
        ); }

        return (
            <div>
                <ActionBar buttonGroup="newcampaign" onClick={this.onNavClick.bind(this)} />
                <div className="action-bar-spacer"/>
                

                { !this.state.selectedTemplate && !this.state.selectedTheme ?
                    <div className="create-row">
                        <div className="create-type">
                            <div className="create-label">
                                <h2>Email Collection</h2>
                                <div>Grow your mailing list with simple and effective email collection displays</div>
                            </div>
                            <h4 className="center">Select Your Display Style</h4>

                            <div className="create-products create-products-wrap">
                                { 
                                    this.state.templates.map(template => {
                                        return( <div className="create-preview" onClick={this.onTemplateSelect.bind(this,template.templateKey)}>
                                                    <div className="create-preview-img-wrap">
                                                        <img src="/dashboard/images/create/bottomshadow.png"/>
                                                        <img src={"/dashboard/images/create/bannerpreview_"+ template.templateKey +".jpg"}/>
                                                    </div>
                                                    <div>
                                                        <button className="btn btn-primary round product-card-button">{ConfigStore.getTemplateDisplayName(template.templateKey)}</button>
                                                    </div>
                                                </div> )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    :
                    null
                }


                { this.state.selectedTemplate && !this.state.selectedTheme ?
                    <div>
                        <div className="create-title">
                            <h2>Email Collection</h2>
                            <div>Grow your mailing list with simple and effective email collection displays</div>
                        </div>
                        <h4 className="center">Select Your Theme</h4>

                        <div className="theme-row">
                            <div className="theme-filter">
                                <ul>
                                    { 
                                        Object.keys(Constants.TAGS).map( key => {
                                            if (key === "all" || this.isThemeTagged(key)) {
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

                            <div className="theme-type">
                                {/* Show Featured Themes if not set on All */}
                                {
                                    this.state.selectedThemeFilter !== "all" ?
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
                                    { this.state.selectedThemeFilter !== "all" ? <div className="theme-category m-t-10"><h3>Additional Themes</h3></div> : null }

                                    <div className="theme-cards theme-cards-wrap">
                                    { 
                                        this.getThemesToDisplay(true)
                                    }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    null
                }

                { this.state.showCreateCampaignModal ? <Loading modal={true} title={i18n.stringFor('sh_label_create_campaign_label')} message={i18n.stringFor('sh_label_create_campaign_subtext')} /> : null }   
            </div>
        )
    }
}

module.exports = CreateCampaign;
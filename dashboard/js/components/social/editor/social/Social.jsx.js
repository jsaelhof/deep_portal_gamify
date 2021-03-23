import React from 'react';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import ConfigStore from '../../../../store/ConfigStore';
import ThemeStore from '../../../../store/ThemeStore';
import TextInput from '../../../shared/TextInput.jsx';
import TextArea from '../../../shared/TextArea.jsx';
import ImageAsset from '../../../shared/editor/image/ImageAsset.jsx';
import GUID from '../../../../util/guid';
import Constants from '../../../shared/Constants';
import _ from 'underscore';

class Social extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            focusedNetwork: undefined
        };
    }

    componentWillMount () {
        CampaignStore.addEventListener(this);
    }

    componentWillUnmount () {
        CampaignStore.removeEventListener(this);
    }

    onWebsiteUrlChange ( id, value ) {
        this.props.onUpdate( this.props.themeDescriptor, value );
    }

    onNetworkUrlChange ( id, value ) {
        let updatedThemeDescriptor = { ...this.props.themeDescriptor };
        updatedThemeDescriptor.social.visiting.links[id] = value;
        this.props.onUpdate( updatedThemeDescriptor, this.props.website );
    }

    onEnableSocialVisiting ( e ) {
        let updatedThemeDescriptor = { ...this.props.themeDescriptor };
        updatedThemeDescriptor.social.visiting.enabled = ! updatedThemeDescriptor.social.visiting.enabled;
        this.props.onUpdate( updatedThemeDescriptor, this.props.website );
    }

    onNetworkFocus ( id ) {
        this.setState( { focusedNetwork: id } );
    }

    onNetworkBlur ( id ) {
        this.setState( { focusedNetwork: undefined } );
    }

    onEnableSocialSharing ( e ) {
        let updatedThemeDescriptor = { ...this.props.themeDescriptor };
        updatedThemeDescriptor.social.sharing.enabled = ! updatedThemeDescriptor.social.sharing.enabled;

        // There's no image, set a default.
        if (!updatedThemeDescriptor.social.sharing.image) {
            updatedThemeDescriptor.social.sharing.image = "/dashboard/images/social/play-to-win.jpg";
            updatedThemeDescriptor.social.sharing.imageRemoved = false;
            updatedThemeDescriptor.social.sharing.title = "My Post Title";
            updatedThemeDescriptor.social.sharing.description = "My Post Description";
        }

        this.props.onUpdate( updatedThemeDescriptor, this.props.website, true );
    }

    onSharingTitleChange ( id, value ) {
        let updatedThemeDescriptor = { ...this.props.themeDescriptor };
        updatedThemeDescriptor.social.sharing.title = value;
        this.props.onUpdate( updatedThemeDescriptor, this.props.website, true );
    }

    onSharingDescriptionChange ( id, value ) {
        let updatedThemeDescriptor = { ...this.props.themeDescriptor };
        updatedThemeDescriptor.social.sharing.description = value;
        this.props.onUpdate( updatedThemeDescriptor, this.props.website, true );
    }

    onSetImgSource ( id, data, file ) {
        let type = file.type.split( '/' ).pop();
        let fileName = GUID.randomHex() + "." + type;

        // Upload the logo to theme assets
        let assetFileName = ThemeStore.uploadAsset( this.props.campaignHash, fileName, data, ( e ) => {
            // Upload Success Handler
            let updatedThemeDescriptor = { ...this.props.themeDescriptor }
            updatedThemeDescriptor.social.sharing.image = "/" + e.result[ fileName ].assetPath;
            this.props.onUpdate( updatedThemeDescriptor, this.props.website, true );
        } );
    }

    onToggleVisible ( id ) {
        //notify the parent component that the theme descriptor has been updated
        let updatedThemeDescriptor = {...this.props.themeDescriptor};
        updatedThemeDescriptor.social.sharing.imageRemoved = !updatedThemeDescriptor.social.sharing.imageRemoved;
        this.props.onUpdate( updatedThemeDescriptor, this.props.website );
    }

    render () {
        return (
            <div className="settings" id={Constants.PRODUCT_SOCIAL}>
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>Social Media</h1>
                                <h3 className="subheading">Configure your social media presence</h3>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="m-t-1 m-b-8 w-475">
                                <h4>Your Website</h4>
                                <div className="m-b-2">Add a button to your campaign that links to your website.</div>
                                <TextInput 
                                    id="website"
                                    value={ this.props.website }
                                    placeholder={ "http://www.yourdomain.com" } 
                                    onChange={this.onWebsiteUrlChange.bind(this)}
                                />
                            </div>

                            { ConfigStore.getEditorSectionEnabled("socialmedia","visiting") && this.props.themeDescriptor.social.visiting ?
                                <div className="m-t-1">
                                    <h4>Social Media Visiting</h4>
                                    <div>Add icons for your social media pages to your campaign.</div>
                                    <div className="form-inline m-t-2">
                                        <div className="form-group">
                                            <div>
                                                <input type="checkbox"
                                                    id='socialVisitingTab'
                                                    data-switch="color"
                                                    disabled={false}
                                                    name='socialVisitingTab'
                                                    onChange={(e) => this.onEnableSocialVisiting(e)}
                                                    checked={this.props.themeDescriptor.social.visiting.enabled}
                                                />
                                                <label htmlFor={'socialVisitingTab'} className="m-b-0">&nbsp;</label>
                                            </div>
                                        </div>

                                        <div className="form-group m-r-2 m-l-2">
                                            Enable Social Media Visiting
                                        </div>
                                    </div>
                                </div>
                                :
                                null
                            }
                            
                            {
                                ConfigStore.getEditorSectionEnabled("socialmedia","visiting") && this.props.themeDescriptor.social.visiting && this.props.themeDescriptor.social.visiting.enabled ?
                                    <div className="m-t-4">
                                        {
                                            _.keys(this.props.themeDescriptor.social.visiting.links).map( network => {
                                                return (
                                                    <div key={network} className="form-group w-500 social-visiting">
                                                        <div>
                                                            {/* Note, this empty div wrapping the image is neccessary to prevent the image squishing a bit in flexbox. Apparently adding a container around the image is known to help. */}
                                                            <img 
                                                                src={"/dashboard/images/social/" + network + ".png"} 
                                                                style={ { opacity: (this.state.focusedNetwork !== network && !this.props.themeDescriptor.social.visiting.links[network]) ? "0.2" : "1", transition: "opacity 0.4s ease-in-out" } }/>
                                                        </div>
                                                        <TextInput 
                                                            id={network} 
                                                            ref={network}
                                                            name={network} 
                                                            value={ this.props.themeDescriptor.social.visiting.links[network] }
                                                            placeholder={ this.state.focusedNetwork !== network ? "Add " + i18n.stringFor("label_social_network_" + network) + " URL" : undefined } 
                                                            onChange={this.onNetworkUrlChange.bind(this)}
                                                            onFocus={ this.onNetworkFocus.bind(this) }
                                                            onBlur={ this.onNetworkBlur.bind(this) }
                                                        />
                                                    </div>
                                                )
                                            } )
                                        }
                                    </div>
                                    :
                                    null
                            }

                            <div className="clearfix"/>

                            { ConfigStore.getEditorSectionEnabled("socialmedia","sharing") && this.props.themeDescriptor.social.sharing ?
                                <div className="m-t-8">
                                    <h4>Social Media Sharing</h4>
                                    <div className="w-800">Configure the OpenGraph data used to display your campaign on popular social platforms such as Facebook and Twitter. This information is only used if when you share your campaign URL using a social media platform.</div>
                                    <div className="form-inline m-t-2">
                                        <div className="form-group">
                                            <div>
                                                <input type="checkbox"
                                                    id='socialSharingTab'
                                                    data-switch="color"
                                                    disabled={false}
                                                    name='socialSharingTab'
                                                    onChange={(e) => this.onEnableSocialSharing(e)}
                                                    checked={this.props.themeDescriptor.social.sharing.enabled}
                                                />
                                                <label htmlFor={'socialSharingTab'} className="m-b-0">&nbsp;</label>
                                            </div>
                                        </div>

                                        <div className="form-group m-r-2 m-l-2">
                                            Enable Social Media Sharing
                                        </div>
                                    </div>
                                </div>
                                :
                                null
                            }

                            {
                                ConfigStore.getEditorSectionEnabled("socialmedia","sharing") && this.props.themeDescriptor.social.sharing && this.props.themeDescriptor.social.sharing.enabled ?
                                    <div className="m-t-4">
                                        <ImageAsset 
                                            key="sharing-image"
                                            id="sharing-image"
                                            initialSource={this.props.themeDescriptor.social.sharing.image ? this.props.themeDescriptor.social.sharing.image : undefined}
                                            removed={this.props.themeDescriptor.social.sharing.imageRemoved}
                                            removable={true}
                                            large={true}
                                            label="Post Image"
                                            onSetImgSource={this.onSetImgSource.bind(this)}
                                            onToggleVisible={this.onToggleVisible.bind(this)}
                                        />

                                        <div className="m-b-2 w-500">
                                            <TextInput 
                                                id="sharing-title" 
                                                ref="sharing-title"
                                                name="sharing-title" 
                                                value={ this.props.themeDescriptor.social.sharing.title }
                                                placeholder={ "Post Title" } 
                                                onChange={this.onSharingTitleChange.bind(this)}
                                            />
                                        </div>

                                        <div className="m-b-2 w-500">
                                            <TextArea
                                                id="sharing-desc" 
                                                ref="sharing-desc"
                                                name="sharing-desc" 
                                                rows="3"
                                                value={ this.props.themeDescriptor.social.sharing.description }
                                                placeholder={ "Post Description" } 
                                                onChange={this.onSharingDescriptionChange.bind(this)}
                                            />
                                        </div>
                                
                                    </div>
                                    :
                                    null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Social;
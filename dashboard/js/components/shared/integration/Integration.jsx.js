import React from 'react';
import ActionBar from '../nav/ActionBar.jsx';
import String from '../../common/String.jsx';
import IntegrationStore from '../../../store/IntegrationStore';
import ErrorStore from '../../../store/ErrorStore';
import ConfigStore from '../../../store/ConfigStore';


class Integration extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            identifier: null,
            waitingOnService: true,
            copied: false,
            guides: undefined
        }
        this.getCodeSnippet = this.getCodeSnippet.bind(this);

        this.timeoutId;
    }

    componentWillMount () {
        IntegrationStore.addEventListener( this );
        ConfigStore.addEventListener( this );
    }

    componentDidMount () {
        IntegrationStore.getUserIntegrationInfo();
        if (ConfigStore.getGuideConfig()) {
            this.handleGuideConfig(ConfigStore.getGuideConfig());
        } else {
            ConfigStore.loadGuideConfig();
        }
    }

    componentWillUnmount () {
        IntegrationStore.removeEventListener( this );
        ConfigStore.removeEventListener( this );
    }


    onUserIntegrationInfo(data) {
        //check to see if the request succeeded
        if(data.response.hasErrors()) {
            ErrorStore.rpcResponseError( data );
        } else {
            // update the state for this component with the received identifier
            this.setState({identifier: data.response.result.key, waitingOnService: false})
        }
    }

    onIntegrationInfoError(jqXHR, textStatus, errorThrown ) {
        //console.error("Retrieving integration info failed : ", errorThrown);
        // TODO: Handle the error
    }

    handleGuideConfig ( config ) {
        let guides = config.guides.links.map( link => {
            return {
                id: link.id,
                image: link.image || config.guides.defaults.image.replace( "{id}", link.id ),
                url: link.url || config.guides.defaults.url.replace( "{id}", link.id )
            }
        } );

        // This is a fallback because cloudfront is caching the old conf file aggressively. Util we work it out, i need to fallback to a hardcoded url.
        let gamifyUrl = config.guides.gamify || "https://deepmarkit.com/install-guide/";

        this.setState( { guides: guides, gamifyGuide: gamifyUrl } );
    }

    onGuideConfigLoaded ( config ) {
        this.handleGuideConfig(config);
    }

    onGuideConfigLoadError ( e ) {
        // Don't show an error, we'll just not show the guides?
    }

    getHostName(url) {
        // return the protocol and hostname from a given url 
        var a = document.createElement('a');
        a.href = url;
        return a.protocol + "//" + a.hostname;
    }

    getCodeSnippet() {
        if (this.state.waitingOnService) return(<code>Loading code ...</code>);

        return (
            <code>
                &lt;script&gt;
                var gamify = gamify || &#123;&#125;;
                gamify.identifier = {'"' + this.state.identifier + '"'};
                &lt;/script&gt;
                &lt;script id="gamify_mainjs" async src={'"' + this.getHostName(document.location.href) + "/code/slideout/js/gamify.js" + '"'}&gt;&lt;/script&gt;
            </code>
        );
    }

    // Copy to clipboard using a temporary input field
    onCopy () {
        var elm = null;

        try {
            var field = document.createElement( 'input' );
            field.id = '__temp_code_field';
            field.value = this.getCodeSnippet().props.children.join(" ");

            document.body.appendChild( field );

            elm = document.getElementById('__temp_code_field');

            elm.select();

            if (document.execCommand('copy')) {
                //show copied
                this.setState( { copied: true }, () => {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = setTimeout( () => {
                        this.setState( { copied: false } );
                    }, 5000 );
                } );
            }
        } catch ( e ) {
        } finally {
            if ( elm ) {
                document.body.removeChild( elm );
            }
        }
    }

    onContact () {
        window.open("mailto:support@deepmarkit.com?subject=" + encodeURIComponent("Install Help"));
    }

    onGuide ( guideUrl ) {
        window.open(guideUrl,"guide");
    }

    render () {

        let codeSnippet = this.getCodeSnippet();
        return (
            <div>
                <ActionBar buttonGroup="integration"/>
                <div className="action-bar-spacer"/>

                <div className="container code_snippet m-t-10 m-b-14"> 
                    <div className="m-b-6"><h1><String code="label_code_integration_code_header"/></h1></div>
                    <div><String code="label_code_integration_code_desc"/></div>
                    <div className="m-t-4 m-b-8 code_snippet_box">
                        <pre>{codeSnippet}</pre>
                    </div>
                    <div className="form-group m-t-4">
                        {/* If the coupon was copied, change the button to a green button with the "copied!" text. The handler switches it back after a few seconds. We want to make sure the button still works while in the copied state so it keeps the handler. We also want to make sure that it stays the same size so i've added a min width to it. */}
                        { this.state.copied ?
                            <button className="btn btn-success round" style={{minWidth: "180px"}} onClick={this.onCopy.bind(this)}><i className="material-icons">check</i><String code="label_code_integration_button_copied"/></button>
                            :
                            <button className="btn btn-primary round" style={{minWidth: "180px"}} onClick={this.onCopy.bind(this)}><i className="material-icons">event_note</i><String code="label_code_integration_button_copy"/></button>
                        }
                    </div>
                </div>

                {
                    // Is this gamify? If so, show all the guides and the fallback general guide.
                    // If it's not gamify, we only want to show the guide relevant to this integration.
                    ConfigStore.INTEGRATION === "gamify" ? 
                        this.state.guides ?
                            <div className="container integration-guides m-b-14">
                                <div className="m-b-6"><h1><String code="label_code_integration_guide_header"/></h1></div>
                                <div className="integration-desc"><String code="label_code_integration_guide_desc2"/></div>
                                <div className="m-t-2">
                                    { 
                                        this.state.guides.map( guide => {
                                            return <img src={ guide.image } onClick={this.onGuide.bind(this, guide.url)} />
                                        }) 
                                    } 
                                </div>
                                <div className="integration-desc m-t-6"><String code="label_code_integration_guide_desc1"/></div>
                                <div className="m-t-6 m-b-12">
                                    <img className="integration-custom" src="/dashboard/images/guides/logos/deepmarkit.jpg" onClick={this.onGuide.bind(this,this.state.gamifyGuide)} />                        
                                </div>
                            </div>
                            :
                            null
                        :
                        this.state.guides ?
                                this.state.guides.map( guide => {
                                    return guide.id === ConfigStore.INTEGRATION ?
                                    <div className="container integration-guides m-b-14">
                                        <div className="m-b-6"><h1><String code="label_code_integration_guide_header"/></h1></div>
                                        <div className="integration-desc"><String code="label_code_integration_guide_desc3"/></div>
                                        <div className="form-group m-t-4">
                                            <button className="btn btn-primary round" style={{minWidth: "180px"}} onClick={this.onGuide.bind(this, guide.url)}>Installation Guide</button>
                                        </div>
                                    </div>
                                    :
                                    null
                                }) 
                            :
                            null
                }

                <div className="container center m-b-14">
                    <div className="m-b-6"><h1><String code="label_code_integration_help_header"/></h1></div>
                    <div className="form-group m-t-4">
                        <button className="btn btn-primary round" onClick={this.onContact.bind(this)}><String code="label_code_integration_button_contact"/></button>
                    </div>
                </div>
            </div>
        )
    }

}

module.exports = Integration;
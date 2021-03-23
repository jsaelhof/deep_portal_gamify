import React from 'react';
import String from '../../../common/String.jsx';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import TextInput from '../../../shared/TextInput.jsx';

class Tracking extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            bitlifying: false,
            emptyLinkField: false,
            copied: undefined
        };

        this.nameFilter = /[\W]+/g;
    }

    componentWillMount () {
        CampaignStore.addEventListener(this);
    }

    componentWillUnmount () {
        CampaignStore.removeEventListener(this);
    }

    getMainLink () {
        let url;
        this.props.campaignDetails.tracking.links.forEach( link => {
            if (link.channelCode === "main") {
                url = link.shortURL;
            }
        } );
        return url;
    }

    getLinksTable () {
        let rows = [];

        this.props.campaignDetails.tracking.links.forEach( link => {
            if (link.channelCode !== "main") {
                rows.push( <tr>
                    <td className="tracking-link-name">{link.name}</td>
                    <td className="tracking-link-url"><a href={link.shortURL} target="_blank">{link.shortURL}</a></td>
                    <td className="tracking-link-copy">
                        { this.state.copied === link.channelCode ?
                            <button className="btn-success btn-xs" onClick={this.onCopy.bind(this, link.shortURL, link.channelCode)}>Copied</button>
                            :
                            <button className="btn-primary btn-xs" onClick={this.onCopy.bind(this, link.shortURL, link.channelCode)}>Copy</button>
                        }
                    </td>
                    <td>
                        <button className="btn" onClick={this.onDeleteTrackingLink.bind(this,link.channelCode)}>
                            <a className="help-tooltip button-tooltip top">
                            <i className="material-icons md-18">close</i>
                                <div className="arrow"></div>
                                <div className="summary w-200">
                                    <h4><String code="sh_delete_tracking_link"/></h4>
                                </div>
                            </a>
                        </button>
                    </td>
                </tr> );
            }
        } );

        if (rows.length > 0) {
            return (
                <table className="table links-table">
                    <thead>
                        <tr key="header">
                            <th>Name</th>
                            <th>URL</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            );
        } else {
            return null;
        }
    }

    onAddTrackingLink () {
        if (this.state.newLinkName !== undefined && !this.state.bitlifying && !this.isDuplicateName()) {
            this.setState( { bitlifying: true }, () => {
                CampaignStore.bitlify(this.props.campaignHash, this.state.newLinkName.toLowerCase().replace(this.nameFilter, '') );
            } );
        } else {
            this.setState( { emptyLinkField: true } )
        }
    }

    onDeleteTrackingLink ( channelCode ) {
        let updatedLinks = [...this.props.campaignDetails.tracking.links];
        for (let i=0; i<updatedLinks.length; i++) {
            if (updatedLinks[i].channelCode === channelCode) {
                updatedLinks.splice(i,1);
                break;
            }
        }

        this.props.onUpdate(updatedLinks);
    }

    onBitlified ( e ) {
        if ( e.response && e.response.hasErrors() ) {
            // Handle the error
        } else {
            let data = e.response.result;

            let updatedLinks = [...this.props.campaignDetails.tracking.links];
            updatedLinks.push( {
                channelCode: data.channelCode,
                longURL: data.longURL,
                name: this.state.newLinkName, // Note: The server response munges the case a bit (It capitalizes the first letter of the channel code) so don't use it, use what the user typed instead.
                shortURL: data.shortURL
            } );

            this.setState( { newLinkName: undefined, bitlifying: false }, () => {
                this.props.onUpdate(updatedLinks);
            } );
        }
    }

    onLinkNameChange ( id, name ) {
        if (name.length > 0) this.setState( { emptyLinkField: false } );
        name = name.replace(this.nameFilter, '');
        this.setState( { newLinkName: name } );
    }

    isDuplicateName () {
        if (this.state.newLinkName) {
            let newName = this.state.newLinkName.toLowerCase().replace(this.nameFilter, '');

            for (let i=0; i<this.props.campaignDetails.tracking.links.length; i++) {
                console.log(this.props.campaignDetails.tracking.links[i].channelCode, newName)
                if (this.props.campaignDetails.tracking.links[i].channelCode === newName) {
                    return true;
                }
            }

            return false;
        } else {
            return false;
        }
    }

    onCopy ( url, channelCode ) {
        var elm = null;

        try {
            var field = document.createElement( 'input' );
            field.id = '__temp_code_field';
            field.value = url;

            document.body.appendChild( field );

            elm = document.getElementById('__temp_code_field');

            elm.select();

            if (document.execCommand('copy')) {
                //show copied
                this.setState( { copied: channelCode }, () => {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = setTimeout( () => {
                        this.setState( { copied: undefined } );
                    }, 2500 );
                } );
            }
        } catch ( e ) {
        } finally {
            if ( elm ) {
                document.body.removeChild( elm );
            }
        }
    }

    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="label_tracking_links" />
                                </h1>
                                {/* <h3 className="subheading"><String code="sh_label_customize_slideout"/></h3> */}
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="m-t-2 m-b-4">This is the link to your campaign. Share it with the world using any method to distribute a URL.</div>
                            <div className="tracking-main m-t-2 m-b-4">
                                <div className="m-r-8">{this.getMainLink()}</div>
                                { this.state.copied === "main" ?
                                    <button className="btn-success btn-xs" onClick={this.onCopy.bind(this, this.getMainLink(), "main")}>Copied</button>
                                    :
                                    <button className="btn-primary btn-xs" onClick={this.onCopy.bind(this, this.getMainLink(), "main")}>Copy</button>
                                }
                            </div>


                            <h4 className="m-t-10">Optional Tracking Links</h4>
                            { this.props.campaignDetails.tracking.links.length === 1 ?
                                <div className="tracking-links m-b-4">Create additional distributable links to segment and track your campaign's traffic using tools such as Google Analytics.</div>
                                :
                                <div className="tracking-links m-b-4">
                                    {this.getLinksTable()}
                                </div>
                            }
                            
                            <div className="tracking-links-add">
                                <div className="m-r-4">
                                    <TextInput error={ this.state.emptyLinkField || this.isDuplicateName() } value={this.state.newLinkName} placeholder={"Link Name"} onChange={this.onLinkNameChange.bind(this)}/>
                                </div>
                                <button className="btn btn-primary round" onClick={this.onAddTrackingLink.bind(this)}>+ Add Tracking Link</button>
                            </div>
                            { this.state.emptyLinkField ?
                                <div className="invalid-field-subtext">Enter a link name</div>
                                :
                                this.isDuplicateName() ?
                                    <div className="invalid-field-subtext">This name has already been used</div>
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

module.exports = Tracking;
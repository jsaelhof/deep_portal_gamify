import React from 'react';
import {browserHistory as History} from 'react-router';
import ConfigStore from '../../../store/ConfigStore';
import LocalStorageStore from '../../../store/LocalStorageStore';

class NavMenu extends React.Component {
    constructor( props ) {
        super( props );
    } 

    onBlockerClick () {
        this.props.onNavMenuClose();
    }

    onMyAccount () {
        History.push(ConfigStore.buildRoutePath('account', 'portal'));
        this.props.onNavMenuClose();
    }

    onTour () {
        if (this.props.onNavEvent) this.props.onNavEvent( "tour" );
        this.props.onNavMenuClose();
    }

    onLogout () {
        window.localStorage.removeItem("gamifyHeaders");
        this.props.onNavMenuClose();
        window.location.reload();
    }

    onSubscribe () {
        History.push(ConfigStore.buildRoutePath('subscribe'));
        this.props.onNavMenuClose();
    }

    onHelp () {
        window.open("https://support.deepmarkit.com/hc/en-us","_blank");
        this.props.onNavMenuClose();
    }

    onCustomLink ( link, target ) {
        window.open( link, target ? target : "_self" );
        this.props.onNavMenuClose();
    }

    topSectionHasEnabledItems () {
        return ConfigStore.isMenuItemEnabled("myaccount") || 
                ConfigStore.isMenuItemEnabled("tour") || 
                ConfigStore.isMenuItemEnabled("logout");
    }

    bottomSectionHasEnabledItems () {
        return (this.props.showSubscribe && ConfigStore.isMenuItemEnabled("subscribe")) || 
                ConfigStore.isMenuItemEnabled("help") ||
                ConfigStore.getCustomMenuItems().length > 0;
    }

    render() {
        return (
            <div className="nav-menu-wrapper">
                <div className="nav-menu-blocker" onClick={this.onBlockerClick.bind(this)}></div>
                <div className="arrow-box">
                    {
                        this.topSectionHasEnabledItems() ?
                            <ul>
                                { ConfigStore.isMenuItemEnabled("myaccount") ? <li onClick={this.onMyAccount.bind(this)}><div><i className="material-icons">account_circle</i><span className="icon-text">My Account</span></div></li> : null }
                                { ConfigStore.isMenuItemEnabled("tour") ? <li onClick={this.onTour.bind(this)}><div><i className="material-icons">new_releases</i><span className="icon-text">What's New</span></div></li> : null }
                                { ConfigStore.isMenuItemEnabled("logout") ? <li onClick={this.onLogout.bind(this)}><div><i className="material-icons">exit_to_app</i><span className="icon-text">Logout</span></div></li> : null }
                            </ul>
                            :
                            null
                    }

                    {/* Determine if we should show the horizontal rule in the menu. Only show it if there's at least one item above AND one item below. If either side is empty, hide it. */}
                    { 
                        this.topSectionHasEnabledItems() && this.bottomSectionHasEnabledItems() ? <hr/> : null 
                    }

                    {
                        this.bottomSectionHasEnabledItems() ?
                            <ul>
                                { this.props.showSubscribe && ConfigStore.isMenuItemEnabled("subscribe") ? <li onClick={this.onSubscribe.bind(this)}><div>Subscribe</div></li> : null }

                                { ConfigStore.getCustomMenuItems().length ?  
                                    ConfigStore.getCustomMenuItems().map( item => {
                                        if ( item.label && item.link ) {
                                            return <li onClick={this.onCustomLink.bind(this, item.link, item.target)}><div>{item.label}</div></li>
                                        }
                                    } )
                                    :
                                    null
                                }

                                { ConfigStore.isMenuItemEnabled("help") ? <li onClick={this.onHelp.bind(this)}><div>FAQ</div></li> : null }
                            </ul>
                            :
                            null
                    }
                </div>
            </div>
        );
    }
}

module.exports = NavMenu;
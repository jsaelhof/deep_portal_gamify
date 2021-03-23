import React from 'react';
import i18n from '../../../store/i18nStore';
import Modal from '../../common/Modal.jsx';
import String from '../../common/String.jsx';
import Messenger from '../../../util/messenger';
import ConfigStore from '../../../store/ConfigStore';


class ThemePreview extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            initLoad: true,
            view: 'desktop',
            orientation: 'landscape',
            saveState: 1,
            showPrompt: false,
            reload: false,
            nocache: Math.random( 999 ),
            src: '',
            messenger: null,
            campaignDetails: this.props.campaignDetails
        }
    }

    componentDidMount () {

        if ( this.state.campaignDetails.themeInfo ) {

            this.setState( { previewSourceReady: true }, function () {
                try {
                    let _messenger = new Messenger( window, this.receiveMessengerMessage.bind( this ), "json" );
                    this.setState( { messenger: _messenger, src: '/editor/'+ ConfigStore.INTEGRATION +'/entry/' + this.props.campaignHash + '/main' } );
                } catch ( e ) {
                    console.log( 'Failed initializing messenger' );
                }

            } );
        }

    }

    receiveMessengerMessage ( data ) {
        let response = {};

        try {
            response = JSON.parse( data );
        } catch ( e ) {
            response = data;
        }

        if ( response.type ) {
            switch ( response.type ) {
                case 'initialized':
                    let frame  = window.frames.preview;
                    let params = { type: 'showGame', data: { showGame: false } };
                    this.state.messenger.send( frame, params ); // don't show game
                    this.state.messenger.send( frame, { type: 'disableSave', data: { disableSave: true } } ); // don't want lead-app saving to avoid data going out of sync
                    break;
            }
        }
    }

    onSaveStateUpdate ( e ) {
        this.setState( { saveState: e.state }, function () {
            if ( this.state.cb ) { this.state.cb(); }
        } );
    }
    onChangeView ( view ) {
        this.setState( { view: view } );
    }
    onChangeOrientation () {
        let orientation = this.state.orientation === 'landscape' ? 'portrait' : 'landscape';
        this.setState( { orientation: orientation } );
    }

    isGameSet () {
        return this.props.gameSelected;
    }

    openPreview ( path ) {
        let preview = window.open( '', '_blank' );
        this.setState( { _preview: preview, cb: function () {
            this.setState( { cb: false }, function () {
                this.state._preview.location.href = path;
                this.setState( { _preview: false } );
            } );
        }.bind( this ) }, function () {
            this.props.saveRequest();
        } );
    }

    editorLoaded () {
        this.setState( { initLoad: false } );
    }

    hidePrompt () {
        this.setState( { showPrompt: false } );
    }

    render () {

        if ( !this.props.selectedTheme ) {
            return ( <div className="incomplete-msg alert alert-danger">{i18n.stringFor('error_site_editor_no_theme_selected', 'error_desc')}</div> );
        }

        if ( this.props.previewSourceReady ) {
            return (
                <div>
                    { this.state.initLoad ? null : <div className="campaign-editor" /> }

                        <div>
                            {
                                this.state.reload ? null : 
                                <aside id="preview-window" className="preview-window-portrait preview-window">
                                    <div className="theme-wrapper">
                                        <iframe onLoad={this.editorLoaded.bind( this )} id="preview" className="preview-theme" name="preview" width="100%" height="100%" type="text/html" src={ this.state.src } />
                                    </div>
                                </aside>

                            }
                        </div>

                    { this.state.showPrompt ? <NotifySave campaignHash={this.props.campaignHash} onHide={this.hidePrompt.bind( this )} onDone={this.hidePrompt.bind( this )} /> : null }
                </div>
            );
        }

        return ( <div className="incomplete-msg alert alert-danger">{i18n.stringFor('error_site_editor_failed', 'error_desc')}</div> );
    }
}

module.exports = ThemePreview;
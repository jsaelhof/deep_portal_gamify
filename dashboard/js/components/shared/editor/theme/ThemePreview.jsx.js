import React from 'react';
import ConfigStore from '../../../../store/ConfigStore';
import _ from 'underscore';


class ThemePreview extends React.Component {
    constructor( props ) {
        super( props );
        
        let src = "/campaign/"+this.props.campaignHash+"/main?mode=editor";

        // Check if the config specifies that we pass additional params to the theme preview. If so, add them.
        let params = ConfigStore.getThemePreviewUrlParams();
        _.mapObject( params, ( val, key ) => {
            src += "&" + key + "=" + encodeURIComponent(val);
        } );

        this.state = {
            src: src
        }
    }
   
    render () {
        return (
            <div className="preview-panel" style={{height: this.props.height}}>
                <iframe id="preview" name="preview" style={{width: this.props.width, boxSizing: 'content-box', boxShadow: this.props.previewShadow ? "1px 2px 10px rgba(0,0,0,.4)" : "none"}} type="text/html" src={ this.state.src } />
            </div>
        );
    }
}

module.exports = ThemePreview;
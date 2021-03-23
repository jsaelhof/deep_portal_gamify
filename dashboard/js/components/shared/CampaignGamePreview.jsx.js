import React from 'react';

class CampaignGamePreview extends React.Component {

    constructor(props) {
        super(props);

        if (!props.gameId || !props.skinId) {
            // TODO: Throw an error
        }

        this.previewUrl;
        this.setPreviewUrl( this.props.skill );
    }

    componentWillReceiveProps ( newProps ) {
        if (newProps.timestamp !== this.props.timestamp) {
            this.setPreviewUrl(newProps.skill);
        }
    }

    setPreviewUrl ( skill ) {
        this.previewUrl = "/campaignplay/"+this.props.skinId+"/core/preview.html?gameId="+this.props.gameId+"&skinId="+this.props.skinId+"&skill="+skill+"&timestamp=";
    }

    render () {
        return (
            <object id={"gamepreview" + this.props.id} data={this.previewUrl + this.props.timestamp}>
                <img src="/dashboard/images/previewunavailable.png"/>
            </object>
        )
    }

}

export default CampaignGamePreview;
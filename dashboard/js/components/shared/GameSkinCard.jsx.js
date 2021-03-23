import React from 'react';

class GameSkinCard extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            previewUrl: "/play/games/"+this.props.gameId+"/skins/"+this.props.skinId+"/screen.jpg",
            fallbackPreviewUrl: "/play/games/"+this.props.gameId+"/skins/"+this.props.fallbackPreviewSkinId+"/screen.jpg"
        }
    }

    componentWillMount () {
    }
    componentDidMount () {
    }
    componentWillUnmount () {
    }

    onSelect () {
        this.props.onGameSelect( this.props.gameId, this.props.skinId );
    }

    onPreview () {
        this.props.onGamePreview( this.props.gameId, this.props.skinId );
    }

    onShowMore () {
        this.props.onShowMore( this.props.gameId );
    }

    render () {
        return (
            this.props.actAsShowMoreButton ?
                <div className={`game-skin-card game-skin-card-${this.props.orientation}`}>
                    <div className="card-preview">
                        <div className={`show-more-button show-more-button-${this.props.orientation}`} onClick={this.onShowMore.bind(this)}>
                            <div><i className="material-icons">playlist_add</i></div>
                            <div>Show {this.props.additionalSkins} More</div>
                        </div>
                    </div>
                </div>
                :
                <div className={`game-skin-card game-skin-card-${this.props.orientation}`}>
                    <div className="card-preview">
                        <img 
                            src={this.state.previewUrl} 
                            onClick={this.onSelect.bind(this)} 
                            width={ this.props.orientation === "portrait" ? 150 : 240 } 
                            height={ this.props.orientation === "portrait" ? 240 : 150 } 
                            onError={(e) => {
                                e.currentTarget.src = this.state.fallbackPreviewUrl;
                            }}
                        />
                    </div>
                    <div className="game-skin-card-label">{ this.props.skinDisplayName }</div>
                    {/* <div className="card-ctrl">
                        <ul className="nav">
                            <li><button className="btn btn-default btn-sm round m-t-2" onClick={this.onPreview.bind(this)}>Preview</button></li>
                            <li><button className="btn btn-primary btn-sm round m-t-2" onClick={this.onSelect.bind(this)}>Select</button></li>
                        </ul>
                    </div> */}
                </div>
        );
    }
};


export default GameSkinCard;
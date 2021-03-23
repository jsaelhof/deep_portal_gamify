import React from 'react';

class GameCard extends React.Component {

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

    render () {
        return (
                <div className="game-card">
                    <div className="card-preview">
                        <img 
                            src={this.state.previewUrl} 
                            onClick={this.onSelect.bind(this)} 
                            width={ this.props.orientation === "portrait" ? 200 : 320 } 
                            height={ this.props.orientation === "portrait" ? 320 : 200 } 
                            onError={(e) => {
                                e.currentTarget.src = this.state.fallbackPreviewUrl;
                            }}
                        />
                    </div>
                    <h1>{ this.props.displayName }</h1>
                    <div className="card-ctrl">
                        <ul className="nav">
                            <li><button className="btn btn-default round m-t-2" onClick={this.onPreview.bind(this)}>Preview</button></li>
                            <li><button className="btn btn-primary round m-t-2" onClick={this.onSelect.bind(this)}>Select</button></li>
                        </ul>
                    </div>
                </div>
        );
    }
};


export default GameCard;
import React from 'react';

class GrandPrizeDraw extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {};
    }

    onGrandPrizeToggle (e) {
        let details = {...this.props.campaignDetails};

        // Check if the grand prize draw is included in the campaign details. 
        // Old campaigns won't have it.
        details.grandPrizeDraw = details.grandPrizeDraw || {};

        // Set the value of whether the draw is enabled.
        details.grandPrizeDraw.enabled = e.currentTarget.checked;

        // update the preview with the newly ordered data fields
        window.frames.preview.postMessage( JSON.stringify( { type: 'grandprize', data: details.grandPrizeDraw.enabled } ), "*" );

        this.props.onUpdate( details.grandPrizeDraw );
    }

    isGrandPrizeEnabled () {
        return this.props.campaignDetails.grandPrizeDraw ? this.props.campaignDetails.grandPrizeDraw.enabled : false;
    }

    render () {
        return (
            <div className="settings grand-prize" id="grandprize">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <div className="panel-title">
                                    <h1>CASH CLUB 50/50</h1>
                                </div>
                                <h3 className="subheading">Offer your visitors an entry in DeepMarkit's monthly CASH Club 50/50 Sweepstakes!</h3>
                            </div>
                            <div className="grand-prize-star"/>
                        </div>
                        <div className="panel-body">
                            <div className="grand-prize-content">
                                <div>
                                    <img src="/dashboard/images/grandprize/grandprizebanner.png"/>
                                </div>
                                <div className="grand-prize-message">
                                    <div className="m-t-1 m-b-6">
                                        <div className="m-b-2"><h3 style={{ margin: 0 }}>Offer a monthly cash prize guaranteed to generate more leads and repeat visits!</h3></div>
                                        <div className="m-b-2">Your campaign will look even more exciting when you offer your visitors a cash prize sweepstakes entry for signing up -- and DeepMarkit puts up the Cash!</div>
                                        <div className="m-b-2">Once a month, DeepMarkit will draw a winner from all campaign entrants collected by all active campaigns that have enabled the CASH CLUB 50/50 Sweepstake feature (your players and the players of other DeepMarkit users). The winner will be awarded a cash prize of $100 and the merchant whose entrant was selected will also win $100 all paid in full by DeepMarkit.</div>
                                        <div className="m-b-2">CASH CLUB 50/50 Sweepstakes messaging will be automatically added to your entry form.</div>
                                        <div style={{ fontSize: "0.9em" }}><a href="https://deepmarkit.com/cashclub-rules/" target="_blank">Official Rules</a></div>
                                    </div>
                                    <div className="form-inline m-b-3 m-t-3">
                                        <div className="form-group">
                                            <input type="checkbox"
                                                id='grandPrizeToggle'
                                                data-switch="color"
                                                disabled={false}
                                                name='grandPrizeToggle'
                                                onChange={(e) => this.onGrandPrizeToggle(e)}
                                                checked={this.isGrandPrizeEnabled()}
                                            />

                                            <label htmlFor={'grandPrizeToggle'} className="m-b-0" />
                                        </div>

                                        <div className="form-group m-b-1 m-l-2">
                                            <h3 style={{ margin: 0 }}>Add the CASH CLUB 50/50 Sweepstakes Draw!</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

module.exports = GrandPrizeDraw
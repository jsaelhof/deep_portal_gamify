import React from 'react';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import TextInput from '../../../shared/TextInput.jsx';
import _ from 'underscore';

class Social extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
        };
    }

    componentWillMount () {
        CampaignStore.addEventListener(this);
    }

    componentWillUnmount () {
        CampaignStore.removeEventListener(this);
    }

    orderUp ( prizeId, index ) {
        this.swap( index - 1, index );
    }

    orderDown ( prizeId, index ) {
        this.swap( index + 1, index );
    }

    swap ( indexA, indexB ) {
        let sortedVisiblePrizes = _.sortBy(this.props.campaignDetails.prizes, "displayIndex").filter( prize => prize.show === "true" );

        if (indexA < 0 || indexA === sortedVisiblePrizes.length || indexB < 0 || indexB === sortedVisiblePrizes.length) return;

        let targetId = sortedVisiblePrizes[indexA].id;
        let toMoveId = sortedVisiblePrizes[indexB].id;
        let targetDisplayIndex = sortedVisiblePrizes[indexA].displayIndex;
        let toMoveDisplayIndex = sortedVisiblePrizes[indexB].displayIndex;

        let updatedPrizes = { ...this.props.campaignDetails.prizes };
        updatedPrizes[ targetId ].displayIndex = toMoveDisplayIndex;
        updatedPrizes[ toMoveId ].displayIndex = targetDisplayIndex;
        this.props.onUpdate(updatedPrizes);
    }

    toggleVisibility ( prizeId ) {
        let updatedPrizes = { ...this.props.campaignDetails.prizes };
        updatedPrizes[ prizeId ].show =  updatedPrizes[ prizeId ].show === "true" ? "false" : "true";
        this.props.onUpdate(updatedPrizes);
    }

    generatePrizeTable () {
        let headerCells = <tr>
            <td className="order-index"></td>
            <td className="order-prize">Prize</td>
            <td className="order-type">Type</td>
            <td className="order-controls"></td>
        </tr>

        let rows = [];

        let sortedPrizes = _.sortBy(this.props.campaignDetails.prizes, "displayIndex");

        let visiblePrizes = sortedPrizes.filter( prize => prize.show === "true" );
        let hiddenPrizes = sortedPrizes.filter( prize => prize.show === "false" );

        visiblePrizes.map( (prize, index) => {
            rows.push (
                <tr className="order-visible">
                    <td className="order-index">{index + 1}</td>
                    <td className="order-prize">{ prize.title && prize.title.length > 0 ? prize.title : <span className="order-missing-name">[No Prize Name Set]</span>}</td>
                    <td className="order-type">{i18n.stringFor("sh_label_" + prize.type)}</td>
                    <td className="order-controls">
                        { index === 0 ? 
                            <i className="material-icons order-up order-disable-arrow" disabled={true}>keyboard_arrow_up</i>
                            :
                            <i className="material-icons order-up" onClick={this.orderUp.bind(this, prize.id, index)}>keyboard_arrow_up</i>
                        }
                        { index === visiblePrizes.length - 1 ? 
                            <i className="material-icons order-down order-disable-arrow" disabled={true}>keyboard_arrow_down</i>
                            :
                            <i className="material-icons order-down" onClick={this.orderDown.bind(this, prize.id, index)}>keyboard_arrow_down</i>
                        }
                        <i className="material-icons order-visibility" onClick={this.toggleVisibility.bind(this, prize.id, index)}>visibility</i>
                    </td>
                </tr>
            )
        } );

        // Note: The up and down arrows are ekpt to maintain the alignment of the visibility icon. They are set to transparent with no click handlers to make them inactive.
        hiddenPrizes.map( (prize, index) => {
            rows.push (
                <tr className="order-hidden">
                    <td className="order-index">{visiblePrizes.length + (index + 1)}</td>
                    <td className="order-prize">{ prize.title && prize.title.length > 0 ? prize.title : <span className="order-missing-name">[No Prize Name Set]</span>}</td>
                    <td className="order-type">{i18n.stringFor("sh_label_" + prize.type)}</td>
                    <td className="order-controls">
                        <i className="material-icons order-up">keyboard_arrow_up</i> 
                        <i className={"material-icons order-down"}>keyboard_arrow_down</i>
                        <i className="material-icons order-visibility" onClick={this.toggleVisibility.bind(this, prize.id, index)}>visibility_off</i>
                    </td>
                </tr>
            )
        } );

        return (
            <table className="table prize-order-table">
                <thead>
                    {headerCells}
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }

    render () {
        return (
            <div className="settings" id="order">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>Prize Display</h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            { 
                                _.size(this.props.campaignDetails.prizes) > 0 ?
                                    <div>
                                        <div className="m-t-1 m-b-2">Set the order that your prizes will appear on your campaign entry page. You may also hide prizes so that they are not displayed.</div>
                                        <div className="m-b-3 editor-subtext">Hiding a prize DOES NOT prevent it from being awarded to your players.</div>
                                        <div>
                                            { this.generatePrizeTable() }
                                        </div>
                                    </div>
                                    :
                                    <div className="m-t-1 m-b-2">
                                        You do not have any prizes configured yet.
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Social;
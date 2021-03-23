import React from 'react';
import i18n from '../../store/i18nStore';
import CampaignStore from '../../store/CampaignStore';
import ActionBar from './nav/ActionBar.jsx';
import Loading from '../shared/Loading.jsx';
import String from '../common/String.jsx';
import Confirm from '../shared/Confirm.jsx';
import ConfigStore from '../../store/ConfigStore';
import ErrorStore from '../../store/ErrorStore';

class Winners extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { 
            winners: undefined,
            filteredWinners: undefined,
            filter: undefined,
            pageSize: 20,
            currentPage: 0,
            campaignDetails: undefined
        }

        this.timeoutId;
    }
    componentWillMount () {
        CampaignStore.addEventListener(this);
    }
    componentWillUnmount () {
        CampaignStore.removeEventListener(this);
    }
    componentDidMount () {
        CampaignStore.sendGetCampaignDetails( this.props.params.campaignHash );
    }

    onCampaignDetailsRetrieved (e) {
        if (e.response && e.response.hasErrors()) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            this.setState({ campaignDetails: e.state }, () => {
                CampaignStore.getAwardsList( this.props.params.campaignHash );
            });
        }
    } 

    onAwardsListRetrieved ( e ) {
        if (e.response && e.response.hasErrors()) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            let filteredWinners = this.filterWinners( e.response.result.winnerList );
            this.setState( { winners: e.response.result.winnerList, filteredWinners: filteredWinners } );
        }
    }

    filterWinners ( winners ) {
        // Iterate over the winners and remove any that don't match the filter
        return winners.filter( winner => {
            // Check if the user is active.
            // If not, it's because the lead was deleted but still has an entry in the system (GDPR stuff).
            // Inactive user's are shown when not filtered but not when filtered because all the info we filter on has been removed.
            if (!this.state.filter) {
                return winner;
            } else if (
                winner.leadInfo.status === "ACTIVE" &&
                winner.leadInfo &&
                winner.leadInfo.details &&
                (winner.leadInfo.details.email && winner.leadInfo.details.email.toLowerCase().includes(this.state.filter.toLowerCase()))
            ) {
                return winner;
            }
        } );
    }

    onUpdateFilter (e) {
        // Clear any previous timeout
        if (this.timeoutId !== undefined) {
            clearTimeout(this.timeoutId);
        }

        // Start a new timeout to update the filter.
        // If another change event fires while this timeout is waiting to execute, this one will be cancelled and replaced.
        // This prevents excessive filtering operations while typing.
        this.timeoutId = setTimeout( ( newVal ) => {
            this.timeoutId = undefined;
            this.setState({ filter: newVal, currentPage: 0 }, () => {
                this.setState( { filteredWinners: this.filterWinners(this.state.winners) } );
            } );
        }, 750, e.currentTarget.value );
    }

    getWinnersForPage () {
        let firstIndexOfPage = this.state.currentPage * this.state.pageSize;
        let pageData = this.state.filteredWinners.slice(firstIndexOfPage,firstIndexOfPage + this.state.pageSize);

        let rows = [];

        pageData.forEach( lead => {
            if (lead.leadInfo.status === "ACTIVE") {
                rows.push(
                    <tr>
                        { ConfigStore.showColoumnForWinnersPage("date") ? <td>{this.formatDate(lead.leadInfo.timestamp)}</td> : null }
                        { ConfigStore.showColoumnForWinnersPage("email") ? <td>{lead.leadInfo.details.email}</td> : null }
                        { ConfigStore.showColoumnForWinnersPage("prize") ? <td>{lead.prizeInfo.title}</td> : null }
                    </tr> 
                );
            } else {
                rows.push(
                    <tr style={{ color: "#BBB" }}>
                        { ConfigStore.showColoumnForWinnersPage("date") ? <td>{this.formatDate(lead.leadInfo.timestamp)}</td> : null }
                        { ConfigStore.showColoumnForWinnersPage("email") ? <td style={ { fontStyle: "italic" } }>Removed</td> : null }
                        { ConfigStore.showColoumnForWinnersPage("prize") ? <td>{lead.prizeInfo.title}</td> : null }
                    </tr> 
                );
            }
        } );

        return rows;
    }

    formatDate ( timestamp ) {
        return i18n.moment.utc(timestamp, "YYYY-MM-DD HH:mm Z").local().format(CampaignStore.fullDateDisplayFormat);
    }

    onNextPage () {
        let lastPage = Math.ceil(this.state.filteredWinners.length / this.state.pageSize);

        if (this.state.currentPage + 1 < lastPage) {
            this.setState( { currentPage:this.state.currentPage + 1 } );
        }
    }

    onPrevPage () {
        if (this.state.currentPage > 0) {
            this.setState( { currentPage:this.state.currentPage - 1 } );
        }
    }

    getNumberOfFirstLeadOnPage () {
        return this.state.filteredWinners.length > 0 ? (this.state.currentPage * this.state.pageSize) + 1 : 0;
    }

    getNumberOfLastLeadOnPage () {
        let lastPage = Math.floor(this.state.filteredWinners.length / this.state.pageSize);
        if (this.state.currentPage < lastPage) {
            return (this.state.currentPage * this.state.pageSize) + this.state.pageSize;
        } else {
            return this.state.filteredWinners.length;
        }
    }

    render () {
        if (!this.state.campaignDetails || !this.state.winners) {
            return <Loading modal={false} />;
        } else {
            return(
                <div>
                    <ActionBar buttonGroup="winners"/>
                    <div className="action-bar-spacer"/>

                    <div className="col-xs-12 winner-table">
                        <div className="lead-title">{this.state.campaignDetails.details.name} - Winners List</div>
                        <div className="lead-table-header">
                            <div className="lead-search">
                                <div><i className="material-icons">search</i></div>
                                <div>
                                    <input className="form-control" placeholder="Search by Email" type="text" name="filter" onChange={this.onUpdateFilter.bind(this)}/>
                                </div>
                            </div>
                            <div className="lead-page">
                                Displaying&nbsp;&nbsp;{this.getNumberOfFirstLeadOnPage()} - {this.getNumberOfLastLeadOnPage()}&nbsp;&nbsp;of&nbsp;&nbsp;{this.state.filteredWinners.length}
                                <button className="btn" onClick={this.onPrevPage.bind(this)}><i className="material-icons">navigate_before</i></button>
                                <button className="btn" onClick={this.onNextPage.bind(this)}><i className="material-icons">navigate_next</i></button>
                            </div>
                            <div className="lead-spacer"></div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    { ConfigStore.showColoumnForWinnersPage("date") ? <th>Date</th> : null }
                                    { ConfigStore.showColoumnForWinnersPage("email") ? <th>Email</th> : null }
                                    { ConfigStore.showColoumnForWinnersPage("prize") ? <th>Prize(s)</th> : null }
                                </tr>
                            </thead>
                            <tbody>
                                { this.getWinnersForPage() }
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    }
}

module.exports = Winners;
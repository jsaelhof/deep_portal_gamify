import React from 'react';
import i18n from '../../store/i18nStore';
import UserStore from '../../store/UserStore';
import ActionBar from './nav/ActionBar.jsx';
import Loading from '../shared/Loading.jsx';
import Confirm from '../shared/Confirm.jsx';
import ConfigStore from '../../store/ConfigStore';
import CampaignStore from '../../store/CampaignStore';
import ErrorStore from '../../store/ErrorStore';
import _ from 'underscore';

class Leads extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { 
            leads: undefined,
            filteredLeads: undefined,
            filter: undefined,
            pageSize: 20,
            currentPage: 0,
            showConfirmDelete: false,
            leadToDelete: undefined,
            showDeleteSuccess: false
        }

        this.timeoutId;
    }
    componentWillMount () {
        UserStore.addEventListener(this);
    }
    componentWillUnmount () {
        UserStore.removeEventListener(this);
    }
    componentDidMount () {
        CampaignStore.getFullCampaignList( ( response ) => {
            if (response.hasErrors()) {
                ErrorStore.rpcResponseError( response );
            } else {
                let fieldMap = {};

                _.map( response.result.campaignList, campaign => {
                    _.keys(campaign.details.forms.ENTRY_PAGE).forEach( key => {
                        if (!fieldMap[key]) {
                            fieldMap[key] = campaign.details.forms.ENTRY_PAGE[key]
                        }
                    } );
                } );

                this.setState( {
                    dataCollectionFieldMap: fieldMap
                }, () => {
                    UserStore.listLeads();
                } );
            }
        } );
    }

    onLeadListRetrieved ( e ) {
        if (e.response && e.response.hasErrors()) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            let filteredLeads = this.filterLeads( e.response.result.leadList );
            this.setState( { leads: e.response.result.leadList, filteredLeads: filteredLeads } );
        }
    }

    filterLeads ( leads ) {
        let sortedLeads = leads.sort( ( a, b ) => {
            a = i18n.moment(a.timestamp);
            b = i18n.moment(b.timestamp);
            if (a.isAfter(b)) {
                return -1;
            } else if (a.isBefore(b)) {
                return 1;
            } else {
                return 0;
            }
        } );

        // Iterate over the leads and remove any that don't match the filter
        return sortedLeads.filter( lead => {
            // Check if the user is active.
            // If not, it's because the lead was deleted but still has an entry in the system (GDPR stuff).
            // Inactive user's are shown when not filtered but not when filtered because all the info we filter on has been removed.
            if (!this.state.filter) {
                return lead;
            } else if (
                lead.status === "ACTIVE" &&
                lead.details.email.toLowerCase().includes(this.state.filter.toLowerCase())
            ) {
                return lead;
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
                this.setState( { filteredLeads: this.filterLeads(this.state.leads) } );
            } );
        }, 750, e.currentTarget.value );
    }

    generateLeadTableForPage () {
        let firstIndexOfPage = this.state.currentPage * this.state.pageSize;
        let pageData = this.state.filteredLeads.slice(firstIndexOfPage,firstIndexOfPage + this.state.pageSize);

        let staticDetails = ["email","channel","history","ipaddress"];

        // Build a list of custom columns.
        // If two campaigns have a custom column for data  collection with the same label, we need to merge them.
        // We'll do this by using the display label as the key and creating a list of all form keys that are grouped under that column.
        // Later, when we loop over the leads to populate the columns, we'll look at each custom column and see if this lead has a form key
        // under that custom column group. If it does we can display its value. Otherwise this lead doesn't have any info for that column.
        let customColumns = {};
        _.keys(this.state.dataCollectionFieldMap).forEach( key => {
            if (key !== "email" && staticDetails.indexOf(key) < 0) {
                let normalizedLabel = this.state.dataCollectionFieldMap[key].label.replace(" ","_");

                if (!customColumns[normalizedLabel]) {
                    customColumns[normalizedLabel] = {
                        label: this.state.dataCollectionFieldMap[key].label,
                        formKeys: []
                    };
                }
                customColumns[normalizedLabel].formKeys.push(key);
            }
        } );

        // Generate the column headers
        let headerColumns = [];

        headerColumns.push(<th className="lead-campaignName">Campaign</th>);
        headerColumns.push(<th className="lead-timestamp">Date</th>);
        headerColumns.push(<th className="lead-email">Email</th>);

        {
            _.keys(customColumns).forEach( key => {
                headerColumns.push(<th className="lead-custom">{ customColumns[key].label }</th>);
            } );
        }

        headerColumns.push(<th className="lead-channel">Channel</th>);
        headerColumns.push(<th className="lead-ipaddress">IP Address</th>);
        headerColumns.push(<th className="lead-prizeNames">Prize(s)</th>);
        headerColumns.push(<th className="lead-remove">Remove</th>);

        // Generate the rows
        let rows = [];
        pageData.forEach( lead => {
            if (lead.status === "ACTIVE") {
                rows.push(
                    <tr>
                        <td className="lead-campaignName">{lead.campaignName}</td>
                        <td className="lead-timestamp">{this.formatDate(lead.timestamp)}</td>
                        <td className="lead-email">{lead.details.email}</td>
                        {
                            _.keys(customColumns).map( key => {
                                return <td className={"lead-custom"}>{this.formatDetailValue(lead,customColumns[key].formKeys)}</td>
                            } )
                        }
                        <td className="lead-channel">{lead.details.channel}</td>
                        <td className="lead-ipaddress">{lead.details.ipaddress.split(",")[0]}</td>
                        <td className="lead-prizeNames">{lead.prizeNames}</td>
                        <td className="lead-remove">
                            <button className="btn" onClick={this.onLeadDelete.bind(this,lead)}>
                                <i className="material-icons md-18">close</i>
                            </button>
                        </td>
                    </tr> 
                );
            } else {
                rows.push(
                    <tr style={{ color: "#BBB" }}>
                        <td className="lead-campaignName">{lead.campaignName}</td>
                        <td className="lead-timestamp">{this.formatDate(lead.timestamp)}</td>
                        <td className="lead-email" style={ { fontStyle: "italic" } }>Removed</td>
                        {
                            _.keys(customColumns).map( key => {
                                return <td className={"lead-custom"}></td>
                            } )
                        }
                        <td className="lead-channel">-</td>
                        <td className="lead-ipaddress">-</td>
                        <td className="lead-prizeNames">{lead.prizeNames}</td>
                        <td className="lead-remove"></td>
                    </tr> 
                );
            }
        } );

        return (<table>
            <thead>
                <tr>
                    {headerColumns}
                </tr>
            </thead>
            <tbody>
                { rows }
            </tbody>
        </table>);
    }

    getFormattedTableRowForLeadToDelete ( lead ) {
        let data = [];
        _.keys(lead.details).forEach( key => {
            if (key !== "email" && this.state.dataCollectionFieldMap[key]) {
                data.push( 
                    <tr>
                        <td>{this.state.dataCollectionFieldMap[key].label}</td>
                        <td>{this.formatDetailValue(lead, [key])}</td>
                    </tr>
                );
            }
        } );
        return data;
    }

    formatDetailValue ( lead, formKeys ) {
        let formKey;
        formKeys.forEach( key => {
            if (lead.details[key] !== undefined) {
                formKey = key;
            }
        } );
        
        let value = lead.details[formKey] || "";

        if (value === "true") value = "True";
        if (value === "false") value = "False";

        return value;
    }

    formatDate ( timestamp ) {
        return i18n.moment.utc(timestamp, "YYYY-MM-DD HH:mm Z").local().format(CampaignStore.fullDateDisplayFormat);
    }

    onLeadDelete ( lead ) {
        this.setState({ showConfirmDelete: true, leadToDelete: lead });
    }

    onNextPage () {
        let lastPage = Math.ceil(this.state.filteredLeads.length / this.state.pageSize);

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
        return this.state.filteredLeads.length > 0 ? (this.state.currentPage * this.state.pageSize) + 1 : 0;
    }

    getNumberOfLastLeadOnPage () {
        let lastPage = Math.floor(this.state.filteredLeads.length / this.state.pageSize);
        if (this.state.currentPage < lastPage) {
            return (this.state.currentPage * this.state.pageSize) + this.state.pageSize;
        } else {
            return this.state.filteredLeads.length;
        }
    }

    onConfirmDelete () {
        UserStore.deleteLead( this.state.leadToDelete.details.email );
        this.setState( { showConfirmDelete: false, leadToDelete: undefined } );
    }

    onCancelDelete () {
        this.setState( { showConfirmDelete: false, leadToDelete: undefined } );
    }

    onDeleteLead (e) {
        if (e.response && e.response.hasErrors()) {
            // TODO: Handle the error
        } else {
            this.setState({ showDeleteSuccess: true }, () => {
                UserStore.listLeads();
            });
        }
    }

    onConfirmDeleteSuccess () {
        this.setState( { showDeleteSuccess: false } );
    }

    onDownloadLeads () {
        UserStore.leadExport( "registered", "CSV" );
    }

    onLeadExport ( e ) {
        if (e.response && e.response.hasErrors()) {
            ErrorStore.rpcResponseError( e.response );
        } else {
            if (e.response.result) {
                let url = e.response.result.exportAbsoluteURL;
                
                // Add a link to the page body
                $("body").append("<a id='CSVLink' href="+url+"></a>");

                // Give it second to be added to the DOM, then click it.
                setTimeout( () => {
                    document.getElementById('CSVLink').click();
                    $("#CSVLink").remove();
                }, 500 );
            }
        }
    }

    render () {
        if (!this.state.leads) {
            return <Loading modal={false} />;
        } else {
            return(
                <div>
                    <ActionBar buttonGroup="leads"/>
                    <div className="action-bar-spacer"/>

                    <div className="lead-table">
                        <div className="lead-table-header">
                            <div className="lead-search">
                                <div><i className="material-icons">search</i></div>
                                <div>
                                    <input className="form-control" placeholder="Search by Email" type="text" name="filter" onChange={this.onUpdateFilter.bind(this)}/>
                                </div>
                            </div>
                            <div className="lead-page">
                                Displaying&nbsp;&nbsp;{this.getNumberOfFirstLeadOnPage()} - {this.getNumberOfLastLeadOnPage()}&nbsp;&nbsp;of&nbsp;&nbsp;{this.state.filteredLeads.length}
                                <button className="btn" onClick={this.onPrevPage.bind(this)}><i className="material-icons">navigate_before</i></button>
                                <button className="btn" onClick={this.onNextPage.bind(this)}><i className="material-icons">navigate_next</i></button>
                            </div>
                            <div className="lead-export">
                                <button className="btn btn-primary round" onClick={this.onDownloadLeads.bind(this)}><i className="material-icons">cloud_download</i>Export to CSV</button>
                            </div>
                        </div>
                        { this.generateLeadTableForPage() }
                    </div>

                    { this.state.showConfirmDelete ?
                        <Confirm title="Delete Lead" okButtonType="danger" okText="Delete" onConfirm={this.onConfirmDelete.bind(this)} onCancel={this.onCancelDelete.bind(this)}>
                            <div className="modal-body modal-center">
                                <div className="modal-message">
                                    <div>Are you sure you want to completely remove this lead?</div>
                                    <div className="confirm-delete-lead-table">
                                        <table>
                                            <tr>
                                                <td>Email</td>
                                                <td>{ this.state.leadToDelete.details.email }</td>
                                            </tr>
                                            <tr>
                                                <td>Date</td>
                                                <td>{ this.formatDate(this.state.leadToDelete.timestamp) }</td>
                                            </tr>
                                            <tr>
                                                <td>IP Address</td>
                                                <td>{ this.state.leadToDelete.details.ipaddress.split(",")[0] }</td>
                                            </tr>
                                            {
                                                this.getFormattedTableRowForLeadToDelete(this.state.leadToDelete)
                                            }
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </Confirm>
                        : 
                        null
                    }

                    { this.state.showDeleteSuccess ?
                        <Confirm title="Success" message="The lead was succcessfully deleted" onConfirm={this.onConfirmDeleteSuccess.bind(this)}/>
                        :
                        null
                    }
                </div>
            );
        }
    }
}

module.exports = Leads;
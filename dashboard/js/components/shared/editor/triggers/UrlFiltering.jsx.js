import React from 'react';
import i18n from '../../../../store/i18nStore';
import String from '../../../common/String.jsx.js';
import TextInput from '../../../shared/TextInput.jsx';
import SelectInput from './SelectInput.jsx';
import CampaignValidation from '../../../shared/util/CampaignValidation';

class UrlFiltering extends React.Component {

    onURLChange(index, value) {

        let _settings = this.props.settings;
        _settings.filters[index].url = value;

        this.props.onChange(_settings);
    }

    onOperatorChange(index, value) {

        let _settings = this.props.settings;
        _settings.filters[index].operator = value;

        this.props.onChange(_settings);
    }

    onAddUrlFilter(e) {

        let _settings = this.props.settings;
        let filter = { operator: _settings.operators[0], url: "" };
        _settings.filters.push(filter);

        this.props.onChange(_settings);
    }


    cloneFilter(index) {

        let _settings = this.props.settings;
        let _clone = {..._settings.filters[index]};
        _settings.filters.splice(index+1, 0, _clone);

        this.props.onChange(_settings);

    }

    removeFilter(index) {

        let _settings = this.props.settings;
        _settings.filters.splice(index,1);

        this.props.onChange(_settings);
    }

    generateURLFilterTable() {

        let validationErrors = CampaignValidation.validateURLFilters( this.props.settings.filters );

        let rowMap = [
            {
                id: "operator",
                label: i18n.stringFor('sh_label_filter_operator'),
                css: 'prize-filter'
            },
            {
                id: "url",
                label: i18n.stringFor('sh_label_url'),
                css: 'prize-name'
            },
            {
                id: "options",
                label: "",
                css: 'prize-ctrl'
            }
        ]

        // Create an array to store all of the rows
        let rows = [];

        // Build the header row
        let headerCells = rowMap.map( ( element ) => {
            return <th key={ '_header_' + element.id }> {element.label} </th>;
        } );

        // Create the cells
        let numFilters = 0;

        if(this.props.settings && this.props.settings.filters) {
            numFilters = this.props.settings.filters.length;
        }

        if (numFilters > 0) {

            for (let i=0; i<numFilters; i++) {

                let filter = this.props.settings.filters[i];
                // TODO: remove later, see method for reason
                filter = this.filterTheFilters(filter);

                let cells = rowMap.map( ( element ) => {
                    switch (element.id) {
                        case "operator":
                            // read comments in the filterTheFilters method.  Once that method is removed, we can piut back the line of code that was commented out below
                            return <td key={'_td_'+element.id} className={element.css}><SelectInput id={i} name={element.id} value={filter.operator} values={["contain","does not contain"]} onChange={this.onOperatorChange.bind(this)}/></td>
                            //return <td key={'_td_'+element.id} className={element.css}><SelectInput id={i} name={element.id} value={filter.operator} values={this.props.settings.operators} onChange={this.onOperatorChange.bind(this)}/></td>
                            break;
                        case "url":
                            let hasErrors = validationErrors.filter(error => error.index === i && error.id === "invalidUrlFilter").length > 0;
                            return <td key={'_td_'+element.id} className={element.css}><TextInput id={i} error={hasErrors} name={element.id} value={filter.url} onChange={this.onURLChange.bind(this)}/></td>
                            break;
                        case "options":
                            return <td key={'_td_'+element.id} className={element.css}>
                                        <button className="btn" onClick={this.removeFilter.bind( this, i )}>
                                            <a className="help-tooltip button-tooltip top">
                                            <i className="material-icons md-18">close</i>
                                                <div className="arrow"></div>
                                                <div className="summary">
                                                    <h4><String code="label_tooltip_cancel"/></h4>
                                                </div>
                                            </a>
                                        </button>
                                    </td>
                    }
                } );


                rows.push(<tr key={i}>{cells}</tr>);
            }

            return (
                <div>
                    <table className="table prize-table">
                        <thead>
                            <tr key="header">{headerCells}</tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                    <div className="m-b-4" style={{ fontSize: "11px", color: "#999" }}>Tip: You can use regular expressions in the URL field</div>
                </div>
            );
        } else {
            return null;
        }
    }

    filterTheFilters(filter) {
        // TODO : eventually delete this method.  This was only added for backwards compatibility for the filters to work with the old filter format.  Eventually everyone will
        // TODO : be using the new format and we can delete this 
        if(filter.operator === "does") filter.operator = "contain";
        if(filter.operator === "does not") filter.operator = "does not contain";
        return filter;
    }

    canAddURL() {
        return true;
    }


    makeButton ( key, hash, css, tooltip, func, icon ) {
        return <button key={ '_' + key + '_' + hash } className={css} data-tooltip={i18n.stringFor( tooltip )} onClick={func}><i className="material-icons md-18">{icon}</i></button>;
    }

    render () {
        return (
            <div className="m-t-3 m-b-3">
                {
                    this.generateURLFilterTable()
                }
                <button className={this.canAddURL() ? "btn btn-primary round m-b-3" : "btn btn-default round m-b-3"} onClick={this.onAddUrlFilter.bind(this)}>+ <String code="sh_label_add_url_filter"/></button>
            </div>
        )
    }
}


export default UrlFiltering;

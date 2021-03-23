import _ from 'underscore';
import React from 'react';
import CountryStore from '../../store/CountryStore';

class CountrySelector extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            list: []
        };
    }
    componentDidMount() {
        this.setState( { list: CountryStore.getCountries( { filter: this.props.filter } ).map( function ( country ) {
            return <option key={country.countryCodeAlpha2} value={country.countryCodeAlpha2}>{country.countryName}</option>;
        } ) } );
    }
    render() {
        return (
            <select className="form-control" {...this.props} disabled={this.props.readOnly}>
                <option key="empty" />
                {this.state.list}
            </select>
        )
    }
}

module.exports = CountrySelector;
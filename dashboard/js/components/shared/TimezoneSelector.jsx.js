import _ from 'underscore';
import React from 'react';
import TimezoneStore from '../../store/TimezoneStore';

class TimezoneSelector extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            timezoneList: _.sortBy( TimezoneStore.getTimezones(), 'offset' ).map( function ( zone ) {
                return <option key={zone.abbr + '_' + zone.cid} value={zone.cid}>{zone.time}</option>;
            } )
        };
    }
 
    render() {
        return ( <select {...this.props} disabled={this.props.readOnly} defaultValue={this.props.value}> {this.state.timezoneList} </select> );
    }
}

module.exports = TimezoneSelector;
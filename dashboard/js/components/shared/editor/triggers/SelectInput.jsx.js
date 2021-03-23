import React from 'react';

class SelectInput extends React.Component {

    constructor( props ) {
        super( props );
    }

    onChange( event ) {
        this.props.onChange( this.props.id, event.target.value );
    }

    render() {
        return (
            <select className="form-control" onChange={this.onChange.bind( this )} disabled={this.props.disabled} value={this.props.value}>
                {this.props.values.map( function(_value,index) { return <option key={_value+index} value={_value}>{_value}</option>;})}
            </select>
        )
    }
}

export default SelectInput;
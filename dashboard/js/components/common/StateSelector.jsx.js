import _ from 'underscore';
import React from 'react';
import CountryStore from '../../store/CountryStore';

class StateSelector extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { states: [], list: [] }
    }
    componentDidMount () {
        this.setState( { states: CountryStore.getProvinces( { countryCodes: this.props.country } ) }, function () {
            this.setState( { list: this.getStates() }, function () {
                if ( !this.state.states.length ) { this.props.onChange( '' ); }
                if ( this.props.onStatesUpdate ) {
                    this.props.onStatesUpdate( this.state.states );
                }
            } );
        } );
    }
    componentWillReceiveProps ( props ) {
        if ( this.props.country !== props.country ) {
            this.setState( { states: CountryStore.getProvinces( { countryCodes: props.country } ) }, function () {
                this.setState( { list: this.getStates() }, function () {
                    if ( !this.state.states.length ) { this.props.onChange( '' ); }
                    if ( this.props.onStatesUpdate ) {
                        this.props.onStatesUpdate( this.state.states );
                    }
                } );
            } );
        }
    }
    onChange ( e ) {
        if ( this.props.onChange ) {
            this.props.onChange( e.target.value );
        }
    }
    getStates () {
        return this.state.states.filter( state => this.props.filter && this.props.filter.length ? this.props.filter.indexOf( state.sd ) !== -1 : true ).map( function ( state ) {
            return ( <option key={state.sd} value={state.sd}>{state.name}</option> );
        } );
    }
    render () {
        let selectProps = _.omit( this.props, [ 'country', 'exclude', 'onChange', 'onStatesUpdate' ] );
        return (
            <select className="form-control" {...selectProps} disabled={this.props.readOnly || this.state.list.length <= 1} onChange={this.onChange.bind( this )}>
                <option />
                {this.state.list}
            </select>
        );
    }
}

module.exports = StateSelector;
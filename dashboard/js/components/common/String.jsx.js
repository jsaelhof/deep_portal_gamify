import _ from 'underscore';
import React from 'react';
import Mustache from 'mustache';
import i18n from '../../store/i18nStore';

class String extends React.Component {
    constructor( props ) { super( props ); }
    render() {
        let code = _.isUndefined( this.props.code ) ? '' : this.props.code;
        let template = i18n.stringFor( code );
        let keys = _.isUndefined( this.props.keys ) ? {} : this.props.keys;
        let rendered = Mustache.render( template, keys );
        let otherProps = _.omit( this.props, [ 'code', 'keys' ] );
        let mergedProps = _.extend( {}, otherProps, { dangerouslySetInnerHTML: { __html: rendered } } );

        return ( React.createElement( 'span', mergedProps ) );
    }
}

module.exports = String;
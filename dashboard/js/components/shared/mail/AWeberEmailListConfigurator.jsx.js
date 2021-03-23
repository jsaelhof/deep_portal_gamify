import React from 'react';
import i18n from '../../../store/i18nStore';

class AWeberEmailListConfigurator extends React.Component {

    constructor ( props ) {
        super (props);
    }

    hasFields () {
        return this.props.emailListFields && Object.keys( this.props.emailListFields ).length;
    }

    render () {
        if (this.hasFields()) {
            return null;
        } else {
            return <div className="alert alert-danger">{i18n.stringFor( 'error_maillist_has_no_fields' ).error_desc}</div>
        }
    }

}

module.exports = AWeberEmailListConfigurator;
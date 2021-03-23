var React = require('react');
var i18n = require( '../../store/i18nStore.js' );

class ValidationError extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { active: false }
    }
    componentDidUpdate () {
        if ( this.hasError( this.props.response ) && !this.state.active ) {
            setTimeout( function () {
                this.refs[ '_error_' + this.props.field ].focus();
                this.setState( { active: true }, function () {} );
            }.bind( this ), 100 );
        }

        if ( !this.props.response && this.state.active ) {
            this.setState( { active: false } );
        }
    }
    getError ( response ) {
        return response.errors.validation_errors.filter( function ( error ) {
            return error.field.toLowerCase() === this.props.field.toLowerCase();
        }, this )[ 0 ];
    }
    hasError ( response ) {
        if ( !response ) { return false; }

        if ( response && response.hasValidationErrors() ) {
            return response.errors.validation_errors.filter( function ( error ) {
                return error.field.toLowerCase() === this.props.field.toLowerCase();
            }, this ).length > 0;
        }

        return false;
    }
    render () {
        return (
            <div ref={"_error_" + this.props.field} key={"_error_" + this.props.field} style={{outline:'none'}} className={( this.hasError( this.props.response ) && !this.props.isDirty ) ? ( ( this.props.errorClassName || '' ) + ' error-msg' ) : '' } tabIndex="-1">
                {
                    this.hasError( this.props.response ) && !this.props.isDirty ?
                    <span className="error-txt">{i18n.stringFor( this.getError( this.props.response ).message, 'error_desc' )}</span> : null
                }
            </div>
        )
    }
}

module.exports = ValidationError;

import _ from 'underscore';
import React from 'react';


class NumericTextInput extends React.Component {
    constructor( props ) {
        super( props );
    }

    onChange ( event ) {
        let newValue = event.currentTarget.value;

        if (isNaN(parseFloat(newValue))) {
            newValue = "0";
        }

        if (this.props.onChange) this.props.onChange(this.props.id, newValue);
    }

    onKeyDown ( event ) {
        if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
            event.preventDefault();
            return;
        }

        let k = event.keyCode;

        if ( 
            !((k >= 48 && k <= 57) || // 0-9
            (k >= 96 && k <= 105) || // Numpad 0-9
            (!this.props.integer && k === 190) || // .
            (!this.props.integer && k === 110) || // Numpad .
            (k === 8) || // Backspace
            (k === 37) || // Left Arrow
            (k === 39) || // Right Arrow
            (this.props.allowNegative && k === 189) || // Negative symbol only if allowed
            (this.props.allowNegative && k === 109)) // Negative symbol only if allowed
        ) {
            event.preventDefault();
            return;
        }
    }

    onFocus ( event ) {
        event.currentTarget.select();
    }

    onBlur ( event ) {
        if (isNaN( parseFloat(event.currentTarget.value) )) {
            event.currentTarget.value = "0";
        }
    }

    render() {
        return (
            <input 
                type="text" 
                className={ (this.props.error) ? "form-control invalid-field" : "form-control" }  
                name={this.props.name}  
                onChange={ this.onChange.bind( this ) } 
                onKeyDown={ this.onKeyDown.bind( this ) } 
                onFocus={ this.onFocus.bind( this ) }
                onBlur={ this.onBlur.bind( this ) }
                readOnly={this.props.readOnly} 
                value={this.props.value}
                disabled={ (this.props.disabled) ? this.props.disabled : false }
            />
        )
    }
}


export default NumericTextInput;
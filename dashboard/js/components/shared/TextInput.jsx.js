import React from 'react';

class TextInput extends React.Component {
    constructor( props ) {
        super( props );
    }

    onChange( event ) {
        this.props.onChange( this.props.id, event.currentTarget.value );
    }

    onFocus ( event ) {
        if (this.props.onFocus) this.props.onFocus( this.props.id );
    }

    onBlur ( event ) {
        if (this.props.onBlur) this.props.onBlur( this.props.id );
    }

    render() {
        return (
            <input 
                type="text" 
                className={ (this.props.error) ? "form-control invalid-field" : "form-control" } 
                name={this.props.name} 
                onChange={this.onChange.bind( this )} 
                readOnly={this.props.readOnly} 
                value={(this.props.value) ? this.props.value : ""} 
                placeholder={this.props.placeholder} 
                onFocus={this.onFocus.bind(this)}
                onBlur={this.onBlur.bind(this)}
            />
        )
    }
}


export default TextInput;
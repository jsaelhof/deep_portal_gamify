import React from 'react';

class TextArea extends React.Component {
    constructor( props ) {
        super( props );
    }

    onChange( event ) {
        this.props.onChange( this.props.id, event.currentTarget.value );
    }

    render() {
        return (
            <textarea rows={ this.props.rows || 2 } className="description form-control" placeholder={ this.props.placeholder || ""} onInput={ this.onChange.bind(this) }>{ this.props.value }</textarea>
        )
    }
}


export default TextArea;
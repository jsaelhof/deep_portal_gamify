import React from 'react';

class FontSelector extends React.Component {
    render() {
        return (
            <select className="form-control form-theme" onChange={this.props.onChange} disabled={this.props.readOnly} value={this.props.value || ''}>
                {this.props.fonts.map( function(font,index) { return <option key={index} value={font.value}>{font.label || font.value}</option>;})}
            </select>
        )
    }
}

export default FontSelector;
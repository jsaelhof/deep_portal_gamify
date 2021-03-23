import React from 'react';

class Hint extends React.Component {
    constructor( props ) { super( props ); }
    render() {
        return (
            <a className={"help-icon help-tooltip " + (this.props.placement ? this.props.placement : 'bottom')} style={ this.props.nofloat ? { float: "none" } : {} }>
                <i className="material-icons">help_outline</i>
                <div className="arrow" />
                <div className="summary">
                    <img className={this.props.img ? '' : 'hidden'} src={this.props.img}/>
                    <h4 className={this.props.title ? '' : 'hidden'}>{this.props.title}</h4>
                    <p>{this.props.hint}</p>
                </div>
            </a>
        )
    }
};

module.exports = Hint;
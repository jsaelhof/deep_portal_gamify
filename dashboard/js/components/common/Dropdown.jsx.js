import React from 'react';

class Dropdown extends React.Component {
    constructor ( props ) {
        super( props );
        this.state = { show: this.props.show }
    }
    toggle () {
        this.setState( { show: !this.state.show } );
    }
    set ( e ) {
        if ( this.props.onSelect ) { this.props.onSelect ( e ); }
        this.toggle();
    }
    render () {
        return (
            <div>
                <div className={ this.state.show ? 'dropdown open' : 'dropdown' }>
                    <button type="button" className="btn btn-default dropdown-toggle" onClick={this.toggle.bind( this )} disabled={this.props.disabled}>
                        {this.props.title || ''} {this.state.show}
                        <span className="caret" />
                    </button>
                    <ul className="dropdown-menu" style={ { zIndex:'1001', display: this.state.show ? 'inline-block' : 'none' } }>
                        {
                            this.props.options ? this.props.options.map( opt => ( <li key={opt.value}> <a onClick={this.set.bind( this, opt.value )}>{opt.label}</a> </li> ) ) : null
                        }
                    </ul>
                </div>
                { ( this.state.show ) ? <div style={ { position: 'fixed', top: '0', bottom: '0', right: '0', left: '0', zIndex: '1000' } } onClick={this.toggle.bind( this )} /> : null }
            </div>
        );
    }
}

module.exports = Dropdown;
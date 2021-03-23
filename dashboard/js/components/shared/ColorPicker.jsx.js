var React = require('react');
var ColorPicker = require('react-color').default;
/**import PropTypes from 'prop-types';**/

class FbColorPicker extends React.Component {

    /**
    propTypes: {
        color: PropTypes.object.isRequired
    },
     **/
    constructor ( props ) {
        super( props );
        this.state = {

            type: this.props.type || 'sketch',
            color: this.props.color,
            display: this.props.display || false,
            isPickerOpen: false,
            swatch: {
                background: '#fff',
                display: 'inline-block',
                cursor: 'pointer',
                height: '20px',
                width: '20px',
                border: '1px solid rgb(153, 153, 153)',
                overflow: 'hidden',
                borderRadius: '50%'
            }
        }
        this.show = this.show.bind(this);
        this.showAlpha = this.showAlpha.bind(this);
        this.close = this.close.bind(this);
        this.onChange = this.onChange.bind(this);
    }


    componentWillReceiveProps ( newProps ) {
        this.setState( { type: newProps.type, color: newProps.color } );
    }


    show() {
        this.setState( { display: true } );
    }


    close() {
        this.setState( { display: false } );
    }

    setValue ( type, color ) {
        if ( !type ) { type = 'hex'; }

        switch ( type ) {
            case 'hex':
                return color.hex;
            case 'rgb':
            case 'rgba':
                return 'rgba(' + color.rgb.r + ',' + color.rgb.g + ',' + color.rgb.b + ',' + color.rgb.a + ')';
        }
    }


    showAlpha () {
        return this.props.valueType === 'rgba';
    }


    onChange ( color ) {


        //let _swatch = this.state.swatch;
        let _swatch =  {
            background: this.setValue(this.props.valueType, color),
            display: 'inline-block',
            cursor: 'pointer',
            height: '20px',
            width: '20px',
            border: '1px solid rgb(153, 153, 153)',
            overflow: 'hidden',
            borderRadius: '50%'
        };

        this.setState( { color: this.setValue( this.props.valueType, color ), swatch: _swatch }, function () {
            this.props.onChange( this.state.color, this.props.id );
        } );
    }

    render () {
        return (
            <div>
                <div className={ this.props.min ? 'color-preview m-l-0' : 'asset-img color-picker' } style={ this.state.swatch } onClick={this.show}>
                    <div style={ { width: '100%', height: '100%', background: this.state.color } }/>
                    <div style={ { zIndex: '9999', position: 'absolute' } }>
                        <div className="input-window">
                            {renderPicker(this.state.type, this.state.color, this.state.display, this.onChange, this.close, this.showAlpha() )}
                        </div>
                    </div>
                </div>
                <div style={ { position: 'fixed', top: '0px', bottom: '0px', left: '0px', right: '0px', zIndex: '2' } } className={ this.state.display ? '' : 'hidden' } onClick={this.close} />
            </div>
        );
    }
}


function renderPicker(type, color, display, onChange, close, showAlpha) {
    return display ? <div><ColorPicker type={type} color={color} onChange={onChange} disableAlpha={!showAlpha} /></div> : null;
}

export default FbColorPicker;
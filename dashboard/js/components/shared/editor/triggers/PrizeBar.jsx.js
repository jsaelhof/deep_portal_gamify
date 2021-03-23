import React from 'react';
import String from '../../../common/String.jsx.js';
import NumericTextInput from '../../../shared/NumericTextInput.jsx';
import FbColorPicker from '../../../shared/ColorPicker.jsx';

class PrizeBar extends React.Component {



    onShowPrizeBarEnable(e) {

        let settings = this.props.settings;
        settings.enabled = !settings.enabled;

        this.props.onChange(settings);

    }


    onPositionSelect(e) {

        let settings = this.props.settings;
        settings.position = e.target.value;

        this.props.onChange(settings);
    }


    updateCountdownValue(id, value) {

        let settings = this.props.settings;
        settings.countdown = value;

        this.props.onChange(settings);
    }

    onColorChange(color, id) {
        // get a copy of the theme descriptor
        var themeDescriptor = {...this.props.themeDescriptor};

        // loop through the colors and find the one they modied and update it
        for(var i=0; i<themeDescriptor.prizeBanner.colors.length; i++) {
            if(themeDescriptor.prizeBanner.colors[i].id === id) {
                themeDescriptor.prizeBanner.colors[i].value = color;
                break;
            }
        }

        // notify the parent component that the theme descriptor has been updated
        this.props.onChange(this.props.settings, themeDescriptor);
    }


    render () {

        return (
            <div>
                <div className="form-inline m-b-3 m-t-3">
                    <div className="form-group">
                        {/** Enable/Disable Prize Bar **/}
                        <input type="checkbox"
                            id='prizeBarToggle'
                            data-switch="color"
                            disabled={false}
                            name='prizeBarToggle'
                            onChange={(e) => this.onShowPrizeBarEnable(e)}
                            checked={this.props.settings.enabled}
                        />

                        <label htmlFor={'prizeBarToggle'} className="m-b-0" />
                    </div>

                    <div className="form-group m-b-1 m-l-4">
                        <String code="sh_label_show_prize_banner"/>
                    </div>
                </div>

                <div className="clearfix" />

                {/* <div className="row">
                    <div className="col-sm-6">
                        <div className="form-inline m-b-2"> */}
                            {/***
                            <div className="form-group m-t-1">
                                <p className="m-r-2 m-t-1"><String code="sh_label_banner_position"/></p>
                            </div>
                             ***/}
                            {/* <div className="form-group m-t-1 m-b-1"> */}

                                {/** Select Prize Bar Position **/}
                            {/***
                                <select className="form-control" onChange={(e) => this.onPositionSelect(e)} disabled={!this.props.settings.enabled} value={this.props.settings.position}>
                                    {this.props.settings.positions.map( function(position,index) { return <option key={position+index} value={position}><String code={"sh_label_positon_"+position}/></option>;})}
                                </select>
                                 *****/}

                            {/* </div>
                        </div>
                    </div>
                </div> */}

                <div className="clearfix" />

                <div className={this.props.settings.enabled ? "prize-banner-controls" : "prize-banner-controls trigger-disabled"}>
                    <div className={"form-inline m-b-4"}>
                        <div className="form-group m-r-2">
                            {/** Banner Display Countdown **/}
                            <String code="sh_label_countdown_time"/>
                        </div>

                        <div className="form-group">

                            <NumericTextInput
                                id={"countDown"}
                                name={"countDown"}
                                value={this.props.settings.countdown}
                                allowNegative={false}
                                integer={true}
                                disabled={!this.props.settings.enabled}
                                onChange={this.updateCountdownValue.bind(this)}
                            />
                        </div>

                        <div className="form-group m-r-1 m-l-2">
                            <String code="sh_label_time_measure_minutes"/>
                        </div>
                    </div>

                    { 
                        this.props.themeDescriptor.prizeBanner && this.props.themeDescriptor.prizeBanner.colors ?
                            <div className="m-b-2">
                                <div className="m-b-2"><label class="control-label">Banner Colors</label></div>
                                <div className="setting-group" style={{ "margin-bottom": "0" }}>
                                    {
                                        this.props.themeDescriptor.prizeBanner.colors.map( (color, index, array) => {
                                            if (color.skill === "basic") {
                                                return <div key={"color_"+index} className="color-selector setting">
                                                    <div className="pull-left m-r-2">
                                                        <FbColorPicker 
                                                            type="hex" 
                                                            color={color.value} 
                                                            id={color.id} 
                                                            valueType='rgba' 
                                                            min={true} 
                                                            onChange={this.onColorChange.bind(this)}
                                                        />
                                                    </div>
                                                    <label id={'label_color_'+index} className="color-label">{color.label}</label>
                                                </div>
                                            }
                                        })
                                    }
                                </div>
                            </div>
                            :
                            null
                    }
                </div>
            </div>
        )
    }

}

export default PrizeBar;
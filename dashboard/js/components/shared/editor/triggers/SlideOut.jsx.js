import React from 'react';
import String from '../../../common/String.jsx.js';
import NumericTextInput from '../../../shared/NumericTextInput.jsx';


class SlideOut extends React.Component {

    onMobileChange ( e ) {

        let _settings = this.props.settings;

        if ( this.props.onChange ) {
            _settings.mobile = e;
            this.props.onChange( _settings );
        }
    }
    onDesktopChange ( e ) {
        let _settings = this.props.settings;

        if ( this.props.onChange ) {

            _settings.desktop = e;
            this.props.onChange( _settings );
        }
    }


    render () {
        return (
            <div>
                <h3><String code="sh_label_slideout_desktop"/></h3>
                <SlideOutCfg kind='desktop' settings={this.props.settings.desktop} onChange={this.onDesktopChange.bind( this )} showTabNote={this.props.showTabNote}/>
            </div>
        )
    }
}




class SlideOutCfg extends React.Component {


    onShowAfterEnable(e) {

        let settings = this.props.settings;
        settings.showAfterDelay.enabled = !settings.showAfterDelay.enabled;

        this.props.onChange(settings);

    }


    updatePupUpDelay(id, delay) {

        let settings = this.props.settings;
        settings.showAfterDelay.delay = delay;

        this.props.onChange(settings);
    }

    render () {
        return (
            <div className="triggers">

                <div className="form-inline m-t-4 m-b-3">
                    <div className="form-group">
                        {/** Enable/Disable PopUp Delay **/}
                        <div>
                            <input type="checkbox"
                                   id={"showAfterDelay"+this.props.kind}
                                   data-switch="color"
                                   disabled={!this.props.settings.enabled}
                                   name={"showAfterDelay"+this.props.kind}
                                   onChange={(e) => this.onShowAfterEnable(e)}
                                   checked={this.props.settings.showAfterDelay.enabled}
                            />

                            <label htmlFor={"showAfterDelay"+this.props.kind} />
                        </div>
                    </div>

                    <div className="form-group m-r-2 m-l-4">
                        <div className="trigger-title"><String code="sh_trigger_method_auto_display"/></div>
                        <div><String code="sh_label_slideout_header"/></div>
                    </div>
                </div>

                <div className={ this.props.settings.showAfterDelay.enabled ? "timed-delay-controls" : "timed-delay-controls trigger-disabled" }>
                    <div className="form-group m-r-2">
                        <String code="sh_label_after"/>
                    </div>

                    <div className="form-group m-t-0">
                        <NumericTextInput
                            id={"delay"+this.props.kind}
                            name={"delay"+this.props.kind}
                            value={this.props.settings.showAfterDelay.delay}
                            allowNegative={false}
                            integer={true}
                            onChange={this.updatePupUpDelay.bind(this)}
                            disabled={!this.props.settings.showAfterDelay.enabled}
                        />
                    </div>

                    <div className="form-group m-l-2">
                        <String code="sh_label_time_measure_seconds"/>
                    </div>
                </div>

                { 
                    this.props.showTabNote ?
                        <div className={ this.props.settings.showAfterDelay.enabled ? "trigger-tab-note" : "trigger-tab-note trigger-disabled" }>Note: This setting does not affect when the tab appears. The tab will appear as soon as it loads.</div>
                        :
                        null
                }

            </div>
        )
    }
}

export default SlideOut;
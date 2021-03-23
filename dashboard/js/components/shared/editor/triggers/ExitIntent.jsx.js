import React from 'react';
import String from '../../../common/String.jsx.js';


class ExitIntent extends React.Component {

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
                <SlideOutDevice kind='desktop' settings={this.props.settings.desktop} onChange={this.onDesktopChange.bind( this )} />
            </div>
        )
    }
}






class SlideOutDevice extends React.Component {

    onEnable(e) {

        let settings = this.props.settings;
        settings.enabled = !settings.enabled;

        this.props.onChange(settings);
    }


    onLeaveIntentEnable(e) {

        let settings = this.props.settings;
        settings.showOnLeaveIntent.enabled = !settings.showOnLeaveIntent.enabled;

        this.props.onChange(settings);
    }


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
                <div className="form-inline m-t-4 m-b-1">
                    <div className="form-group">
                        {/** Enable/Disable Leave Intent **/}
                        <div>
                            <input type="checkbox"
                                   id={"leaveIntent"+this.props.kind}
                                   data-switch="color"
                                   disabled={!this.props.settings.enabled}
                                   name={"leaveIntent"+this.props.kind}
                                   onChange={(e) => this.onLeaveIntentEnable(e)}
                                   checked={this.props.settings.showOnLeaveIntent.enabled}
                            />

                            <label htmlFor={"leaveIntent"+this.props.kind} />
                        </div>
                    </div>

                    <div className="form-group m-b-1 m-l-4">
                        <div className="trigger-title"><String code="sh_trigger_method_exitintent"/></div>
                        <div><String code="sh_label_exitintent_header"/></div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ExitIntent;
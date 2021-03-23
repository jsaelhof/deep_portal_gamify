import React from 'react';
import CampaignStore from '../../../../store/CampaignStore';
import TimezoneSelector from '../../../shared/TimezoneSelector.jsx';
import i18n from '../../../../store/i18nStore';

class WeeklySchedule extends React.Component {

    constructor ( props ) {
        super( props );
    }

    componentWillMount () {
    }

    componentWillUnmount () {
    }

    onToggleDay ( day ) {
        // This else case is here to populate the schedule if no schedule exists. This occurs with campaigns that pre-date the schedule feature.
        let updatedSchedule;
        if (this.props.campaignDetails.schedule) {
            updatedSchedule = {...this.props.campaignDetails.schedule};
        } else {
            updatedSchedule = {
                monday: {
                    enabled: true
                },
                tuesday: {
                    enabled: true
                },
                wednesday: { 
                    enabled: true
                },
                thursday: {
                    enabled: true
                },
                friday: {
                    enabled: true
                },
                saturday: {
                    enabled: true
                },
                sunday: {
                    enabled: true
                }
            };
        }

        updatedSchedule[day].enabled = !updatedSchedule[day].enabled;

        this.props.onUpdate( updatedSchedule, this.props.campaignDetails.timezone );
    }

    onTimezoneChange ( e ) {
        let timezoneCID = e.target.value;
        this.props.onUpdate(this.props.campaignDetails.schedule, timezoneCID);
    }

    render () {
        return (
            <div className="settings" id="schedule">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <div className="panel-title">
                                    <h1>
                                        Schedule
                                    </h1>
                                </div>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="m-t-1 m-b-4 w-475">
                                <h4>Weekly Schedule</h4>
                                <div className="m-b-2">Your campaign will appear on the selected days.</div>
                                <div className="slideout-schedule">
                                    {/* Check if the schedule exists. Old ca,paigns that pre-date the scedule feature won't have it until they alter it and save. */}
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.monday.enabled} onChange={ this.onToggleDay.bind(this, "monday") }/>
                                        <label>Monday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.tuesday.enabled} onChange={ this.onToggleDay.bind(this, "tuesday") }/>
                                        <label>Tuesday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.wednesday.enabled} onChange={ this.onToggleDay.bind(this, "wednesday") }/>
                                        <label>Wednesday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.thursday.enabled} onChange={ this.onToggleDay.bind(this, "thursday") }/>
                                        <label>Thursday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.friday.enabled} onChange={ this.onToggleDay.bind(this, "friday") }/>
                                        <label>Friday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.saturday.enabled} onChange={ this.onToggleDay.bind(this, "saturday") }/>
                                        <label>Saturday</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" defaultChecked={!this.props.campaignDetails.schedule || this.props.campaignDetails.schedule.sunday.enabled} onChange={ this.onToggleDay.bind(this, "sunday") }/>
                                        <label>Sunday</label>
                                    </div>
                                </div>

                                <div className="date-time-select-group form-group m-t-4 m-b-1">
                                    <h4>{i18n.stringFor('label_timezone')}</h4>
                                    <div className="w-350">
                                        <TimezoneSelector 
                                            className="form-control" 
                                            name="timezone" 
                                            value={this.props.campaignDetails.timezone} 
                                            onChange={this.onTimezoneChange.bind( this )} 
                                            readOnly={CampaignStore.isNotUnscheduled(this.props.campaignStatus)} 
                                        />
                                    </div>
                                    { CampaignStore.isNotUnscheduled(this.props.campaignStatus) ?
                                        <i className="material-icons schedule-lock">lock_outline</i>
                                        :
                                        null
                                    }
                                </div>

                                {/* <div className="date-time-select-group form-group m-t-4 m-b-1">
                                    <CurrentTime 
                                        timezone={this.props.campaignDetails.timezone}
                                    />
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = WeeklySchedule;
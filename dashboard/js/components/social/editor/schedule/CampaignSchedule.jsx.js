import React from 'react';
import i18n from '../../../../store/i18nStore';
import CampaignStore from '../../../../store/CampaignStore';
import ConfigStore from '../../../../store/ConfigStore';
import { DateTimePicker } from 'react-widgets';
import CampaignValidation from '../../../shared/util/CampaignValidation';
import ScrollUtils from '../../../shared/util/ScrollUtils';
import TimezoneSelector from '../../../shared/TimezoneSelector.jsx';
import CurrentTime from '../../../shared/editor/schedule/CurrentTime.jsx';

class Schedule extends React.Component {

    constructor ( props ) {
        super( props );
    }

    componentWillMount () {
        CampaignStore.addEventListener(this);
    }

    componentWillUnmount () {
        CampaignStore.removeEventListener(this);
    }

    componentDidUpdate () {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one). In this components case, all the errors that are being checked are in the prize table
        // so just scroll there.
        if (this.props.scrollToError) {
            ScrollUtils.smoothScroll("schedule", () => { this.props.onScrollToErrorComplete() } );
        }
    }

    onStartDateChange (dateObj) {
        if (dateObj) {
            this.props.onUpdate(i18n.moment( dateObj ).format( CampaignStore.dateInputFormat ), this.props.campaignDetails.endDate, this.props.campaignDetails.timezone);
        }
    }

    onStartTimeChange (dateObj) {
        if (dateObj) {
            // There seems to be a bug in the date time picker component.
            // If you manually type in a time (not just select one from the dropdown...thats fine), then the date resets to today's date.
            // So to fix it, i have manage time changes separately and build it by getting the date from the campaign details and the time from this new date object, then piece it together.
            let date = i18n.moment( this.props.campaignDetails.startDate ).format( CampaignStore.dateOnlyInputFormat );
            let time = i18n.moment( dateObj ).format( CampaignStore.timeOnlyInputFormat );
            this.props.onUpdate(date + " " + time, this.props.campaignDetails.endDate, this.props.campaignDetails.timezone);
        }
    }

    onEndDateChange (dateObj) {
        if (dateObj) {
            this.props.onUpdate(this.props.campaignDetails.startDate, i18n.moment( dateObj ).format( CampaignStore.dateInputFormat ), this.props.campaignDetails.timezone);
        }
    }

    onEndTimeChange (dateObj) {
        if (dateObj) {
            // There seems to be a bug in the date time picker component.
            // If you manually type in a time (not just select one from the dropdown...thats fine), then the date resets to today's date.
            // So to fix it, i have manage time changes separately and build it by getting the date from the campaign details and the time from this new date object, then piece it together.
            let date = i18n.moment( this.props.campaignDetails.endDate ).format( CampaignStore.dateOnlyInputFormat );
            let time = i18n.moment( dateObj ).format( CampaignStore.timeOnlyInputFormat );
            this.props.onUpdate(this.props.campaignDetails.startDate, date + " " + time, this.props.campaignDetails.timezone);
        }
    }

    onTimezoneChange ( e ) {
        let timezoneCID = e.target.value;
        this.props.onUpdate(this.props.campaignDetails.startDate, this.props.campaignDetails.endDate, timezoneCID);
    }

    render () {
        let validationErrors = CampaignValidation.validate( ConfigStore.getProductType(), this.props.campaignDetails, this.props.campaignStatus );
        let endDateMissing = validationErrors.filter(error => (error.id === "endDateMissing")).length > 0;
        let startDateMissing = validationErrors.filter(error => (error.id === "startDateMissing")).length > 0;
        let endDateOccursInThePast = validationErrors.filter(error => (error.id === "endDateOccursInThePast")).length > 0;
        let startDateOccursInThePast = validationErrors.filter(error => (error.id === "startDateOccursInThePast")).length > 0;
        let startOccursAfterEnd = validationErrors.filter(error => (error.id === "startOccursAfterEnd")).length > 0;
        
        return (
            <div className="settings" id="schedule">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>Schedule</h1>
                                <h3 className="subheading">Configure when your campaign will start and end</h3>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="date-time-select-group form-group m-t-1 m-b-4">
                                <h4>{i18n.stringFor("label_scheduled_start")}</h4>
                                
                                <DateTimePicker 
                                    min={ i18n.moment().subtract(12, "hours").toDate() }  // Subtract 12 hours. -12 is the furthest behind GMT. In this and other timezones the date can actually be yesterday based on the users browser's current time. To allow for this i'm allowing dates up to 12 hours earlier.                                    value={ this.props.campaignDetails.startDate ? new Date(this.props.campaignDetails.startDate) : undefined } 
                                    value={ this.props.campaignDetails.startDate ? new Date(this.props.campaignDetails.startDate) : undefined } 
                                    format={CampaignStore.dateTimePickerDateFormat} 
                                    time={false} 
                                    placeholder="Date"
                                    readOnly={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock }
                                    disabled={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock }
                                    onChange={ this.onStartDateChange.bind(this) }
                                />

                                <DateTimePicker 
                                    value={ this.props.campaignDetails.startDate ? new Date(this.props.campaignDetails.startDate) : undefined } 
                                    format={CampaignStore.dateTimePickerTimeFormat}
                                    date={false}
                                    placeholder="Time"
                                    readOnly={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock }
                                    disabled={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock }
                                    onChange={ this.onStartTimeChange.bind(this) } 
                                />

                                { CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock ?
                                    <i className="material-icons schedule-lock">lock_outline</i>
                                    :
                                    null
                                }

                                { startDateMissing ?
                                    <div className="invalid-field date-time-select-error">Set the date the campaign should begin.</div>
                                    :
                                    startDateOccursInThePast ? 
                                        <div className="invalid-field date-time-select-error">This date occurs in the past.</div>
                                        :
                                        startOccursAfterEnd ? 
                                            <div className="invalid-field date-time-select-error">The start date must occur before the end date.</div>
                                            :
                                            null
                                }
                            </div>
                            <div className="date-time-select-group form-group m-t-4 m-b-1">
                                <h4>{i18n.stringFor("label_scheduled_end")}</h4>
                                <DateTimePicker 
                                    min={ i18n.moment().subtract(12, "hours").toDate() } // Subtract 12 hours. -12 is the furthest behind GMT. In this and other timezones the date can actually be yesterday based on the users browser's current time. To allow for this i'm allowing dates up to 12 hours earlier.
                                    value={ this.props.campaignDetails.endDate ? new Date(this.props.campaignDetails.endDate) : undefined } 
                                    format={CampaignStore.dateTimePickerDateFormat} 
                                    time={false} 
                                    placeholder="Date"
                                    readOnly={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.endDateLock }
                                    disabled={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.endDateLock }
                                    onChange={ this.onEndDateChange.bind(this) } 
                                />

                                <DateTimePicker 
                                    value={ this.props.campaignDetails.endDate ? new Date(this.props.campaignDetails.endDate) : undefined } 
                                    format={CampaignStore.dateTimePickerTimeFormat}
                                    date={false}
                                    placeholder="Time"
                                    readOnly={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.endDateLock }
                                    disabled={ CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.endDateLock }
                                    onChange={ this.onEndTimeChange.bind(this) } 
                                />

                                { CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.endDateLock ?
                                    <i className="material-icons schedule-lock">lock_outline</i>
                                    :
                                    null
                                }

                                { endDateMissing ?
                                    <div className="invalid-field date-time-select-error">Set the date the campaign should end.</div>
                                    :
                                    endDateOccursInThePast ? 
                                        <div className="invalid-field date-time-select-error">This date occurs in the past.</div>
                                        :
                                        null
                                }
                            </div>
                            <div className="date-time-select-group form-group m-t-4 m-b-1">
                                <h4>{i18n.stringFor('label_timezone')}</h4>
                                <div className="w-350">
                                    <TimezoneSelector 
                                        className="form-control" 
                                        name="timezone" 
                                        value={this.props.campaignDetails.timezone} 
                                        onChange={this.onTimezoneChange.bind( this )} 
                                        readOnly={CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock || this.props.campaignDetails.endDateLock } 
                                    />
                                </div>
                                { CampaignStore.isNotUnscheduled(this.props.campaignStatus) || this.props.campaignDetails.startDateLock || this.props.campaignDetails.endDateLock ?
                                    <i className="material-icons schedule-lock">lock_outline</i>
                                    :
                                    null
                                }
                            </div>
                            <div className="date-time-select-group form-group m-t-4 m-b-1">
                                <CurrentTime 
                                    timezone={this.props.campaignDetails.timezone}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Schedule;
import _ from 'underscore';
import React from 'react';
// import TimezoneSelector from '../../common/TimezoneSelector.jsx';
import String from '../../common/String.jsx';
import UserStore from '../../../store/UserStore';
import i18n from '../../../store/i18nStore';

class UserDetails extends React.Component {
    constructor ( props ) {
        super( props );

        this.state = {
            dirty: false,
            validation_errors: undefined,
            userDetails: UserStore.getImmutableState().userDetails,
            showUpdatedMessage: false
        }
    }

    onFieldUpdate ( id, event ) {
        let updatedUserDetails = {...this.state.userDetails};
        updatedUserDetails[id] = event.target.value.trimLeft();
        this.setState( { 
            userDetails: updatedUserDetails,
            dirty: true,
            showUpdatedMessage: false
        } );

        document.getElementById(id).className = "form-control";
    }

    createField ( id, label ) {
        let validationError;
        if (this.state.validation_errors) {
            this.state.validation_errors.forEach(error => {
                if (!validationError && error.field === id) {
                    validationError = error;
                }
            });
        }

        return (
            <div className="form-group">
                <label className="control-label"><String code={label}/></label>
                <input type="text" 
                        id={id}
                        className={ validationError ? "form-control invalid-field" : "form-control" }
                        value={this.state.userDetails[id] || ""}
                        onChange={this.onFieldUpdate.bind( this, id )}
                />
                { validationError ?
                    <div className="validation-error-msg">
                        { i18n.stringFor(validationError.message, "error_desc") }
                    </div>
                    :
                    null
                }
            </div>
        )
    }

    onSave () {
        if (this.state.dirty) {
            // Create an update object to be merged on the server
            let update = {
                firstName: this.state.userDetails.firstName,
                lastName: this.state.userDetails.lastName,
                email: this.state.userDetails.email
            }
            
            UserStore.sendUpdateUser(update, response => {
                // If there are any validation errors, save them to state so they can be passed in to the UserDetails component and displayed.
                // If it succeeds, clear any previous errors
                if (response && response.hasErrors() && response.errors.validation_errors) {
                    // Clear the errors and then reset.
                    // This forces the User Details to re-draw even if the errors have remained the same between two saves.
                    this.setState( { validation_errors: undefined }, () => { 
                        this.setState( { validation_errors: response.errors.validation_errors } );
                    } );
                } else {
                    this.setState( { validation_errors: undefined, dirty: false, showUpdatedMessage: true } );
                }
            });
        }
    }

    render () {
        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="label_user_details"/>
                                </h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className='myaccount-form'>
                                { this.createField( "firstName", "label_first_name" ) }
                                { this.createField( "lastName", "label_last_name" ) }
                                { this.createField( "email", "label_email" ) }

                                {/* <div className="form-group">
                                    <label className="control-label"><String code='label_timezone'/></label>
                                    <TimezoneSelector
                                        className="form-control"
                                        value={this.props.userDetails.timezone}
                                        onChange={this.onFieldUpdate.bind( this, 'timezone' )}
                                    />
                                </div> */}

                                { 
                                    this.state.showUpdatedMessage ?
                                    <div className="validation-success">
                                        <String code="message_user_updated" />
                                    </div>
                                    : 
                                    null
                                }

                                <div className="form-group m-t-4">
                                    <button className="btn btn-primary round" onClick={this.onSave.bind(this)}>Update Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = UserDetails;
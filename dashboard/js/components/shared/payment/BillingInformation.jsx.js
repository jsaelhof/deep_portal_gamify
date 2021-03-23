import React from 'react';
import Modal from '../../common/Modal.jsx';
import _ from 'underscore';
import CountryStore from '../../../store/CountryStore';
import UserStore from '../../../store/UserStore';
import ErrorStore from '../../../store/ErrorStore';

class BillingInformation extends React.Component {

    constructor ( props ) {
        super( props );

        let user = UserStore.getImmutableState().userDetails;

        let billingAddress = user.billingAddress ? user.billingAddress : { firstName: user.firstName, lastName: user.lastName };
        if (!billingAddress.country) billingAddress.country = "US";

        this.state = {
            billingAddress: billingAddress,
            currentStates: CountryStore.getProvinces( { countryCodes: billingAddress.country } ),
            disableForm: false
        }
    }

    componentDidMount () {
       
    }

    onContinue () {
        let validation_errors = [];

        if (this.state.billingAddress.firstName === undefined || this.state.billingAddress.firstName.length === 0) {
            validation_errors.push( { field: "firstname", message: "Please enter your first name" } )
        }

        if (this.state.billingAddress.lastName === undefined || this.state.billingAddress.lastName.length === 0) {
            validation_errors.push( { field: "lastname", message: "Please enter your last name" } )
        }

        if (this.state.billingAddress.address === undefined || this.state.billingAddress.address.length === 0) {
            validation_errors.push( { field: "address", message: "Please enter your address" } )
        }

        if (this.state.billingAddress.city === undefined || this.state.billingAddress.city.length === 0) {
            validation_errors.push( { field: "city", message: "Please enter your city" } )
        }

        if (this.state.billingAddress.zipcode === undefined || this.state.billingAddress.zipcode.length === 0) {
            validation_errors.push( { field: "zipcode", message: "Please enter your zip / postal code" } )
        }

        if (validation_errors.length > 0) {
            this.setState( {
                validation_errors: validation_errors
            } );
        } else {
            this.setState( { disableForm: true }, () => {
                UserStore.updateAddress(this.state.billingAddress, "billingAddress", response => {
                    if (response.hasErrors()) {
                        ErrorStore.rpcResponseError(response);
                    } else {
                        this.props.onComplete();
                    }
                });
            } );
        }
    }

    onCancel () {
        this.props.onCancel();
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
                <label className="control-label">{label}</label>
                <input type="text" 
                        id={id}
                        className={ validationError ? "form-control invalid-field" : "form-control" }
                        onChange={this.onFieldUpdate.bind( this, id )}
                        value={this.state.billingAddress[id]}
                />
                { validationError ?
                    <div className="validation-error-msg">
                        { validationError.message }
                    </div>
                    :
                    null
                }
            </div>
        )
    }

    onFieldUpdate ( id, e ) {
        let updatedValidationErrors = _.filter( this.state.validation_errors, error => error.field !== id );

        let updatedBillingAddress = { ...this.state.billingAddress };
        updatedBillingAddress[id] = e.target.value.trimLeft();

        this.setState( {
            billingAddress: updatedBillingAddress,
            validation_errors: updatedValidationErrors
        } )
    }

    onCountryChange ( e ) {
        let states;

        // Only show the provinces/states for these countries, otherwise set it to undefined.
        switch (e.target.value) {
            case "CA":
            case "US":
                states = CountryStore.getProvinces( { countryCodes: e.target.value } );
                break;
        }

        let updatedBillingAddress = { ...this.state.billingAddress };
        updatedBillingAddress.country = e.target.value;

        // If this country has states, auto select the first state as the default.
        // If not, delete the state key
        if (states) {
            updatedBillingAddress.state = states[0].sd;
        } else {
            delete updatedBillingAddress.state;
        }

        // If the new country doesnt require vat, then delete it.
        if (!this.requiresVAT(e.target.value)) {
            delete updatedBillingAddress.vat;
        }

        this.setState( {
            billingAddress: updatedBillingAddress,
            currentStates: states
        } );
    }

    onStateChange ( e ) {
        let updatedBillingAddress = { ...this.state.billingAddress };
        updatedBillingAddress.state = e.target.value;

        this.setState({
            billingAddress: updatedBillingAddress
        });
    }

    requiresVAT ( country ) {
        switch ( country ) {
            case "AT":
            case "BE":
            case "BG":
            case "HR":
            case "CY":
            case "CZ":
            case "DK":
            case "EE":
            case "FI":
            case "FR":
            case "DE":
            case "GR":
            case "HU":
            case "IE":
            case "IT":
            case "LV":
            case "LT":
            case "LU":
            case "MT":
            case "NL":
            case "PL":
            case "PT":
            case "RO":
            case "SK":
            case "SI":
            case "ES":
            case "SE":
            case "GB":
                return true;
                break;
            default:
                return false;
                break;
        }
    }

    render () {
        return (
            <Modal show={true} className="sh-modal">
                <div className="modal-header-large modal-center">Billing Information</div>

                <div id="payment-form" className="modal-body">
                    <div class="m-t-4 m-b-4 w-500" style={{ "margin": "auto" }}>
                        <div className="form-group-row">
                            { this.createField( "firstName", "First Name" ) }
                            { this.createField( "lastName", "Last Name" ) }
                        </div>
                        { this.createField( "address", "Address" ) }
                        { this.createField( "city", "City" ) }
                       
                        <div className="form-group-row">
                            <div className="form-group">
                                <label className="control-label">Country</label>
                                <select className="form-control" onChange={this.onCountryChange.bind(this)} defaultValue={this.state.billingAddress.country}>
                                    {  
                                        CountryStore.getCountries().map( country => {
                                            return <option value={country.countryCodeAlpha2}>{country.countryName}</option>
                                        } )
                                    }
                                </select>
                                
                            </div>

                            { this.state.currentStates && this.state.currentStates.length > 0 ?
                                <div className="form-group">
                                    <label className="control-label">State/Province</label>
                                    <select className="form-control" onChange={this.onStateChange.bind(this)} defaultValue={this.state.billingAddress.state}>
                                        {  
                                            this.state.currentStates.map( state => {
                                                return <option value={state.sd}>{state.name}</option>
                                            } )
                                        }
                                    </select>
                                </div>
                                :
                                null
                            }

                            { this.createField( "zipcode", "Zip / Postal Code" ) }
                        </div>

                        {
                            this.requiresVAT(this.state.billingAddress.country) ?
                                this.createField( "vat", "VAT Number (Optional)" )
                                :
                                null
                        }
                    </div>  
                </div>

                <div className="modal-footer">
                    <button className="btn round btn-primary modal-button" disabled={this.state.disableForm} onClick={this.onContinue.bind(this)}>Continue</button>
                    <button className="btn round btn-default modal-button" disabled={this.state.disableForm} onClick={this.onCancel.bind(this)}>Cancel</button>
                </div>
            </Modal>
        );
    }

}

module.exports = BillingInformation;
import React from 'react';

class MailChimpEmailListConfigurator extends React.Component {

    constructor ( props ) {
        super (props);
        //console.log("SELC",props);
    }

    // componentWillReceiveProps ( newProps ) {
    //     console.log("SELC",newProps);
    // }

    render () {
        if (this.props.dataFields && this.props.dataFields.email && this.props.dataFields.email.mailingListField) {
            let emailField = this.props.dataFields.email.mailingListField;
            let includesEmail = false;
            let hasAdditionalRequiredFields = false;

            this.props.fields.forEach(field => {
                switch (field.field ) {
                    case emailField:
                        includesEmail = true;
                        break;
                    default:
                        if (field.required !== undefined && field.required === "true") hasAdditionalRequiredFields = true;
                        break;
                }
            });

            if (includesEmail && !hasAdditionalRequiredFields) {
                return (
                    null
                )
            } else if (!includesEmail) {
                return (
                    <div className="alert alert-danger">This list does not have an email field. Please choose a list that contains an email field.</div>
                )
            } else if (includesEmail && hasAdditionalRequiredFields) {
                return (
                    <div className="alert alert-danger">This list has too many required fields. Please choose a list that only requires an email address.</div>
                )
            }
        } else {
            return null;
        }
    }

}

module.exports = MailChimpEmailListConfigurator;
import React from 'react';

class KlaviyoEmailListConfigurator extends React.Component {

    constructor ( props ) {
        super (props);
        // console.log("SELC",props);
    }

    // componentWillReceiveProps ( newProps ) {
    //     console.log("SELC",newProps);
    // }

    render () {
        if (this.props.dataFields && this.props.dataFields.email && this.props.dataFields.email.mailingListField) {
            let emailField = this.props.dataCollectionFields.email.mailingListField;
            let includesEmail = false;

            this.props.fields.forEach(field => {
                switch (field.field ) {
                    case emailField:
                        includesEmail = true;
                        break;
                }
            });

            if (includesEmail) {
                return (
                    null
                )
            } else if (!includesEmail) {
                return (
                    <div className="alert alert-danger">This list does not have an email field. Please choose a list that contains an email field.</div>
                )
            }
        } else {
            return null;
        }
    }

}

module.exports = KlaviyoEmailListConfigurator;
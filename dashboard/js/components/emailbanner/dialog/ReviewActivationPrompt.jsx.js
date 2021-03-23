import React from 'react';
import Confirm from '../../shared/Confirm.jsx';
import i18n from '../../../store/i18nStore';

class ReviewActivationPrompt extends React.Component {
    constructor( props ) {
        super( props );
    }
    onConfirm () {
        if (this.props.onConfirm) this.props.onConfirm();
    }
    onCancel () {
        if (this.props.onCancel) this.props.onCancel();
    }
    render() {
        return (
            <Confirm 
                title={i18n.stringFor("review_dialog_title")} 
                okText={i18n.stringFor("review_dialog_ok")} 
                cancelText={i18n.stringFor("review_dialog_cancel")} 
                onConfirm={ this.onConfirm.bind(this) }
                onCancel={ this.onCancel.bind(this) }
            >
                <div className="review-activation-prompt">
                    <div>
                        Please make sure you are satisfied with your prize prior to activation, as it cannot be changed after activation.
                    </div>

                    <div className="m-t-6">
                        Don’t worry, if you would like to change your prize after activating your campaign, you can cancel anytime and either clone and modify your campaign or create a new one.
                    </div>
                </div>
            </Confirm>
        );
    }
}

module.exports = ReviewActivationPrompt;
import React from 'react';
import UserStore from '../../../store/UserStore';
import String from '../../common/String.jsx';
import i18n from '../../../store/i18nStore';
import Modal from '../../common/Modal.jsx';
import Confirm from '../../shared/Confirm.jsx';
import Loading from '../../shared/Loading.jsx';

class CancelSubscription extends React.Component {
    constructor ( props ) {
        super( props );

        this.state = {
            showConfirmCancel: false,
            subscriptionCancelled: false,
            errorCancellingSubscription: false,
            isCancelling: false
        }
    }

    cancel () {
        this.setState( { showConfirmCancel: true } );
    }

    onConfirmCancelSubscription ( reason, comment ) {
        this.setState( { showConfirmCancel: false }, () => {
            if (this.props.paidPlan.details.subscriptionToken) {
                this.setState( { isCancelling: true }, () => {
                    UserStore.sendCancelSubscription( this.props.paidPlan.details.subscriptionToken, comment, reason, cancelResponse => {
                        if (cancelResponse.hasErrors()) {
                            ErrorStore.rpcResponseError( cancelResponse );
                        } else {
                            if ( cancelResponse.hasErrors() ) {
                                this.setState( { errorCancellingSubscription: true, isCancelling: false } );
                            } else {
                                this.setState( { subscriptionCancelled: true, isCancelling: false } );
                            }
                        }
                    } );
                } );
            } else {
                this.setState( { errorCancellingSubscription: true } );
            }
        });
    }

    onCancelCancelSubscription () {
        this.setState( { showConfirmCancel: false } );
    }

    onConfirmSubscriptionCancelled () {
        // Tell the parent to update now that the status of the subscription has been changed.
        if (this.props.onUpdate) this.props.onUpdate();
        this.setState( { subscriptionCancelled: false } );
    }

    onConfirmCancellationError () {
        this.setState( { errorCancellingSubscription: false } );
    }

    render () {
        if (!this.props.paidPlan) return null;

        return (
            <div>
                <a onClick={this.cancel.bind(this)}>Cancel</a>

                {
                    this.state.showConfirmCancel ?
                        <ConfirmCancelModal onConfirm={this.onConfirmCancelSubscription.bind(this)} onCancel={this.onCancelCancelSubscription.bind(this)} />
                        : null
                }

                {
                    this.state.subscriptionCancelled ? 
                        <Confirm onConfirm={this.onConfirmSubscriptionCancelled.bind(this)} title="Your subscription has been cancelled" /> 
                        : null
                }

                {
                    this.state.errorCancellingSubscription ? 
                        <Confirm onConfirm={this.onConfirmCancellationError.bind(this)} title="An error occurred while cancelling your subscription" message="Please contact support at support@deepmarkit.com for further assistance"/>
                        : null
                }

                {
                    this.state.isCancelling ? 
                        <Loading title="Cancelling Your Subscription" modal={true} />
                        : null
                }
            </div>
        )
    }
}

class ConfirmCancelModal extends React.Component {
    constructor ( props ) {
        super( props );

        this.state = {
            invalidReason: false
        }
    }

    onConfirm () {
        let selected = $("input[name=reason]:checked").val();
        let reason = $("label[for="+selected+"]").html();
        let comment = $("#comment").val();

        if (selected) {
            this.props.onConfirm( reason, comment );
        } else {
            this.setState( { invalidReason: true } );
        }
    }

    onCancel () {
        this.props.onCancel();
    }

    onChange () {
        this.setState( { invalidReason: false } );
    }

    render () {
        return (
            <Modal show={true} className="sh-modal">
                <div className="modal-header-large modal-center"><div className="modal-title">Are you sure you want to cancel your subscription?</div></div>
                <div className="modal-body modal-center">
                    <div className="modal-message m-b-6">Cancelling your subscription will remove all campaigns from your account. Be sure to gather any relevant information from your campaigns before cancelling. Your account will be reset to unsubscribed status.</div>
                    <div className="modal-message">Help us make our apps better.</div>
                    <div className="modal-message">Let us know the reason you decided to cancel your subscription.</div>
                </div>
                <div className="m-t-3 m-b-3">
                    <div className="form-group">
                        <input type="radio" id="choice1" name="reason" value="choice1" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice1">Does not meet my needs</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice2" name="reason" value="choice2" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice2">App is not performing well</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice3" name="reason" value="choice3" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice3">Not needed anymore</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice4" name="reason" value="choice4" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice4">I found a better app</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice5" name="reason" value="choice5" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice5">App is not worth the cost</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice6" name="reason" value="choice6" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice6">Too hard to use</label>
                    </div>
                    <div className="form-group">
                        <input type="radio" id="choice7" name="reason" value="choice7" onClick={this.onChange.bind(this)} />
                        <label htmlFor="choice7">Other</label>
                    </div>
                    <div className="form-group">
                        <div className="m-b-1 modal-message">Describe your experience with the app</div>
                        <textarea rows="6" maxLength="1000" id="comment"></textarea>
                    </div>
                    { this.state.invalidReason ?
                        <div className="validation-error-msg m-b-3 m-t-3 modal-center">Please select a reason for cancelling your subscription.</div> 
                        : null
                    }
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-default round modal-button" onClick={this.onCancel.bind(this)}>Go Back</button>
                    <button type="button" className="btn btn-primary round modal-button" onClick={this.onConfirm.bind(this)}>Cancel Subscription</button>
                </div>
            </Modal>
        );
    }
}

module.exports = CancelSubscription;
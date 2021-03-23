import React from 'react';
import Modal from '../../common/Modal.jsx';
import ConfigStore from '../../../store/ConfigStore';

class StripePaymentDialog extends React.Component {

    constructor ( props ) {
        super( props );

        this.stripe;
        this.elements;
        this.card;
    }

    componentDidMount () {
        ConfigStore.getStripeAPIKey( response => {
            this.stripe = Stripe(response);
            this.elements = this.stripe.elements();

            // Custom styling can be passed to options when creating an Element.
            var style = {
                base: {
                    // Add your base input styles here. For example:
                    fontSize: '14px',
                    color: "#32325d"
                }
            };
            
            // Create an instance of the card Element.
            this.card = this.elements.create('card', {style: style});
            
            // Add an instance of the card Element into the `card-element` <div>.
            //this.card.mount('#card-element');

            this.card.addEventListener('change', event => {
                var displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        });
    }

    componentDidUpdate () {
        if (this.props.show) {
            this.card.mount('#card-element');
        }
    }

    onSubmitPayment () {
        this.stripe.createToken(this.card).then(result => {
            if (result.error) {
              // Inform the customer that there was an error.
              var errorElement = document.getElementById('card-errors');
              errorElement.textContent = result.error.message;
            } else {
              // Send the token to your server.
              this.props.onCardToken(result.token.id);
            }
          });
    }

    onCancelPayment () {
        this.props.onCancel();
    }

    render () {
        return (
            <Modal show={this.props.show} className="sh-modal">
                <div className="modal-header-large modal-center">Payment Method</div>

                <div id="payment-form" className="modal-body w-500" style={{ "margin": "auto" }}>
                    { this.props.children }
                    {/* {
                        this.props.paymentDetails ? 
                            <div className="m-t-4 m-b-6">
                                <div className="payment-form-row">
                                    <div>Subtotal</div>
                                    <div>{"$"+this.props.paymentDetails.amount}</div>
                                </div>
                                <div className="payment-form-row">
                                    <div>Applicable Tax</div>
                                    <div>{"$"+this.props.paymentDetails.tax}</div>
                                </div>
                                <div className="payment-form-row payment-total">
                                    <div>Total</div>
                                    <div><span className="payment-currency">USD</span> {"$"+this.props.paymentDetails.total} <span className="payment-per-month">/mo</span></div>
                                </div>
                            </div>
                            :
                            null
                    } */}

                    

                    <div class="form-row m-t-2">
                        <div className="form-group">
                            <div className="payment-header">
                                <div>Credit Card</div>
                                <div className="payment-logos">
                                    <img src="/dashboard/images/payment/creditcard.png"/>
                                </div>
                            </div>
                            {/* <label for="card-element" className="control-label">Credit Card</label> */}
                            <div id="card-element" className="form-control" style={{ "padding-top": "8px" }}>
                            {/* <!-- A Stripe Element will be inserted here. --> */}
                            </div>
                        </div>

                        <div className="payment-secure"><i className="material-icons">lock</i>PCI Level 1 compliant TLS (SSL) AES-256 Encryption</div>

                        {/* <!-- Used to display Element errors FOR STRIPE USE ONLY. --> */}
                        <div id="card-errors" className="credit-card-error" role="alert"></div>
                    </div>

                    
                </div>

                <div className="modal-footer">
                    <button className="btn round btn-primary modal-button" onClick={this.onSubmitPayment.bind(this)}>{this.props.primaryButton}</button>
                    <button className="btn round btn-default modal-button" onClick={this.onCancelPayment.bind(this)}>Cancel</button>
                </div>
            </Modal>
        );
    }

}

module.exports = StripePaymentDialog;
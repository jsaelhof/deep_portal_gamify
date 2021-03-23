import React from 'react';
import String from '../common/String.jsx';
import i18n from '../../store/i18nStore';

class Integrations extends React.Component {
    constructor ( props ) {
        super( props );
    }
    render () {
        return (
            <div className="login-integrations">
                <div className="login-type m-b-8">{i18n.stringFor("label_login_integration_header")}</div>
                <div className="integration-logos">
                    <div>
                        <a href="https://apps.shopify.com/gamify"><img className="integration-logo" src="/dashboard/images/login/integration/shopify.png"/></a>
                        <a href="https://wordpress.org/plugins/deepmarkit-gamify/"><img className="integration-logo" src="/dashboard/images/login/integration/wordpress.png"/></a>
                        <a href="https://www.bigcommerce.com/apps/gamify/"><img className="integration-logo" src="/dashboard/images/login/integration/bigcommerce.png"/></a>
                        <a href="https://addons.prestashop.com/en/emails-notifications/41864-deepmarkit.html"><img className="integration-logo" src="/dashboard/images/login/integration/prestashop.png"/></a>
                        <a href="https://www.weebly.com/app-center/gamify"><img className="integration-logo" src="/dashboard/images/login/integration/weebly.png"/></a>
                    </div>
                </div>
                <div className="integration-coming-soon">
                    <div className="m-b-2 m-t-10">{i18n.stringFor("label_login_integration_coming_soon")}</div>
                </div>
            </div>
        )
    }
}

module.exports = Integrations;

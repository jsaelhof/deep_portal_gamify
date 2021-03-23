import React from 'react';
import ConfigStore from '../../store/ConfigStore';
import UserStore from '../../store/UserStore';
import { div, browserHistory as History } from 'react-router';
import ActionBar from '../shared/nav/ActionBar.jsx';
import ProductCard from './ProductCard.jsx';
import Constants from '../shared/Constants';

class SelectCampaignType extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            products: undefined
        }
    }

    componentWillMount () {
        let products = [];
        if (ConfigStore.isProductEnabled(Constants.PRODUCT_SLIDEOUT) && ConfigStore.getPermission("campaign","create")) products.push(Constants.PRODUCT_SLIDEOUT);
        if (ConfigStore.isProductEnabled(Constants.PRODUCT_SOCIAL) && ConfigStore.getPermission("campaign","create")) products.push(Constants.PRODUCT_SOCIAL);
        if (ConfigStore.isProductEnabled(Constants.PRODUCT_EMAIL_BANNER) && ConfigStore.getPermission("campaign","create")) products.push(Constants.PRODUCT_EMAIL_BANNER);
        if (ConfigStore.isProductEnabled(Constants.PRODUCT_SURVEY) && ConfigStore.getPermission("campaign","create")) products.push(Constants.PRODUCT_SURVEY);
        
        // If there's only going to be one button shown, just go directly to that product
        if (products.length === 1) {
            History.push(ConfigStore.buildRoutePath('newcampaign',products[0]))
        } else {
            this.setState( {
                products: products
            } );
        }
    }

    componentWillUnmount () {
    }

    onNavClick ( id ) {
        switch (id) {
            case "cancel":
                History.push(ConfigStore.getDashboardRoute());
                break;
        }
    }

    render () {
        if (!this.state.products) return null;

        return (
            <div>
                <ActionBar buttonGroup="newcampaign" onClick={this.onNavClick.bind(this)} />
                <div className="action-bar-spacer"/>
                <div className="create-row">
                    <div className="create-type">
                        <div className="create-label">
                            <h2>Select a Campaign Type</h2>
                            <div>Convert browsers into buyers and drive new customers to your store with these unique campaign formats</div>
                        </div>

                        <div className="create-products">
                            {   
                                this.state.products.indexOf(Constants.PRODUCT_SLIDEOUT) >= 0
                                ?
                                    <ProductCard
                                        mainImage="/dashboard/images/create/gamifieddisplays.jpg"
                                        labelImage="/dashboard/images/create/gamifieddisplays_label.png"
                                        bullets={[
                                            "Convert Traffic into Customers",
                                            "On-site Email Collection",
                                            "Multiple Game & Reward Options",
                                            "Installed Directly on your Site"
                                        ]}
                                        buttonLabel="Get Started"
                                        onClick={ () => { History.push(ConfigStore.buildRoutePath('newcampaign',Constants.PRODUCT_SLIDEOUT)) } }
                                    />
                                    :
                                    null
                            }

                            {   
                                this.state.products.indexOf(Constants.PRODUCT_EMAIL_BANNER) >= 0
                                ?
                                    <ProductCard
                                        mainImage="/dashboard/images/create/emailcollection.jpg"
                                        labelImage="/dashboard/images/create/emailcollection_label.png"
                                        bullets={[
                                            "Grow your mailing list",
                                            "Create purchase incentives",
                                            "Pop-up’s, Banners, Full Page Overlay",
                                            "Installed Directly on your Site"
                                        ]}
                                        buttonLabel="Get Started"
                                        onClick={ () => { History.push(ConfigStore.buildRoutePath('newcampaign',Constants.PRODUCT_EMAIL_BANNER)) } }
                                    />
                                    :
                                    null
                            }

                            {   
                                this.state.products.indexOf(Constants.PRODUCT_SOCIAL) >= 0
                                ?
                                    <ProductCard
                                        mainImage="/dashboard/images/create/socialmediapromotions.jpg"
                                        labelImage="/dashboard/images/create/socialmediapromotions_label.png"
                                        bullets={[
                                            "Drive traffic to your site",
                                            "Multiple Game and Reward options",
                                            "Custom Data Collection",
                                            "Shareable Landing Page"
                                        ]}
                                        buttonLabel="Get Started"
                                        onClick={ () => { History.push(ConfigStore.buildRoutePath('newcampaign',Constants.PRODUCT_SOCIAL)) } }
                                    />
                                    :
                                    null
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

module.exports = SelectCampaignType;
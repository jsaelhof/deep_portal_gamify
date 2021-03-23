import React from 'react';
import ConfigStore from '../../store/ConfigStore';
import { browserHistory as History } from 'react-router';
import TopBar from './nav/TopBar.jsx';

class ProductWrapper extends React.Component {

    constructor ( props ) {
        super( props );
    }

    componentWillMount () {
        console.log(">>>>",ConfigStore.productConf())
        // TODO: Need to check if the productConf is undefined or some other way to tell if this integration does not support this product. If it doesn't, route back to the entry page?
    }

    componentWillUnmount () {
    }

    render () {
        return (
            <div>
                {/* Create a spacer to move the content down below the  */}
                <div className="top-bar-spacer"></div>
                { this.props.children }
                <TopBar />
            </div>
        )
    }

}

module.exports = ProductWrapper;
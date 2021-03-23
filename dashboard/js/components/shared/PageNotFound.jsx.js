import React from 'react';
import { browserHistory as History } from 'react-router';
import ErrorStore from '../../store/ErrorStore';
import ConfigStore from '../../store/ConfigStore';
import ErrorPage from '../shared/ErrorPage.jsx';

class PageNotFound extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            error: undefined
        }
    }

    componentWillMount () {
        this.setState( {
            error: ErrorStore.setError( "No route matched", "404", window.location.href, "We couldn't find that page." )
        } );
    }

    render () {
        return (this.state.error) ?
            <ErrorPage error={this.state.error}/>
            : 
            null;
    }

}

module.exports = PageNotFound;
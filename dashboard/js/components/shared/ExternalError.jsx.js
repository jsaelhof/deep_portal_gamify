import React from 'react';
import ErrorStore from '../../store/ErrorStore';
import ErrorPage from './ErrorPage.jsx';

/**
 * This class provides a wrapper around our error page.
 * It's intended to be used when you want to report an error on the query string (something outside our app like an integration)
 * Specific errors can be caught and set with custom messages.
 * This is rudimentary right now but could be expanded on to allow passing in user messages or other error data.
 */
class Error extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {};
    }

    componentDidMount () {
        this.setState( {
            error: ErrorStore.externalError( this.getQueryVariable("e"), window.location.search )
        } );
    }

    getQueryVariable (variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        return undefined;
    }

    render () {
        if (!this.state.error) return null;

        return (
            <div>
                <ErrorPage error={this.state.error} />
            </div>
        )
    }

}

module.exports = Error;
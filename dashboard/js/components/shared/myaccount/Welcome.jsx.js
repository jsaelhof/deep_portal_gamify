import React from 'react';
import UserStore from '../../../store/UserStore';
import String from '../../common/String.jsx';
import i18n from '../../../store/i18nStore';

class Welcome extends React.Component {
    constructor ( props ) {
        super( props );

        let user = UserStore.getImmutableState().userDetails;

        this.state = { 
            firstName: user.firstName,
            lastName: user.lastName
        }
    }

    componentWillMount () {
        UserStore.addEventListener( this );
    }

    componentWillUnmount () {
        UserStore.removeEventListener( this );
    }

    onUserUpdateInfo ( event ) {
        if (event.state && event.state.userDetails) {
            this.setState( { firstName: event.state.userDetails.firstName, lastName: event.state.userDetails.lastName } )
        }
    }

    render () {
        // If both names are missing for any reason, don't bother writing the greeting. Alternatively we could write a generic greeting that doesn't need a name.
        if (!this.state.firstName && !this.state.lastName) return null;

        // Build the name. If either name is undefined, print an empty string instead.
        // The trim just removes any whitespace around the final name value.
        let name = (this.state.firstName || "") + " " + (this.state.lastName || "");
        name = name.trim();
    
        return (
            <div className="welcome">
                { "Hello, " + name }
            </div>
        );
    }
}

module.exports = Welcome;
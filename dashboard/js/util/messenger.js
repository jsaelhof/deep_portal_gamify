class Messenger {
    constructor ( source, receiveListener, dataType, origin ) {
        this.source = source;
        this.listener = false;
        this.dataType = dataType || 'json';
        // this.origin = origin || '*';
        this.origin = "*";

        if ( this.source && this.source.addEventListener ) {
            try {
                if ( receiveListener ) {
                    this.listener = receiveListener;
                }

                this.receive = ( e ) => {
                    let res = {};
                    switch ( this.dataType ) {
                        case 'json':
                            try {
                                res = JSON.parse( e.data );

                                if ( this.listener ) {
                                    this.listener( res );
                                }
                            } catch ( e ) {}
                            break;
                        default:
                            if ( this.listener ) {
                                this.listener( e.data );
                            }
                            break;
                    }
                };

                this.source.addEventListener( 'message', this.receive, false );
            } catch ( e ) {
                throw new Error( 'Unsupported source' );
            }

        } else {
            throw new Error( 'Unsupported source' );
        }
    }
    processData ( type, data ) {
        switch ( type ) {
            case 'json':
                try {
                    return JSON.stringify( data );
                } catch ( e ) {
                    throw e;
                }
            default:
                return data;
        }
    }
    send ( target, message, dataType ) {
        if ( !message ) {
            throw new Error( 'Send failed, message not defined' );
        }

        let data = '';

        try {
            data = this.processData( dataType || this.dataType, message );

            if ( target && target.postMessage ) {
                try {
                    target.postMessage( data, this.origin );
                } catch ( e ) {
                    throw new Error( 'Send failed. ', e );
                }
            } else {
                throw new Error( 'Send failed, unsupported target' );
            }
        } catch ( e ) {
            throw new Error( 'Send failed, could not parse data' );
        }
    }
    destruct () {
        this.source.removeEventListener( 'message', this.receive, false );
        this.source = null;
        this.listener = null;
        this.origin = null;
        this.dataType = null;
    }
}

module.exports = Messenger;
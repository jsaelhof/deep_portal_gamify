function Queue () {
    this.queue = [];
    this.locked = false;
}

Queue.prototype.execute = function ( call ) {
    if ( call ) {
        this.queue.push( function () {
            if ( !this.locked ) { this.locked = true; }
            try {
                call()
            } finally {
                this.queue.shift();
                this.locked = false;
                this.execute();
            }
        }.bind( this ) );
    }

    if ( this.queue.length ) {
        let nextCall = null;
        try {
            nextCall = this.queue[ 0 ];
        } catch ( e ) {}

        if ( nextCall ) {
            nextCall();
            this.queue.shift();
        }
    }
};

module.exports = Queue;
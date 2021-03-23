import EventDispatcher from './EventDispatcher';

function Initializer () {
    this.initializers = [];
    EventDispatcher.createDispatcher( this, [ 'InitCompleted', 'InitFailed' ] );
}

Initializer.prototype.addInitializer = function ( object ) {
    if ( !object.initialize ) { throw new Error( 'Attempt to register an object that does not have an initialize function.' ); }
    this.initializers.push( object );
};

Initializer.prototype.initialize = function () {
    let initializers = this.initializers.slice();

    let finalizer = {
        initialize: function () {
            this.initializers = [];
            this.dispatchInitCompleted( { initializers: initializers } );
        }.bind( this )
    };

    initializers.push( finalizer );

    let context = {
        initializers: initializers,
        next: function () {
            let nextInit = initializers.shift();

            if ( nextInit ) {
                nextInit.initialize( {
                    next: context.next,
                    fail: context.fail
                } );
            }
        },
        fail: function ( e ) {
            this.initializers = [];
            this.dispatchInitFailed( { error: e, initializers: initializers } );
        }.bind( this )
    };

    context.next( context );
};

module.exports = Initializer;
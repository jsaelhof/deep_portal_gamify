const EventDispatcher = module.exports;
import _ from 'underscore';

let __nextListenerId = 1;
let __nextDispatcherId = 1;

EventDispatcher.addOneTimeEventListener = function ( dispatcher, listener ) {
    if ( !dispatcher.__oneTimeDispatchListeners ) {
        throw new Error("An attempt was made to add a listener to an object that is not a dispatcher.");
    }

    if ( !listener.__listenerId ) { listener.__listenerId = __nextListenerId++; }

    let listeners = dispatcher.__oneTimeDispatchListeners;

    if ( listenerExists( listeners, listener.__listenerId ) ) { return; }

    listeners.push( listener );
};

EventDispatcher.addEventListener = function ( dispatcher, listener ) {
    if ( !dispatcher.__dispatcherListeners ) {
        throw new Error( 'An attempt was made to add a listener to an object that is not a dispatcher.' );
    }

    if ( !listener.__listenerId ) { listener.__listenerId = __nextListenerId++; }

    let listeners = dispatcher.__dispatcherListeners;

    if ( listenerExists( listeners, listener.__listenerId ) ) { return; }

    listeners.push( listener );

    return this.removeEventListener.bind( this, dispatcher, listener );
};

EventDispatcher.removeEventListener = function ( dispatcher, listener ) {
    if ( !dispatcher.__dispatcherListeners ) {
        throw new Error( 'An attempt was made to remove a listener from an object that is not a dispatcher' );
    }

    dispatcher.__dispatcherListeners = dispatcher.__dispatcherListeners.filter( ( l ) => {
        if ( l.__listenerId !== listener.__listenerId ) {
            return listener;
        }
        return l.__listenerId !== listener.__listenerId ? listener : false;
    } );
};

EventDispatcher.dispatchEvent = function ( dispatcher, event, data ) {
    if (!dispatcher.__dispatcherListeners) {
        throw new Error("An attempt was made to dispatch an event on an object that is not a dispatcher.");
    }

    data = !data ? { __event: event } : _.extend( {}, data, { __event: event } );

    let fnName = "on" + event;

    let listeners = dispatcher.__dispatcherListeners;
    let oneTimeListeners = dispatcher.__oneTimeDispatchListeners.filter( ( s ) => s );

    dispatcher.__oneTimeDispatchListeners = [];
    dispatchToListeners( oneTimeListeners, fnName, data );
    dispatchToListeners( listeners, fnName, data );
};

EventDispatcher.createDispatcher = function ( dispatcher, events ) {
    if ( dispatcher.__dispatcherListeners ) {
        throw new Error("An attempt was made to create a dispatcher from an object that is already a dispatcher.");
    }

    if ( !dispatcher.__dispatcherId ) { dispatcher.__dispatcherId = __nextDispatcherId++; }

    dispatcher.__dispatcherListeners = [];
    dispatcher.__oneTimeDispatchListeners = [];
    dispatcher.addOneTimeEventListener = EventDispatcher.addOneTimeEventListener.bind( dispatcher, dispatcher );
    dispatcher.addEventListener = EventDispatcher.addEventListener.bind( dispatcher, dispatcher );
    dispatcher.removeEventListener = EventDispatcher.removeEventListener.bind( dispatcher, dispatcher );
    dispatcher.dispatchEvent = EventDispatcher.dispatchEvent.bind( dispatcher, dispatcher );

    if ( Array.isArray( events ) ) {
        events.forEach( ( event ) => {
            dispatcher[ 'dispatch' + event ] = dispatcher.dispatchEvent.bind( dispatcher, event );
        } );
    } else {
        for ( let k in events ) {
            if ( events[ k ] ) {
                dispatcher[ 'dispatch' + events[ k ] ] = dispatcher.dispatchEvent.bind( dispatcher, events[ k ] );
            }
        }
    }

    return dispatcher;
};

function listenerExists ( listeners, id ) {
    return listeners.filter( ( l ) => l.__listenerId === id ).length > 0;
}

// util function returns {value: value, ..} hash from events array
EventDispatcher.hashFromArray = function (events) {
    let hash = {};
    if ( Array.isArray( events ) ) {
        events.forEach( ( item ) => { hash[ item ] = item } );
    }
    return hash;
};

function dispatchToListeners ( listeners, fnName, data ) {
    if ( !listeners ) { return; }

    listeners.filter( ( l ) => l[ fnName ] ).forEach( ( listener ) => listener[ fnName ].call( listener, data ) );
}
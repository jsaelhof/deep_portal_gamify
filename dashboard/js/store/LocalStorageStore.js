import EventDispatcher from '../dispatcher/EventDispatcher';
import ConfigStore from './ConfigStore';

let _events = EventDispatcher.hashFromArray( [
] );

let state = {};

let store = EventDispatcher.createDispatcher( module.exports, _events );

store.set = function ( key, value ) {
    if (localStorage) {
        let integrationObj = getIntegrationObj();
        integrationObj[key] = value;
        localStorage.setItem(ConfigStore.INTEGRATION, JSON.stringify(integrationObj));
    }
}

store.get = function ( key ) {
    if (localStorage) {
        let integrationObj = getIntegrationObj();
        return integrationObj[key];
    }
}

store.remove = function ( key ) {
    if (localStorage) {
        let integrationObj = getIntegrationObj();
        delete integrationObj[key];
        localStorage.setItem(ConfigStore.INTEGRATION, JSON.stringify(integrationObj));
    }
}

function getIntegrationObj () { 
    let integrationObj = localStorage.getItem(ConfigStore.INTEGRATION);

    if (integrationObj) {
        integrationObj = JSON.parse(integrationObj);
    } else {
        integrationObj = {};
    }

    return integrationObj;
}
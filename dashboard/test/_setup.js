
// Web Browser Mocks
global.document = require('jsdom').jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;
global.navigator = window.navigator;
global.DOMParser = require('xmldom').DOMParser;

// React Tools
global.TestUtils = require('react-addons-test-utils');
//global.ReactTools = require('react-tools');

// Unit Testing Tools
global.sinon = require('sinon');
global.expect = require('chai').expect;

// JQuery
global.jQuery = require('jquery');
global.$ = global.jQuery;
window.$ = window.jQuery = global.jQuery;

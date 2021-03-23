var EventDispatcher = require('../../js/dispatcher/EventDispatcher');

//
// OBJECT FIXTURES
//
var listener = {
    onCount: function (event) {
        counter++;
    },
    onAddTwo: function (event) {
        counter += 2;
    },
    onAddSomeNumber: function (event) {
        counter += event.amount;
    }
};

// Using variables here, for testing. In real scenarios, there won't be a lot of value in variables for events.
var EVT_COUNT = "Count";
var EVT_ADD_SOME_NUMBER = "AddSomeNumber";
var EVT_ADD_TWO = "AddTwo";
var dispatcher = EventDispatcher.createDispatcher({}, [EVT_COUNT, EVT_ADD_SOME_NUMBER, EVT_ADD_TWO]);

//
// TEST VARIABLE
//
var counter = 0;

describe('EventDispatcher module', function () {

    beforeEach(function () {
        counter = 0;
    });

    it('should mixin EventDispatcher ', function () {
        var mixedDispatcher = EventDispatcher.createDispatcher({}, [EVT_COUNT, EVT_ADD_TWO, EVT_ADD_SOME_NUMBER]);
        mixedDispatcher.addEventListener(listener);
        mixedDispatcher.dispatchAddSomeNumber({amount: 5});
        mixedDispatcher.removeEventListener(listener);
        expect(counter).to.equal(5);
    });

    it('should mixin EventDispatcher with map of events', function () {
        var mixedDispatcher = EventDispatcher.createDispatcher({}, {
            EVT_COUNT: EVT_COUNT,
            EVT_ADD_TWO: EVT_ADD_TWO,
            EVT_ADD_SOME_NUMBER: EVT_ADD_SOME_NUMBER
        });
        mixedDispatcher.addEventListener(listener);
        mixedDispatcher.dispatchAddSomeNumber({amount: 5});
        mixedDispatcher.removeEventListener(listener);
        expect(counter).to.equal(5);
    });

    it('should add one-time event listener', function () {
        var mixedDispatcher = EventDispatcher.createDispatcher({}, [EVT_COUNT, EVT_ADD_TWO, EVT_ADD_SOME_NUMBER]);
        mixedDispatcher.addOneTimeEventListener(listener);
        mixedDispatcher.dispatchAddSomeNumber({amount: 5});
        mixedDispatcher.dispatchAddSomeNumber({amount: 5});
        mixedDispatcher.removeEventListener(listener);
        expect(counter).to.equal(5);
    });

    it('should notify listener objects of onCount events', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        EventDispatcher.removeEventListener(dispatcher, listener);
        expect(counter).to.equal(1);
    });

    it('should pass event object to event listener', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_ADD_SOME_NUMBER, {amount: 5});
        EventDispatcher.removeEventListener(dispatcher, listener);
        expect(counter).to.equal(5);
    });

    it('should ignore irrelevant listeners', function () {
        var removeEventListener = EventDispatcher.addEventListener(dispatcher, {});
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        removeEventListener();
        expect(counter).to.equal(0);
    });

    it('should ignore irrelevant dispatchers', function () {
        var dispatcher1 = EventDispatcher.createDispatcher({});
        var dispatcher2 = EventDispatcher.createDispatcher({});
        var removeEventListener = EventDispatcher.addEventListener(dispatcher1, listener);
        EventDispatcher.dispatchEvent(dispatcher2, EVT_COUNT);
        removeEventListener();
        expect(counter).to.equal(0);
    });

    it('should notify listener objects of addTwo events', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_ADD_TWO);
        EventDispatcher.removeEventListener(dispatcher, listener);
        expect(counter).to.equal(2);
    });

    it('should notify listener objects of onAddTwo events', function () {
        var addTwoListener = {
            onAddTwo: function () {
                counter += 2;
            }
        };
        EventDispatcher.addEventListener(dispatcher, addTwoListener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_ADD_TWO);
        EventDispatcher.removeEventListener(dispatcher, addTwoListener);
        expect(counter).to.equal(2);
    });

    it('should remove lisener objects from EventDispatcher', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.removeEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        expect(counter).to.equal(0);
    });

    it('should use returned remove function to remove listener objects from EventDispatcher', function () {
        var removeEventListener = EventDispatcher.addEventListener(dispatcher, listener);
        removeEventListener();
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        expect(counter).to.equal(0);
    });

    it('ignores duplicate registration of the same event listener.', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        EventDispatcher.removeEventListener(dispatcher, listener);
        expect(counter).to.equal(1);
    });

    it('allows two instances from the same constructor to register.', function () {
        function Listener() {
        }

        Listener.prototype.onCount = function (event) {
            counter++;
        };

        var listener1 = new Listener();
        var listener2 = new Listener();

        EventDispatcher.addEventListener(dispatcher, listener1);
        EventDispatcher.addEventListener(dispatcher, listener2);
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        EventDispatcher.removeEventListener(dispatcher, listener1);
        EventDispatcher.removeEventListener(dispatcher, listener2);
        expect(counter).to.equal(2);
    });

    it('removes all registered listeners that match (even if duplicates exist)', function () {
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.addEventListener(dispatcher, listener);
        EventDispatcher.removeEventListener(dispatcher, listener);
        EventDispatcher.dispatchEvent(dispatcher, EVT_COUNT);
        expect(counter).to.equal(0);
    });

});
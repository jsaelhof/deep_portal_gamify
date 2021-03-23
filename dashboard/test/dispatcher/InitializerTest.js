var Initializer = require('../../js/dispatcher/Initializer');

var countFixture = 0;
var succeeded = false;
var failed = false;
var expectedMessage = "boo!";

var addInitializer = {
    initialize: function (context) {
        countFixture += 1;
        context.next()
    }
};

var initListener = {
    onInitCompleted: function (e) {
        succeeded = true;
    },
    onInitFailed: function (e) {
        failed = true;
    }
};

var badInitializer = {
    initialize: function (context) {
        context.fail(expectedMessage);
    }
};

describe('Initializer', function(){

    beforeEach(function () {
        countFixture = 0;
        succeeded = false;
        failed = false;
    });

    it('should initialize one thing', function() {
        var initializer = new Initializer();
        initializer.addInitializer(addInitializer);
        initializer.initialize();

        expect(countFixture).to.equal(1);
    });

    it('should initialize one thing only once', function() {
        var initializer = new Initializer();
        initializer.addInitializer(addInitializer);
        initializer.initialize();
        initializer.initialize(); // note duplicate call

        expect(countFixture).to.equal(1);
    });

    it('should initialize two things', function() {
        var initializer = new Initializer();
        initializer.addInitializer(addInitializer);
        initializer.addInitializer(addInitializer);
        initializer.initialize();

        expect(countFixture).to.equal(2);
    });

    it('should initialize nothing', function() {
        var initializer = new Initializer();
        initializer.initialize();
        expect(countFixture).to.equal(0);
    });

    it('should fail to initialize', function() {
        var initializer = new Initializer();
        initializer.addInitializer(addInitializer);
        initializer.addInitializer(badInitializer);
        initializer.addInitializer(addInitializer); // should initiallize this second one
        initializer.initialize();
        expect(countFixture).to.equal(1);

    });

    it('should dispatch completion event', function() {
        var initializer = new Initializer();
        initializer.addEventListener(initListener);
        initializer.addInitializer(addInitializer);
        initializer.initialize();
        expect(succeeded).to.equal(true);
        expect(failed).to.equal(false);
    });

    it('should dispatch failed event', function() {
        var initializer = new Initializer();
        initializer.addEventListener(initListener);
        initializer.addInitializer(addInitializer);
        initializer.addInitializer(badInitializer);
        initializer.addInitializer(addInitializer);
        initializer.initialize();
        expect(countFixture).to.equal(1);
        expect(succeeded).to.equal(false);
        expect(failed).to.equal(true);
    });

});
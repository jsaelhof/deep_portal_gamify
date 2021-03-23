describe('Queue', function () {
    var Queue = require("../../js/rpc/Queue");

    before(function () {
    });

    after(function () {
    });

    it('should call all functions', function () {
        var queue = new Queue();
        var results = [];
        var func = function (id) {
            results.push(id);
        };
        queue.execute(func.bind(null, 1));
        queue.execute(func.bind(null, 2));
        queue.execute(func.bind(null, 3));
        queue.execute(func.bind(null, 4));
        expect(results.toString()).to.equal([1,2,3,4].toString())
    });

    it('should call backlog of functions', function () {
        var queue = new Queue();
        var results = [];
        var func = function (id) {
            results.push(id);
        };
        queue.locked = true;
        queue.execute(func.bind(null, 1));
        queue.execute(func.bind(null, 2));
        queue.execute(func.bind(null, 3));
        queue.execute(func.bind(null, 4));
        expect(results.toString()).to.equal([].toString());

        queue.locked = false;
        queue.execute();

        expect(results.toString()).to.equal([1,2,3,4].toString())
    });

});
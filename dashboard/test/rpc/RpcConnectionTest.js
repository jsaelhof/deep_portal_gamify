localStorage = {};

describe('RpcConnection', function() {
    var RpcConnection = require('../../js/rpc/RpcConnection');
    var GUID      = require('../../js/util/guid');

    // Mock the objects
    var guid      = '9ba126ce-4261-4d7f-8643-eef475e12919';
    var rpcParams = {
        "params":  {
            "login" : "fake@email.com",
            "details" : {
                "email" : "fake@email.com"
            }
        }
    };
    var rpcResponse = {
        "id": guid,
        "headers": {},
        "result": {
            "status": "ACTIVE",
            "details": {
                "email": "fake@email.com"
            }
        }
    };

    before(function() {
        // Stub AJAX request call to return a success and the mocked response
        sinon.stub(GUID, "guid").returns(guid);
        sinon.stub($, "ajax").yieldsTo("success", rpcResponse);
    });

    after(function() {
        $.ajax.restore();
    });

    it('should be able to send a request and get a proper response', function(done) {
        // Start the testing
        var rpcConnection = new RpcConnection("/portal/api/");
        rpcConnection.send('user/register', rpcParams, function(data) {
            expect(data.id).to.equal(guid);
        });
        done();
    });

    it('should add and remove headers predictably.', function(done) {
        // Start the testing
        var rpcConnection = new RpcConnection("/portal/api/");

        rpcConnection.setHeader('key', 'value');
        var headers = rpcConnection.getHeaders();
        expect(true).to.equal('key' in headers);
        expect('value').to.equal(headers.key);

        rpcConnection.deleteHeader('key');
        done();
        headers = rpcConnection.getHeaders();
        expect(false).to.equal('key' in headers);
    });

});
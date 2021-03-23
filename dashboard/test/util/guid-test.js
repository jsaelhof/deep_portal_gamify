var guid = require('../../js/util/guid').guid;

describe('guid module', function(){

  it('should generate a valid GUID', function() {
    var g = guid();
    console.log(g);
    expect(g.length).to.equal(37);
    expect(g[15]).to.equal('4');
  });

});
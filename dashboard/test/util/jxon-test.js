var getJXONTree = require('../../js/util/jxon').getJXONTree;

describe('jxon module', function () {

  it('[BUG] should parse XML into a JSON object, but does not due to a bug in xmldom.', function () {
    // var xmlString = '<car id="1"><colors><color>red</color><color>blue</color></colors><engine><size>big</size></engine></car>';
    // var xmlDOM = new DOMParser().parseFromString(xmlString);
    // var tree = getJXONTree(xmlDOM);
    // TODO: add assertions once bug is fixed.;
  });

});
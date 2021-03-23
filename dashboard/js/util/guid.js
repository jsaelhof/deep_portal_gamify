var crypto = require( 'crypto' );

function guid() {
  return 'Gxxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomHex() {
    return crypto.randomBytes(10).toString('hex');
}

module.exports = {
    guid:guid,
    randomHex: randomHex
};


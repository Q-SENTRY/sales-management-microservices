var exec = require('cordova/exec');
module.exports = {
  update: function (json, ok, err) { exec(ok, err, 'FormaWidget', 'update', [json]); },
  consume: function (ok, err) { exec(ok, err, 'FormaWidget', 'consume', []); }
};

var crypto = require('crypto');

module.exports.encrypt = function(buffer, algorithm, password) {
	var cipher = crypto.createCipher(algorithm, password)
	var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
	return crypted;
}

module.exports.decrypt = function(buffer, algorithm, password) {
	var decipher = crypto.createDecipher(algorithm, password)
	var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
	return dec;
}
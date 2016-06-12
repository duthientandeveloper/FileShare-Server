var express = require('express');
var router = express.Router();
var fs = require('fs');
var crypto = require('../models/cryptography');
var Busboy = require('busboy');


/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
	console.log(req.user)
	res.render('index', {
		title: 'Members'
	});
});

router.get('/des', function(req, res, next) {
	console.log(require('crypto').getCiphers())
	res.render('cipher', {
		title: 'Data Encryption Standard',
		algorithm: ['des', 'des-cbc', 'des-cfb', 'des-ecb', 'des-ede', 'des-ofb']
	});
});

router.get('/aes', function(req, res, next) {
	res.render('cipher', {
		title: 'Advanced Encryption Standard',
		algorithm: ['aes128', 'aes192', 'aes256']
	});
});
router.get('/rsa', function(req, res, next) {
	fs.readFile('E:\NodejsProject\nodeauth')
	res.send("Hello");
});

router.post('/upload', function(req, res, next) {
	var algorithm = req.body.algorithm;
	var mode = req.body.mode;
	var arrayFile = req.files;
	var passWord = req.body.password;
	var response = '';
	for (var i = 0; i < arrayFile.length; i++) {
		var oldPath = './uploads/' + arrayFile[i].filename;
		var newPath = './uploads/' + arrayFile[i].originalname;
		fs.renameSync(oldPath, newPath);
		var data = fs.readFileSync(newPath);
		var result, pathnew;
		if (mode == 'encrypt') {
			console.log('encrypt')
			result = crypto.encrypt(data, algorithm, passWord);
			pathnew = './uploads/encrypt/' + arrayFile[i].originalname;
		} else {
			console.log('decrypt')
			result = crypto.decrypt(data, algorithm, passWord);
			pathnew = './uploads/decrypt/' + arrayFile[i].originalname;
		}
		fs.writeFileSync(pathnew, result);
		if (mode == 'encrypt')
			response += '<a href=http://localhost:4000/encrypt/' + arrayFile[i].originalname + '>' + arrayFile[i].originalname + '</a><br/>';
		else
			response += '<a href=http://localhost:4000/decrypt/' + arrayFile[i].originalname + '>' + arrayFile[i].originalname + '</a><br/>';
	}
	res.send(response);
});


function ensureAuthenticated(req, res, next) {
	console.log(req.user);
	if (req.isAuthenticated()) {
		return next();
	};
	res.redirect('/users/login');
}

module.exports = router;
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var ObjectId = require('mongoose').Types.ObjectId;
var fs = require('fs');
var User = require('../models/user');

router.post('/login', passport.authenticate('local', {
	failureRedirect: '/users/login',
	failureFlash: 'Invalid username or password'
}), function(req, res) {
	req.flash('success', 'You are login');
	var token = jwt.sign(req.user, 'FileShare', {
		expiresInMinutes: 1440 // expires in 24 hours
	});
	res.json({
		username: req.user.username,
		id: req.user._id,
		name: req.user.name,
		token: token
	});
});

router.use(function(req, res, next) {
	// check header or url parameters or post parameters for token
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, 'FileShare', function(err, decoded) {
			if (err) {
				return res.json({
					success: false,
					message: 'Failed to authenticate token.'
				});
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});

	}
});

router.post('/upload', function(req, res, next) {
	var arrayFile = req.files;
	var id = req.headers['id'];

	for (var i = 0; i < arrayFile.length; i++) {
		try {
			var pathInServer = arrayFile[i].filename;
			var fileName = arrayFile[i].originalname;
			var pathUserDir = './uploads/' + id;
			if (!fs.existsSync(pathUserDir)) {
				fs.mkdirSync(pathUserDir);
			}
			var data = fs.readFileSync('./uploads/' + arrayFile[i].filename)
			fs.writeFileSync(pathUserDir + '/' + arrayFile[i].originalname, data);
			fs.unlinkSync('./uploads/' + arrayFile[i].filename);
			var pathFile = id + '/' + arrayFile[i].originalname;
			console.log(id)
			User.findById(new ObjectId(id)).select('files').exec(function(err, user) {
				user.files.push({
					pathFile: pathFile,
					nameFile: fileName
				});
				user.save((err) => {
					if (err) console.log(err)
				});
			});
		} catch (e) {
			console.log(e)
		}
	}
	res.send("Completion");
});

router.get('/store', (req, res, next) => {
	var id = req.headers['id'];
	var arrPathFile = [];
	User.findById(new ObjectId(id)).select('files').exec(function(err, user) {
		for (s in user.files) {
			arrPathFile.push(user.files[s].pathFile);
			console.log(user.files[s].pathFile)
		}
		res.json({
			arr: arrPathFile
		});
	});
});
module.exports = router;
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var fs = require('fs');

/* GET users listing. */
router.get('/register', function(req, res, next) {
	res.render('register', {
		'title': 'Register'
	});
});

router.get('/login', function(req, res, next) {
	res.render('login', {
		'title': 'Login'
	});
});

router.post('/register', function(req, res, next) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var profileImageName = 'noimage.png';
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Name not valid').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);
	req.checkBody('password2', 'Password Confirm field is required').notEmpty();
	var errors = req.validationErrors();
	if (errors) {
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
			profileimage: profileImageName
		});
		User.createUser(newUser, function(err, user) {
			if (err) throw err;
			console.log(user);
		});
		req.flash('success', 'You are now registered and may log in');
		res.location('/');
		res.redirect('/');
	}
});

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user) {
			if (err) throw err;
			if (!user) {
				console.log('Unknown User');
				return done(null, false, {
					message: 'Unknown User'
				});
			}
			User.comparePassword(password, user.password, function(err, isMatch) {
				console.log(password + user.password + isMatch);

				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					console.log('Invalid Password');
					return done(null, false, {
						message: 'Invalid Password'
					});
				}
			});
		});
	}
));

router.post('/login', passport.authenticate('local', {
	failureRedirect: '/users/login',
	failureFlash: 'Invalid username or password'
}), function(req, res) {
	console.log('Authentication Successful');
	req.flash('success', 'You are login');
	res.redirect('/users/' + req.user._id + '/upload');
});

router.get('/:userid/upload', ensureAuthenticated, function(req, res, next) {
	res.render('upload', {
		title: req.user.name,
		url: '/users/' + req.user._id + '/upload'
	});
});

router.post('/:userid/upload', ensureAuthenticated, function(req, res, next) {
	var arrayFile = req.files;
	console.log(arrayFile) 
	for (var i = 0; i < arrayFile.length; i++) {
		var pathInServer = arrayFile[i].filename;
		var fileName = arrayFile[i].originalname;
		var pathUserDir = './uploads/' + req.user._id;
		if (!fs.existsSync(pathUserDir)) {
			fs.mkdirSync(pathUserDir);
		}
		console.log(pathUserDir)
		var source = fs.createReadStream('./uploads/' + arrayFile[i].filename);
		var dest = fs.createWriteStream(pathUserDir+ '/' + arrayFile[i].filename);
		source.pipe(dest);
		fs.unlinkSync('./uploads/' + arrayFile[i].filename);
		var oldPath = pathUserDir + '/' +arrayFile[i].filename;
		var newPath = pathUserDir + '/' + arrayFile[i].originalname;
		var pathFile = req.user._id+'/'+arrayFile[i].originalname;
		fs.renameSync(oldPath, newPath);
		User.findById(req.user._id).select('files').exec(function(err,user){
			user.files.push({
				pathFile:pathFile,
				nameFile:fileName
			});
			user.save((err)=>{
				if(err) console.log(err)
			});
		});
	}
	res.send("Completion")
});

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success', 'You have logged out');
	res.redirect('/users/login');
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	};
	res.redirect('/users/login');
}
module.exports = router;
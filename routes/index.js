var express = require('express');
var router = express.Router();
//文件上传
// var multer = require('multer');
//生成散列
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var multer  = require('multer')
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/images')
	},
	filename: function (req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
	}
});
var upload = multer({
  storage: storage
});

/**
 * 是否登录权限
 */
function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash('error', '未登录');
		res.redirect('/login')
	}
	next();	
}
function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', '已登录');
		res.redirect('back');
	}
	next();
}

/* GET home page. */
router.get('/', function(req, res, next) {
	Post.get(null, function (err, posts) {
		if (err) {
			posts = [];
		}
		console.log(posts)
		res.render('index', { 
			title: '主页',
			user: req.session.user,
			posts: posts,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	})
});
router.post('/', function(req, res, next) {
	res.send('test')
});
router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res, next) {
	res.render('reg', { 
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	})
});
router.post('/reg', function (req, res, next) {
	console.log(req.body)
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body['password-repeat'];
	//检测用户两次输入是否正确
	if (password_re != password) {
		req.flash('error', '两次输入的密码不一致!');
		return res.redirect('/reg');//返回注册页
	}
	//生成密码的 md5 值
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: name,
		password: password,
		email: req.body.email
	});
	//检查用户名是否已经存在 
	User.get(newUser.name, function (err, user) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		if (user) {
			req.flash('error', '用户已存在!');
			return res.redirect('/reg');//返回注册页
		}
		//如果不存在则新增用户
		newUser.save(function (err, user) {
			if (err) {
				 req.flash('error', err);
				return res.redirect('/reg');//注册失败返回主册页
			}
			req.session.user = newUser;//用户信息存入 session
			req.flash('success', '注册成功!');
			res.redirect('/');//注册成功后返回主页
		});
	});
});
router.get('/login', checkNotLogin);
router.get('/login', function (req, res, next) {
	res.render('login', { 
		title: '登录',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	})
});
router.post('/login', checkNotLogin);
router.post('/login', function (req, res, next) {
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');

	//检测用户是否存在
	User.get(req.body.name, function (err, user) {
		if (!user) {
			req.flash('error', '用户不存在');
			return res.redirect('/login')
		}
		//检测密码是否一致
		if (user.password != password) {
			req.flash('error', '密码错误！');
			return res.redirect('/login');
		}
		//用户密码都匹配后，讲用户信息存入session
		req.session.user = user;
		req.flash('success', "登录成功！");
		res.redirect('/');
	})
});
router.get('/post', checkLogin);
router.get('/post', function (req, res, next) {
	res.render('post', { 
		title: '发表',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	})
});
router.post('/post', checkLogin);
router.post('/post', function (req, res, next) {
	var currentUser = req.session.user,
		post = new Post(currentUser.name, req.body.title, req.body.post);

	post.save(function (err) {
		if (err) {
			req.flash('error', err); 
			return res.redirect('/');
		}
		req.flash('success', '发布成功!');
		res.redirect('/');//发表成功跳转到主页
	});
})
router.get('/logout', checkLogin);
router.get('/logout', function (req, res, next) {
	req.session.user = null;
	req.flash('success', '登出成功！');
	res.redirect('/');
});
router.get('/upload', checkLogin);
router.get('/upload', function (req, res, next) {
	res.render('upload', {
		title: '文件上传',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	})
});
router.post('/upload', upload.single('avatar'), function (req, res) {
	console.log('-----------------------')
	console.log(req.body)
	req.flash('success', '文件上传成功');
	res.redirect('/upload');
})
module.exports = router;

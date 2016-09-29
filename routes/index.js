var express = require('express');
var router = express.Router();
//生成散列
var crypto = require('crypto');
var User = require('../models/user.js');
/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { 
		title: '主页',
		user: req.session.user
	});
});
router.post('/', function(req, res, next) {
	res.send('test')
});
router.get('/reg', function (req, res, next) {
	res.render('reg', { title: '注册' })
});
router.post('/reg', function (req, res, next) {
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body['password-repeat'];
	//检测用户两次输入是否正确
	if (password_re != password) {
		console.log('error', '两次输入的密码不一致!'); 
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
			console.log('error', err);
			return res.redirect('/');
		}
		if (user) {
			console.log('error', '用户已存在!');
			return res.redirect('/reg');//返回注册页
		}
		//如果不存在则新增用户
		newUser.save(function (err, user) {
			if (err) {
				console.log('error', err);
				return res.redirect('/reg');//注册失败返回主册页
			}
			req.session.user = newUser;//用户信息存入 session
			console.log('success', '注册成功!');
			res.redirect('/');//注册成功后返回主页
		});
	});
})
router.get('/login', function (req, res, next) {
	res.render('login', { title: '登录' })
});
router.get('/post', function (req, res, next) {
	res.render('post', { title: '发表' })
});
router.get('/logout', function (req, res, next) {
	res.render('logout', { title: '登出' })
});
module.exports = router;

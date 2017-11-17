var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// global setting by s2
crypto = require('crypto');
nodemailer = require('nodemailer');
xssFilters = require('xss-filters');
session = require('express-session');
fs = require('fs');
exec = require('child_process');
//request = require('request');
formidable = require('formidable');
zlib = require('zlib');

i18n = {}; 
require('./i18n.js');//多語系支援
defaultLang = i18n.zh_tw; // 預設使用語系
var config = require('./config.js');
app.use(session(sessionConf));
var s2func = require('./s2func.js');
var dbschema = require('./dbschema.js');
var Promise = require('bluebird');

//routing
var routes = require('./routes/index');
var users = require('./routes/users');
var preorders = require('./routes/preorders');
var orders = require('./routes/orders');
var products = require('./routes/products');

app.use('/', routes);
app.use('/users', users);
app.use('/preorders', preorders);
app.use('/orders', orders);
app.use('/products', products);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
app.listen(sitePort, function () {
  console.log(siteTitle+' listening on port '+sitePort)
})
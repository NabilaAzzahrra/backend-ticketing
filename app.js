require('dotenv').config() // ✅ TAMBAH INI

var createError = require('http-errors');
var express = require('express');
const cors = require("cors");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// ROUTES
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRoutes = require('./routes/auth');
var divisionRoutes = require('./routes/division');
var employeeRoutes = require('./routes/employee');
var headofRoutes = require('./routes/headof');
var ticketRoutes = require('./routes/ticket');
var reportRoutes = require('./routes/report');
var dashboardRoutes = require('./routes/dashboard');
var configurationRoutes = require('./routes/configuration');
var waRoutes = require('./routes/wa');
const apiKeyMiddleware = require('./middleware/apiKey')
const { initWAClient } = require("./utils/whatsapp");


// DB (WAJIB DIPANGGIL BIAR CONNECT)
require('./config/db'); // ✅ TAMBAH INI

var app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "lp3i-api-key",
    ],
    credentials: true,
  })
);

// view engine setup (boleh, ga ganggu JWT)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
initWAClient();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());    
app.use(express.static(path.join(__dirname, 'public')));

// ROUTING
app.use("/public", express.static(path.join(__dirname, "public")));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/division', divisionRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/headof', headofRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', apiKeyMiddleware, authRoutes); // JWT: /api/register, /api/login
app.use("/uploads", express.static("uploads"));
app.use("/api/wa", waRoutes);
app.use("/api/configuration", configurationRoutes);


// catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

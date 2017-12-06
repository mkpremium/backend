// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');

// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 9080; // used to create, sign, and verify tokens


// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// use morgan to log requests to the console
app.use(morgan('dev'));

// =================================================================
// routes ==========================================================
// =================================================================

// basic route (http://localhost:8080)
app.get('/', function(req, res) {
	res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// =================================================================
// get an instance of the router for migration routes
// =================================================================
var migrationRoutes = require('./app/routes/migration');
app.use('/api/migration', migrationRoutes);

var v1Routes = require('./app/routes/v1');
app.use('/api/v1', v1Routes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Server listening at http://localhost:' + port);

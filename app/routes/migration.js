var express     = require('express');
var config      = require('../../config');
var router      = express.Router();
 
var couchbase   = require('couchbase');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);
 
var buildings   = require('../models/building');
var operators   = require('../models/operators');
var owners      = require('../models/owners');
var persons     = require('../models/persons');
var houseStates = require('../models/housestate');
var worksheets  = require('../models/worksheets');
var history     = require('../models/history');

var modelHelper = require('../models/models-helper');
var migrationManager = require('../managers/migration-manager');

router.use(function(req, res, next) {
  //console.log('Something is happening.');
  next();
});

// =================================================================
// set up endpoints
// =================================================================
router.get('/', function(req, res) {
	res.json({ message: 'Welcome to the migration API!' });
});


// =================================================================
// DB utilities
// =================================================================
router.get('/deleteall', function(req, res) {
    migrationManager.deleteAll(res);
});

router.get('/importall', function(req, res) {
    
    console.log('IMPORT ALL');    
    migrationManager.bulkImport('EDIFICIOS.csv', 'building', null);
    
    migrationManager.bulkImport('OPERADORES.csv', 'operator', null);
    
    migrationManager.bulkImport('PROPIETARIOS.csv', 'owner', null);
    
    migrationManager.bulkImport('PERSONAS.csv', 'person', null);
    
    migrationManager.bulkImport('SITARR.csv', 'housestate', null);
    
    migrationManager.bulkImport('LLAMADAS.csv', 'worksheet', null);
    
    migrationManager.bulkImport('HISTORIAL.csv', 'history', null);
    
    res.json({done: true});

});

router.get('/importaux', function(req, res) {
    
    console.log('IMPORT AUX');    

    migrationManager.importAuxiliar001();
    
    migrationManager.importAuxiliar002(null);
    
    migrationManager.importAuxiliar003(null);
    
    migrationManager.importAuxiliar004(null);
    
    migrationManager.importAuxiliar005(null);
    
    migrationManager.importAuxiliar006(null);
    
    migrationManager.importAuxiliar007(null);
    
    migrationManager.importAuxiliar008(null);
    
    res.json({done: true});

});


router.get('/importaux01', function(req, res) {    
    migrationManager.importAuxiliar001();
    
    
    res.json({done: true});

});

router.get('/importaux/:id', function(req, res) {    

    if (req.params.id == '001') {
        migrationManager.importAuxiliar001();    
        res.json({done: true});
    }
    else if (req.params.id == '002') {
        migrationManager.importAuxiliar002(res);    
    }
    else if (req.params.id == '003') {
        migrationManager.importAuxiliar003(res);    
    }
    else if (req.params.id == '004') {
        migrationManager.importAuxiliar004(res);    
    }
    else if (req.params.id == '005') {
        migrationManager.importAuxiliar005(res);    
    }
    else if (req.params.id == '006') {
        migrationManager.importAuxiliar006(res);    
    }
    else if (req.params.id == '007') {
        migrationManager.importAuxiliar007(res);    
    }
    else if (req.params.id == '008') {
        migrationManager.importAuxiliar008(res);    
    }
    

});

// =================================================================
// Migration endpoints: Buildings
// =================================================================

router.get('/buildings', function(req, res) {    
    migrationManager.getList("building", res);
});

router.post('/buildings', function(req, res) {
    var response = migrationManager.importBuilding(req.body, true);
    res.json({response: response, input: req.body, data: data});
});

router.get('/buildings/bulkimport', function(req, res) {    
    migrationManager.bulkImport('EDIFICIOS.csv', 'building', res);
});


// =================================================================
// Migration endpoints: Banks
// =================================================================

router.get('/banks/importBank', function(req, res) {
    migrationManager.bulkImport('BRUTO 4 COMUNIDADES.csv', 'tempBankUpdate', res);
});


// =================================================================
// Migration endpoints: Operators
// =================================================================
router.get('/operators', function(req, res) {    
    migrationManager.getList("operator", res);

});

router.post('/operators', function(req, res) {
    var response = migrationManager.importOperator(req.body, true);
    res.json({response: response, input: req.body, data: data});
});

router.get('/operators/bulkimport', function(req, res) {    
    migrationManager.bulkImport('OPERADORES.csv', 'operator', res);
});

// =================================================================
// Migration endpoints: Owners
// =================================================================
router.get('/owners', function(req, res) {    
    migrationManager.getList("owner", res);
});

router.post('/owners', function(req, res) {    
    var response = migrationManager.importOwner(req.body, true);
    res.json({response: response, input: req.body, data: data});    
});

router.get('/owners/bulkimport', function(req, res) {    
    migrationManager.bulkImport('PROPIETARIOS.csv', 'owner', res);
});

// =================================================================
// Migration endpoints: persons
// =================================================================
router.get('/persons', function(req, res) {    
    migrationManager.getList("person", res);
});

router.post('/persons', function(req, res) {
    var response = migrationManager.importPerson(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/persons/bulkimport', function(req, res) {    
    migrationManager.bulkImport('PERSONAS.csv', 'person', res);
});

// =================================================================
// Migration endpoints: houseState
// =================================================================
router.get('/housestates', function(req, res) {    
    migrationManager.getList("housestate", res);
});

router.post('/housestates', function(req, res) {
    var response = migrationManager.importHouseState(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/housestates/bulkimport', function(req, res) {    
    migrationManager.bulkImport('SITARR.csv', 'housestate', res);
});

// =================================================================
// Migration endpoints: worksheet
// =================================================================
router.get('/worksheets', function(req, res) {    
    migrationManager.getList("worksheet", res);
});

router.post('/worksheets', function(req, res) {
    var response = migrationManager.importWorkSheet(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/worksheets/bulkimport', function(req, res) {    
    migrationManager.bulkImport('LLAMADAS.csv', 'worksheet', res);
});

// =================================================================
// Migration endpoints: history
// =================================================================
router.get('/history', function(req, res) {    
    migrationManager.getList("history", res);
});

router.post('/history', function(req, res) {
    var response = migrationManager.importHistory(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/history/bulkimport', function(req, res) {    
    migrationManager.bulkImport('HISTORIAL.csv', 'history', res);
});

// =================================================================
// Migration endpoints: other
// =================================================================

router.get('/aux/001', function(req, res) {        
    migrationManager.importAuxiliar001();
    res.json({done: true});    
});

// history-worksheet relations
router.get('/aux/002', function(req, res) {    
    migrationManager.importAuxiliar002(res);
});


// history-worksheet relations
router.get('/aux/003', function(req, res) {
    migrationManager.importAuxiliar003(res);    
        
});

// history-department
router.get('/aux/004', function(req, res) {    
    migrationManager.importAuxiliar004(res);
});

// worksheet-owner
router.get('/aux/005', function(req, res) {   
    migrationManager.importAuxiliar005(res);
});

// owner-worksheet
router.get('/aux/006', function(req, res) {       
    migrationManager.importAuxiliar006(res);
});


// worksheet-building
router.get('/aux/007', function(req, res) {       
    migrationManager.importAuxiliar007(res);
});
    

// building-worksheet
router.get('/aux/008', function(req, res) {    
    migrationManager.importAuxiliar008(res);        
});

// =================================================================
// Common functions
// =================================================================



// =================================================================
// module migration
// =================================================================
module.exports = router;




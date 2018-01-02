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
var verifyToken = require('../middleware/verify-token');

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

router.get('/banks/importBank', verifyToken, function(req, res) {
    migrationManager.importBanks('BRUTO 4 COMUNIDADES.csv', 'tempBankUpdate', req.userId, res);
});


// =================================================================
// Migration endpoints: BANKWORKSHEET
// =================================================================

router.get('/banks/confirmUpload', verifyToken, function(req, res) {
    migrationManager.confirmUpload(req.query.ticketid, req.query.processOutdated, 'bankOperation', req.userId, res);
});

router.get('/banks/getPendingBankOperations', verifyToken, function(req, res) {
    migrationManager.getPendingBankOperations(res);
});

router.get('/banks/getBankBuildings', verifyToken, function(req, res) {
    migrationManager.getBankBuildings(req.query.operation, req.query.state, parseInt(req.query.from), parseInt(req.query.size), res);
});

router.get('/banks/exportBankBuilding', verifyToken, function(req, res) {
    migrationManager.exportBankBuilding(req.query.operation, req.query.state, req.query.name, res);
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


// creation of index
router.get('/aux/000', function(req, res) {        
    migrationManager.importAuxiliar0000(res);
    //res.json({done: true});    
});

// auxiliar inserts
router.get('/aux/0010', function(req, res) {        
    migrationManager.importAuxiliar0010();
    res.json({done: true});    
});

// history-worksheet relations
router.get('/aux/0020', function(req, res) {    
    migrationManager.importAuxiliar0020(res);
});

// history-worksheet relations
router.get('/aux/0021', function(req, res) {    
    migrationManager.importAuxiliar0021(res);
});

// history-worksheet relations
router.get('/aux/0022', function(req, res) {    
    migrationManager.importAuxiliar0022(res);
});

// history-worksheet relations
router.get('/aux/0030', function(req, res) {
    migrationManager.importAuxiliar0030(res);            
});

// history-department
router.get('/aux/0040', function(req, res) {    
    migrationManager.importAuxiliar0040(res);
});

// worksheet-owner
router.get('/aux/0050', function(req, res) {   
    migrationManager.importAuxiliar0050(res);
});

// owner-worksheet
router.get('/aux/0060', function(req, res) {       
    migrationManager.importAuxiliar0060(res);
});


// worksheet-building
router.get('/aux/0070', function(req, res) {       
    migrationManager.importAuxiliar0070(res);
});
    

// building-worksheet
router.get('/aux/0080', function(req, res) {    
    migrationManager.importAuxiliar0080(res);        
});

router.get('/aux/0090', function(req, res) {    
    migrationManager.importAuxiliar0090(res);        
});

router.get('/aux/0100', function(req, res) {    
    migrationManager.importAuxiliar0100(res);        
});

router.get('/aux/0110', function(req, res) {    
    migrationManager.importAuxiliar0110(res);        
});

// =================================================================
// Common functions
// =================================================================



// =================================================================
// module migration
// =================================================================
module.exports = router;




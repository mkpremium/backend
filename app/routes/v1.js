var express     = require('express');
var config      = require('../../config');
var router      = express.Router();
 
var couchbase   = require('couchbase');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);
 
// var buildings   = require('../models/building');
// var operators   = require('../models/operators');
// var owners      = require('../models/owners');
// var persons     = require('../models/persons');
// var houseStates = require('../models/housestate');
// var worksheets  = require('../models/worksheets');
// var history     = require('../models/history');

// var modelHelper = require('../models/models-helper');
var v1Manager = require('../managers/v1-manager');
var verifyToken = require('../middleware/verify-token');
var verifyNumintecKey = require('../middleware/verify-numintec-key');

router.use(function(req, res, next) {
  //console.log('Something is happening.');
  next();
});

// =================================================================
// set up endpoints
// =================================================================
router.get('/', function(req, res) {
	res.json({ message: 'Welcome to the v1 API!' });
});

router.get('/worksheets/queueitem', verifyToken, function(req, res) {
    v1Manager.getQueueItem(res);
});

router.get('/worksheets/fifo/normal', verifyToken, function(req, res) {
    v1Manager.getQueueItemNormal(res);
});

router.get('/worksheets/fifo/recall', verifyToken, function(req, res) {
    v1Manager.getQueueItemRecall(res);
});

router.get('/worksheets/queueitem2', verifyToken, function(req, res) {
    v1Manager.getQueueItemWithOwners(res);
});

router.get('/worksheets/allqueue', verifyToken, function(req, res) {
    v1Manager.getQueue(res);
});

router.get('/worksheets/history/:worksheetId', verifyToken, function(req, res) {        
    v1Manager.getHistory(res, req.params.worksheetId);
});
router.post('/worksheets/history/', verifyToken, function(req, res) {        
    v1Manager.getHistory(res, req.body.worksheetId);
});

router.get('/worksheets/owner/:name', verifyToken, function(req, res) {        
    v1Manager.getOwnerProperties(res, req.params.name);
});
router.post('/worksheets/owner', verifyToken, function(req, res) {        
    v1Manager.getOwnerProperties(res, req.body.name);
});

router.post('/worksheets/addOwner', verifyToken, function(req, res) {        
    v1Manager.addWorksheetOwner(res, req.body.worksheetId, req.body.owner);
});

router.post('/worksheets/setFifoState', verifyToken, function(req, res) {        
    v1Manager.setFIFOState(res, req.body.worksheetId, req.body.fifo, req.body.state);
});

router.get('/owner/get/:id', verifyToken, function(req, res) {        
    v1Manager.getOwner(res, req.params.id);
});

router.get('/owner/get/:id', verifyToken, function(req, res) {        
    v1Manager.getOwner(res, req.params.id);
});

router.get('/owners/getregistry/:name', verifyToken, function(req, res) {        
    v1Manager.getRegistryOwners(res, req.params.name);
});
router.post('/owners/getregistry/', verifyToken, function(req, res) {        
    v1Manager.getRegistryOwners(res, req.body.name);
});

router.post('/owners/update/', verifyToken, function(req, res) {        
    v1Manager.updateOwner(res, req.body.owner);
});

router.get('/persons/getowners/:name', verifyToken, function(req, res) {        
    v1Manager.getPersonsOwners(res, req.params.name);
});
router.post('/persons/getowners/', verifyToken, function(req, res) {        
    v1Manager.getPersonsOwners(res, req.body.name);
});

router.post('/persons/family/', verifyToken, function(req, res) {        
    v1Manager.getPersonFamily(res, req.body.address, req.body.state, req.body.postalCode);
});

router.post('/persons/brothers/', verifyToken, function(req, res) {        
    v1Manager.getPersonBrothers(res, req.body.surname1, req.body.surname2, req.body.bornYear, req.body.id);
});

router.post('/persons/sons/', verifyToken, function(req, res) {        
    v1Manager.getPersonSons(res, req.body.surname1, req.body.surname1Year, req.body.bornYear);
});

router.post('/persons/house/', verifyToken, function(req, res) {        
    v1Manager.getPersonHouse(res, req.body.address, req.body.postalCode);
});

router.post('/housestate/get/:catastroid', verifyToken, function(req, res) {        
    v1Manager.getHouseState(res, req.body.catastroid);
});

router.post('/history/add/', verifyToken, function(req, res) {        
    v1Manager.addHistory(res, req.body.history);
});

router.post('/history/remove/', verifyToken, function(req, res) {        
    v1Manager.removeHistory(res, req.body.history);
});

router.post('/history/search/', verifyToken, function(req, res) {        
    v1Manager.searchHistory(res, req.body.search);
});

router.post('/operator/register', function(req, res) {
    v1Manager.register(res, req.body.name, req.body.password);
});

router.post('/operator/login', function(req, res) {
    v1Manager.login(res, req.body.name, req.body.password);
});

router.get('/me', verifyToken, function(req, res) {
    v1Manager.me(res, req.userId);
});

router.post('/getData', function(req, res) {
    v1Manager.getData(res, req.body);
});

// router.post('/numintec/call', verifyToken, verifyNumintecKey, function(req, res) {
//     v1Manager.call(res, req.userId, req.client, req.body.from, req.body.to);
// });

router.post('/numintec/call', verifyToken, function(req, res) {
    v1Manager.call(res, req.userId, req.body.from, req.body.to);
});

router.get('/numintec/testcall', verifyToken, function(req, res) {
    v1Manager.testcall(res, req.userId);
});


// =================================================================
// module migration
// =================================================================
module.exports = router;




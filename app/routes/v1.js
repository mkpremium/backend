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

router.get('/worksheets/queueitem', function(req, res) {
    v1Manager.getQueueItem(res);
});

router.get('/worksheets/queueitem2', function(req, res) {
    v1Manager.getQueueItemWithOwners(res);
});

router.get('/worksheets/allqueue', function(req, res) {
    v1Manager.getQueue(res);
});

router.get('/worksheets/history/:worksheetId', function(req, res) {        
    v1Manager.getHistory(res, req.params.worksheetId);
});
router.post('/worksheets/history/', function(req, res) {        
    v1Manager.getHistory(res, req.body.worksheetId);
});

router.get('/worksheets/owner/:name', function(req, res) {        
    v1Manager.getOwnerProperties(res, req.params.name);
});
router.post('/worksheets/owner', function(req, res) {        
    v1Manager.getOwnerProperties(res, req.body.name);
});

router.get('/owner/get/:id', function(req, res) {        
    v1Manager.getOwner(res, req.params.id);
});

router.get('/owner/get/:id', function(req, res) {        
    v1Manager.getOwner(res, req.params.id);
});

router.get('/owners/getregistry/:name', function(req, res) {        
    v1Manager.getRegistryOwners(res, req.params.name);
});
router.post('/owners/getregistry/', function(req, res) {        
    v1Manager.getRegistryOwners(res, req.body.name);
});

router.get('/persons/getowners/:name', function(req, res) {        
    v1Manager.getPersonsOwners(res, req.params.name);
});
router.post('/persons/getowners/', function(req, res) {        
    v1Manager.getPersonsOwners(res, req.body.name);
});

router.post('/persons/family/', function(req, res) {        
    v1Manager.getPersonFamily(res, req.body.address, req.body.state, req.body.postalCode);
});

router.post('/persons/brothers/', function(req, res) {        
    v1Manager.getPersonBrothers(res, req.body.surname1, req.body.surname1, req.body.bornYear, req.body.id);
});

router.post('/persons/sons/', function(req, res) {        
    v1Manager.getPersonSons(res, req.body.surname1, req.body.surname1Year, req.body.bornYear);
});

router.post('/persons/house/', function(req, res) {        
    v1Manager.getPersonHouse(res, req.body.surname1, req.body.surname1Year, req.body.bornYear);
});


router.post('/housestate/get/:catastroid', function(req, res) {        
    v1Manager.getHouseState(res, req.body.catastroid);
});

// =================================================================
// module migration
// =================================================================
module.exports = router;




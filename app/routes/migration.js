var express    = require('express');
var config     = require('../../config');
var router     = express.Router();

var couchbase  = require('couchbase')
var cluster    = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket     = cluster.openBucket(config.bucketName);

var buildings  = require('../models/building');
var operators  = require('../models/operators');
var owners     = require('../models/owners');
var modelHelper = require('../models/models-helper');

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
    
    var N1qlQuery = couchbase.N1qlQuery;
    bucket.query(
        N1qlQuery.fromString('DELETE FROM ' + config.bucketName),
        function (err, rows) {;          
          res.json(rows);
        });

});
// =================================================================
// Migration endpoints: Buildings
// =================================================================

router.get('/buildings', function(req, res) {    
    getList("building", res);
});

router.post('/buildings', function(req, res) {
    var response = importBuilding(req.body, true);
    res.json({response: response, input: req.body, data: data});
});

router.get('/buildings/bulkimport', function(req, res) {    
    bulkImport('EDIFICIOS.csv', 'building', res);
});

// =================================================================
// Migration endpoints: Operators
// =================================================================
router.get('/operators', function(req, res) {
    
    getList("operator", res);

});

router.post('/operators', function(req, res) {
    var response = importOperator(req.body, true);
    res.json({response: response, input: req.body, data: data});
});

router.get('/operators/bulkimport', function(req, res) {    
    bulkImport('OPERADORES.csv', 'operator', res);
});

// =================================================================
// Migration endpoints: Owners
// =================================================================
router.get('/owners', function(req, res) {    
    getList("owner", res);
});

router.post('/owners', function(req, res) {
    
        // assign building data    
        var reqData = modelHelper.toLowerCaseRequest(req.body);
        let inputData = new operators.OperatorInputDTO(reqData);
    
        // return dbObject
        let data = inputData.toDatabase();
        let pk = 'owner:' + data.id;
        
        // insert or update
        var response = upsertToDb(pk, data, true);        
    
        res.json({response: response, input: req.body, data: data});
    
});

router.get('/owners/bulkimport', function(req, res) {    
    bulkImport('PROPIETARIOS.csv', 'owner', res);
});

// =================================================================
// Common functions
// =================================================================
// TODO external function
var upsertToDb = function(pk, data, response) {

    bucket.manager().createPrimaryIndex(function() {
        bucket.upsert(pk, data, function(err, result) {
            if (err) {
                console.log(err);
                throw err;
            }
            if (response) {
                bucket.get(pk, function(err, result) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    //console.log(result.value);
                    return result;
                });
            }
        });
    });
    return;
}

var importBuilding = function(obj, response) {
    let reqData = modelHelper.toLowerCaseRequest(obj);
    let inputData = new buildings.BuildingInputDTO(reqData);
    let data = inputData.toDatabase();
    let pk = 'building:' + data.id;
    return upsertToDb(pk, data, response);
}

var importOperator = function(obj, response) {
    let reqData = modelHelper.toLowerCaseRequest(obj);
    let inputData = new operators.OperatorInputDTO(reqData);
    let data = inputData.toDatabase();
    let pk = 'operator:' + data.id;
    return upsertToDb(pk, data, response);
}

var importOwner = function(obj, response) {
    let reqData = modelHelper.toLowerCaseRequest(obj);
    let inputData = new owners.OwnerInputDTO(reqData);
    let data = inputData.toDatabase();
    let pk = 'owner:' + data.id;
    return upsertToDb(pk, data, response);
}

var getList = function (documentType, res){
    var N1qlQuery = couchbase.N1qlQuery;
    bucket.query(
        N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "' + documentType + '" LIMIT 100'),
        function (err, rows) {;          
          res.json(rows);
        });
}

var bulkImport = function(name, documentType, res) {

    const csv = require('csvtojson');
    const csvFilePath = './app/csv/' + name;

    let count = 0;
    let ok = 0;
    let errors = [];
    csv({
        delimiter:";"
    })
        .fromFile(csvFilePath)
        .on('json',(jsonObj)=>{

            let id = jsonObj[Object.keys(jsonObj)[0]];
            console.log('Importing %s', id);

            count++;
            try {
                if (documentType === 'building') {
                    importBuilding(jsonObj, false);
                    ok++;
                }
                else if (documentType === 'operator') {
                    importOperator(jsonObj, false);
                    ok++;
                }                
                else if (documentType === 'owner') {
                    importOwner(jsonObj, false);
                    ok++;
                }                
            }
            catch (e) {
                console.log(e);
                errors.push(id);
            }
        })
        .on('done',(error)=>{
            if (error){
                console.log('error', error);
            }                
            else {
                console.log('end');
            }
            res.json({ done: true, count: count, ok: ok, errors: errors});
        })
}

// =================================================================
// module migration
// =================================================================
module.exports = router;




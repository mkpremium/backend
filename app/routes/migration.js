var express     = require('express');
var config      = require('../../config');
var router      = express.Router();
 
var couchbase   = require('couchbase')
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
    var response = importOwner(req.body, true);
    res.json({response: response, input: req.body, data: data});    
});

router.get('/owners/bulkimport', function(req, res) {    
    bulkImport('PROPIETARIOS.csv', 'owner', res);
});

// =================================================================
// Migration endpoints: persons
// =================================================================
router.get('/persons', function(req, res) {    
    getList("person", res);
});

router.post('/persons', function(req, res) {
    var response = importPerson(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/persons/bulkimport', function(req, res) {    
    bulkImport('PERSONAS.csv', 'person', res);
});

// =================================================================
// Migration endpoints: houseState
// =================================================================
router.get('/housestates', function(req, res) {    
    getList("housestate", res);
});

router.post('/housestates', function(req, res) {
    var response = importHouseState(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/housestates/bulkimport', function(req, res) {    
    bulkImport('SITARR.csv', 'housestate', res);
});

// =================================================================
// Migration endpoints: worksheet
// =================================================================
router.get('/worksheets', function(req, res) {    
    getList("worksheet", res);
});

router.post('/worksheets', function(req, res) {
    var response = importWorkSheet(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/worksheets/bulkimport', function(req, res) {    
    bulkImport('LLAMADAS.csv', 'worksheet', res);
});

// =================================================================
// Migration endpoints: history
// =================================================================
router.get('/history', function(req, res) {    
    getList("history", res);
});

router.post('/history', function(req, res) {
    var response = importHistory(req.body, true);
    res.json({response: response, input: req.body, data: data});
    
});

router.get('/history/bulkimport', function(req, res) {    
    bulkImport('HISTORIAL.csv', 'history', res);
});

// =================================================================
// Migration endpoints: other
// =================================================================

router.get('/other', function(req, res) {    
    
    upsertToDb('department:2', { _documentType: 'department', id: '2', description: 'Nota' }, false);
    upsertToDb('department:3', { _documentType: 'department', id: '3', description: 'Visita' }, false);
    upsertToDb('department:4', { _documentType: 'department', id: '4', description: 'Reunión' }, false);
    upsertToDb('department:5', { _documentType: 'department', id: '5', description: 'Reserva / Arras' }, false);
    upsertToDb('department:11', { _documentType: 'department', id: '11', description: 'Nuevo Contacto' }, false);
    upsertToDb('department:12', { _documentType: 'department', id: '12', description: 'Llamada' }, false);
    upsertToDb('department:13', { _documentType: 'department', id: '13', description: 'Rellamada' }, false);
    upsertToDb('department:14', { _documentType: 'department', id: '14', description: 'Teléfono	Erróneo' }, false);
    upsertToDb('department:15', { _documentType: 'department', id: '15', description: 'Nota	Rellamada' }, false);
    upsertToDb('department:16', { _documentType: 'department', id: '16', description: 'No Vende' }, false);
    upsertToDb('department:17', { _documentType: 'department', id: '17', description: 'Ya Vendido' }, false);

    upsertToDb('negotation:1', { _documentType: 'negotation', id: '1', description: 'EN CARTERA', color: 'Lime', timestamp: '0x0000000000968F65' }, false);
    upsertToDb('negotation:2', { _documentType: 'negotation', id: '2', description: 'NO INTERESA', color: 'Red', timestamp: '0x00000000008F987E' }, false);
    upsertToDb('negotation:3', { _documentType: 'negotation', id: '3', description: 'EN SEGUIMIENTO', color: 'YellowGreen', timestamp: '0x000000000094B2C6' }, false);
    upsertToDb('negotation:4', { _documentType: 'negotation', id: '4', description: 'COMPRADO', color: 'Magenta', timestamp: '0x000000000094B2C7' }, false);

    upsertToDb('error:11', { _documentType: 'error', id: '11', description: 'FALLECIDO', type: 'PROPRIETARI', timestamp: '0x000000001F776E59' }, false);
    upsertToDb('error:12', { _documentType: 'error', id: '12', description: 'DETERIORADO', type: 'EDIFICIO', timestamp: '0x000000001F776E5A' }, false);
    upsertToDb('error:13', { _documentType: 'error', id: '13', description: 'FALLECIDO', type: 'EDIFICIO', timestamp: '0x000000001F776E5B' }, false);
    upsertToDb('error:15', { _documentType: 'error', id: '15', description: 'NINGUNO', type: 'EDIFICIO', timestamp: '0x000000001F776E5C' }, false);
    upsertToDb('error:18', { _documentType: 'error', id: '18', description: 'NO VENDE', type: 'WEB', timestamp: '0x000000001F776E5D' }, false);
    upsertToDb('error:19', { _documentType: 'error', id: '19', description: 'VISITA', type: 'WEB', timestamp: '0x000000001F776E5E' }, false);
    upsertToDb('error:21', { _documentType: 'error', id: '21', description: 'SEGUIR', type: 'WEB', timestamp: '0x000000001F776E5F' }, false);
    upsertToDb('error:22', { _documentType: 'error', id: '22', description: 'NO SEGUIR', type: 'WEB', timestamp: '0x000000001F776E60' }, false);
    upsertToDb('error:31', { _documentType: 'error', id: '31', description: 'MAL ESTADO', type: 'INFORMADORES', timestamp: '0x000000001F776E61' }, false);
    upsertToDb('error:32', { _documentType: 'error', id: '32', description: 'SOLAR', type: 'INFORMADORES', timestamp: '0x000000001F776E62' }, false);
    upsertToDb('error:33', { _documentType: 'error', id: '33', description: 'ENTE PUBLICO', type: 'INFORMADORES', timestamp: '0x000000001F776E63' }, false);
    upsertToDb('error:42', { _documentType: 'error', id: '42', description: 'NO HAY DATOS', type: 'INFORMADORES!', timestamp: '0x000000001F776E64' }, false);
    upsertToDb('error:44', { _documentType: 'error', id: '44', description: 'HOTELES', type: 'INFORMADORES', timestamp: '0x000000001F776E65' }, false);
    upsertToDb('error:45', { _documentType: 'error', id: '45', description: 'NAVES INDUSTRIALES', type: 'INFORMADORES', timestamp: '0x000000001F776E66' }, false);
    upsertToDb('error:47', { _documentType: 'error', id: '47', description: 'SIN INCIDENCIA', type: 'INFORMADORES!', timestamp: '0x0000000024DF4FFA' }, false);
    upsertToDb('error:48', { _documentType: 'error', id: '48', description: 'HORIZONTALES', type: 'INFORMADORES', timestamp: '0x0000000024DF5010' }, false);
    upsertToDb('error:49', { _documentType: 'error', id: '49', description: 'UNIFAMILIARES', type: 'INFORMADORES', timestamp: '0x0000000024DF5011' }, false);
    
    upsertToDb('servicetype:10', { _documentType: 'servicetype', id: '10', description: 'INICIO', timestamp: ' 0x0000000001BD1333' }, false);
    upsertToDb('servicetype:15', { _documentType: 'servicetype', id: '15', description: '', timestamp: ' 0x0000000001C69693' }, false);
    upsertToDb('servicetype:16', { _documentType: 'servicetype', id: '16', description: 'PROP. ENVIADA', timestamp: ' 0x0000000001C6974B' }, false);
    upsertToDb('servicetype:17', { _documentType: 'servicetype', id: '17', description: 'PROP. RECHAZADA', timestamp: ' 0x00000000436BDE52' }, false);
    upsertToDb('servicetype:18', { _documentType: 'servicetype', id: '18', description: 'VENDIDO', timestamp: ' 0x0000000001EC9949' }, false);
    upsertToDb('servicetype:19', { _documentType: 'servicetype', id: '19', description: 'DESCARTADO', timestamp: ' 0x0000000001C6973B' }, false);
    upsertToDb('servicetype:21', { _documentType: 'servicetype', id: '21', description: 'NO VENDE', timestamp: ' 0x0000000001EC9963' }, false);
    upsertToDb('servicetype:22', { _documentType: 'servicetype', id: '22', description: 'PROP. ACEPTADA', timestamp: ' 0x0000000001F18564' }, false);
    upsertToDb('servicetype:24', { _documentType: 'servicetype', id: '24', description: 'COMPRADO', timestamp: ' 0x0000000003E44554' }, false);
    upsertToDb('servicetype:25', { _documentType: 'servicetype', id: '25', description: 'PARA INTERMEDIACIÓN', timestamp: ' 0x0000000041C2EC21' }, false);
    upsertToDb('servicetype:26', { _documentType: 'servicetype', id: '26', description: 'INTERMEDIACIÓN', timestamp: ' 0x0000000041C2EC22' }, false);
    upsertToDb('servicetype:27', { _documentType: 'servicetype', id: '27', description: 'INTERMEDIATO', timestamp: ' 0x0000000041C4375F' }, false);

    upsertToDb('ccbfis:1', { _documentType: 'ccbfis', id: '1', ccb: 'ADMINFINCAS', fis: '' }, false);
    upsertToDb('ccbfis:2', { _documentType: 'ccbfis', id: '2', ccb: 'CONTACTO', fis: ' PRINCIPAL' }, false);
    upsertToDb('ccbfis:3', { _documentType: 'ccbfis', id: '3', ccb: 'FAMILIARES', fis: ' PRINCIPAL' }, false);
    upsertToDb('ccbfis:4', { _documentType: 'ccbfis', id: '4', ccb: 'FAMILIARES', fis: ' SECONDARY' }, false);
    upsertToDb('ccbfis:5', { _documentType: 'ccbfis', id: '5', ccb: 'FAMILIARES', fis: ' VICINOS' }, false);
    

    upsertToDb('situation:2', { _documentType: 'situation', id: '2', description: 'VACIO', color: 'WhiteSmoke' }, false);
    upsertToDb('situation:4', { _documentType: 'situation', id: '4', description: 'INDEFINIDO', color: 'Red' }, false);
    upsertToDb('situation:5', { _documentType: 'situation', id: '5', description: 'A TERMINO', color: 'LightSalmon' }, false);
    upsertToDb('situation:6', { _documentType: 'situation', id: '6', description: 'OKUPAS', color: 'Magenta' }, false);

    res.json({done: true});
    
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
    let inputData = new buildings.BuildingInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'building:' + data.id;
    return upsertToDb(pk, data, response);
}

var importOperator = function(obj, response) {
    let inputData = new operators.OperatorInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'operator:' + data.id;
    return upsertToDb(pk, data, response);
}

var importOwner = function(obj, response) {
    let inputData = new owners.OwnerInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'owner:' + data.id;
    return upsertToDb(pk, data, response);
}

var importPerson = function(obj, response) {
    let inputData = new persons.PersonInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'person:' + data.id;
    return upsertToDb(pk, data, response);
}

var importHouseState = function(obj, response) {
    let inputData = new houseStates.HouseStateInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'housestate:' + data.id;
    return upsertToDb(pk, data, response);
}

var importWorkSheet = function(obj, response) {
    let inputData = new worksheets.WorkSheetInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'worksheet:' + data.id;
    return upsertToDb(pk, data, response);
}

var importHistory = function(obj, response) {
    let inputData = new history.HistoryInputDTO(modelHelper.toLowerCaseRequest(obj));
    let data = inputData.toDatabase();
    let pk = 'history:' + data.id;
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
                else if (documentType === 'person') {
                    importPerson(jsonObj, false);
                    ok++;
                }
                else if (documentType === 'housestate') {
                    importHouseState(jsonObj, false);
                    ok++;
                }
                else if (documentType === 'worksheet') {
                    importWorkSheet(jsonObj, false);
                    ok++;
                }                
                else if (documentType === 'history') {
                    importHistory(jsonObj, false);
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
            res.json({count: count, ok: ok, errors: errors});
        })
}

// =================================================================
// module migration
// =================================================================
module.exports = router;




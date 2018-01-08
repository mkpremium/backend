var config      = require('../../config');
var couchbase   = require('couchbase');
var request     = require('request');
var xmldoc      = require('xmldoc');
var utmObj      = require('utm-latlng');
var Excel       = require('exceljs');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);

var modelHelper = require('../models/models-helper');
var buildings   = require('../models/building');
var operators   = require('../models/operators');
var owners      = require('../models/owners');
var persons     = require('../models/persons');
var houseStates = require('../models/housestate');
var worksheets  = require('../models/worksheets');
var history     = require('../models/history');
var bank        = require('../models/bank');
var bankOperation = require('../models/bankOperation');
var bankBuilding = require('../models/bankBuilding');
var uuid        = require('uuid');
var bankBuildings = {};

var migrationManager = {

    getList: function (documentType, res){
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "' + documentType + '" LIMIT 100'),
            function (err, rows) {
              res.json(rows);
            });
    },


    upsertToDb: function(pk, data, response) {
        
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
    },

    importBuilding: function(obj, response) {
        let inputData = new buildings.BuildingInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'building:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importOperator: function(obj, response) {
        let inputData = new operators.OperatorInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'operator:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importOwner: function(obj, response) {
        let inputData = new owners.OwnerInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'owner:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importPerson: function(obj, response) {
        let inputData = new persons.PersonInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'person:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importHouseState: function(obj, response) {
        let inputData = new houseStates.HouseStateInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'housestate:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importWorkSheet: function(obj, response) {
        let inputData = new worksheets.WorkSheetInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'worksheet:' + data.id;
        return this.upsertToDb(pk, data, response);
    },
    
    importHistory: function(obj, response) {
        let inputData = new history.HistoryInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'history:' + data.id;
        return this.upsertToDb(pk, data, response);
    },

    importTempBankUpdate: function(obj, response) {
        let inputData = new bank.BankInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'tempBankUpdate:' + data.id;
        this.upsertToDb('indexGeneratorForBankBuilding', 0, response);
        return this.upsertToDb(pk, data, response);
    },

    createBankOperation: function(obj, response) {
        let inputData = new bankOperation.BankOperationInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'bankOperation:' + data.operationId;
        return this.upsertToDb(pk, data, response);
    },

    createBankBuilding: function(obj, response) {
        let inputData = new bankBuilding.BankBuildingInputDTO(modelHelper.toLowerCaseRequest(obj));
        let data = inputData.toDatabase();
        let pk = 'bankBuilding:' + data.buildingId;
        return this.upsertToDb(pk, data, response);
    },

    bulkImport: function(name, documentType, res) {
    
        //console.log('IMPORT - ' + documentType);

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
                console.log('Importing %s %s', documentType, id);
    
                count++;
                try {
                    if (documentType === 'building') {
                        this.importBuilding(jsonObj, false);
                        ok++;
                    }
                    else if (documentType === 'operator') {
                        this.importOperator(jsonObj, false);
                        ok++;
                    }                
                    else if (documentType === 'owner') {
                        this.importOwner(jsonObj, false);
                        ok++;
                    }
                    else if (documentType === 'person') {
                        this.importPerson(jsonObj, false);
                        ok++;
                    }
                    else if (documentType === 'housestate') {
                        this.importHouseState(jsonObj, false);
                        ok++;
                    }
                    else if (documentType === 'worksheet') {
                        this.importWorkSheet(jsonObj, false);
                        ok++;
                    }                
                    else if (documentType === 'history') {
                        this.importHistory(jsonObj, false);
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

                if (res) {
                    res.json({count: count, ok: ok, errors: errors});
                }                
            })
    },

    importBanks: function (name, documentType, userId, res) {

        var guid = uuid.v4();
        const csv = require('csvtojson');
        const csvFilePath = './app/csv/' + name;

        let success = false;
        let errors = [];
        let data = {};
        let checkFormedCSV = false;
        let checkResult = false;
        let inputBuildings = [];
        let inputData = {
            ticketId: guid,
            userId: userId,
            timestamp: Date.now()
        };

        csv({
            delimiter: ","
        })
        .fromFile(csvFilePath)
        .on('json', (jsonObj) => {
            let bankFields = bank.BankDTO.BANK_FIELDS;

            if (checkFormedCSV == false) {
                checkFormedCSV = true;
                let fields = Object.keys(jsonObj);
                checkResult = modelHelper.checkCSVFormed(fields, bankFields);
            }

            if (checkResult == true) {
                jsonObj = modelHelper.toLowerCaseRequest(jsonObj);
                jsonObj['id'] = jsonObj.catastro;
                inputBuildings.push(jsonObj);
            } else {
                var message = "Columns in CSV file aren't formed with list columns: " + bankFields.join(", ");
                if (errors.indexOf(message) < 0) {
                    errors.push(message);
                }
            }
        })
        .on('done', (error) => {
            if (error) {
                console.log('error', error);
            }
            else {
                try {
                    if (errors.length == 0) {
                        inputData.buildings = inputBuildings;

                        console.log('Importing %s %s', documentType, inputData.ticketId);

                        this.importTempBankUpdate(inputData, false);

                        success = true;
                        var news = [];
                        var updated = [];
                        var not_available = [];
                        var tempBankUpdateData = [];
                        var bankBuildingData = [];

                        var N1qlQuery = couchbase.N1qlQuery;
                        bucket.query(
                            N1qlQuery.fromString('SELECT t.buildingId, t.processTimestamp FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding"'),
                            function (err, rows) {
                                var days;
                                var now = Date.now();
                                var expectedTimeOutdated = 0;

                                for (var i = 0; i < rows.length; i++) {
                                    bankBuildingData.push(rows[i]['buildingId']);

                                    days = (now - rows[i]['processTimestamp']) / 86400000;
                                    if (days > 30) { //not processed 1 month ago
                                        expectedTimeOutdated++;
                                    }
                                }

                                bucket.query(
                                    N1qlQuery.fromString('SELECT t.buildings FROM ' + config.bucketName + ' t WHERE t._documentType = "tempBankUpdate" AND t.id = "' + inputData.ticketId + '"'),
                                    function (err, rows) {
                                        if (rows.length > 0) {
                                            var item = rows[0]['buildings'];
                                            for (var i = 0; i < item.length; i++) {
                                                tempBankUpdateData.push(item[i]['id']);
                                            }

                                            for(var i = 0; i < tempBankUpdateData.length; i++) {
                                                if (bankBuildingData.indexOf(tempBankUpdateData[i]) >= 0) {
                                                    updated.push({'id' : tempBankUpdateData[i]});
                                                } else {
                                                    news.push({'id' : tempBankUpdateData[i]});
                                                }
                                            }

                                            for(var i = 0; i < bankBuildingData.length; i++) {
                                                if (tempBankUpdateData.indexOf(bankBuildingData[i]) < 0) {
                                                    not_available.push({'id' : bankBuildingData[i]});
                                                }
                                            }
                                        }

                                        var buildings = {
                                            'new': news,
                                            'updated': updated,
                                            'not_available': not_available
                                        };

                                        data = {
                                            operation: 'checked',
                                            ticketId: inputData.ticketId,
                                            buildings: buildings,
                                            expectedTimeNew: news.length,
                                            expectedTimeOutdated: expectedTimeOutdated
                                        };

                                        if (res) {
                                            res.json({
                                                success: success,
                                                error: errors,
                                                data: data
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    } else {
                        if (res) {
                            res.json({
                                success: success,
                                error: errors,
                                data: data
                            });
                        }
                    }
                }
                catch (e) {
                    errors.push(e);
                    if (res) {
                        res.json({
                            success: success,
                            error: errors,
                            data: data
                        });
                    }
                }
            }
        })
    },

    confirmUpload: function (ticketId, processOutdated, documentType, userId, res) {

        const csv = require('csvtojson');
        const csvFilePath = './app/csv/BRUTO 4 COMUNIDADES.csv';

        let success = false;
        let errors = [];
        let data = {};

        let inputBuildings = [];
        let inputOperationData = {
            operationId: uuid.v4(),
            timestamp: Date.now(),
            operation: 'import',
            processed: false
        };

        var current_timestamp = Date.now();

        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.userId, t.timestamp, t.buildings FROM ' + config.bucketName + ' t WHERE t._documentType = "tempBankUpdate" AND ticketId = "' + ticketId + '"'),
            (function (err, rows) {
                if (rows.length > 0) {
                    if (rows[0]['userId'] == userId) {
                        var allowDays = 1;
                        var now = Date.now();
                        var days = (now - rows[0]['timestamp']) / 86400000;
                        if (days <= allowDays) {
                            success = true;
                            var buildings = rows[0].buildings;
                            var csvBuildingData = [];

                            csv({
                                delimiter: ","
                            })
                            .fromFile(csvFilePath)
                            .on('json', (jsonObj) => {
                                jsonObj = modelHelper.toLowerCaseRequest(jsonObj);
                                csvBuildingData.push(jsonObj.catastro);
                            })
                            .on('done', (error) => {
                                if (error) {
                                    console.log('error', error);
                                }
                                else {
                                    for(var i = 0; i < buildings.length; i++) {
                                        inputBuildings.push({buildingId: buildings[i]['id']});

                                        let inputBuildingData = {
                                            id: uuid.v4(),
                                            workflow: {
                                                1: {'operation': 'buy', 'state': '', 'timestamp': current_timestamp},
                                                2: {'operation': 'bought', 'state': '', 'timestamp': current_timestamp},
                                                3: {'operation': 'sell', 'state': '', 'timestamp': current_timestamp},
                                                4: {'operation': 'sold', 'state': '', 'timestamp': current_timestamp}
                                            }
                                        };

                                        var key;
                                        var value;
                                        var buildingFields = Object.keys(buildings[i]);
                                        for(var j = 0; j < buildingFields.length; j++) {
                                            value = buildings[i][buildingFields[j]];

                                            if (buildingFields[j] == 'id') {
                                                key = 'buildingId';
                                                if (csvBuildingData.indexOf(value) < 0) {
                                                    inputBuildingData['available'] = false;
                                                } else {
                                                    inputBuildingData['available'] = true;
                                                }
                                            } else {
                                                key = buildingFields[j];
                                            }

                                            if (value.trim() != '' && bankBuilding.BankBuildingDTO.NUMBER_FIELDS.indexOf(key) >= 0) {
                                                value = parseFloat(value);
                                            }
                                            inputBuildingData[key] =  value;
                                        }

                                        //Set value for priceBuy and processTimestamp
                                        inputBuildingData['priceBuy'] = parseFloat(inputBuildingData['precio_web']) * 0.6;
                                        inputBuildingData['processTimestamp'] = Date.now();

                                        bankBuildings[inputBuildingData['buildingId']] = inputBuildingData;

                                        this.getInfoCatastro(inputBuildingData['buildingId'], (function (catastroObj) {
                                            var SRS = bankBuilding.BankBuildingDTO.SRS[catastroObj['srs']];
                                            var zoneNum = bankBuilding.BankBuildingDTO.ZONE_NUM[catastroObj['srs']];
                                            var utm = new utmObj(SRS);
                                            var latLongObj = utm.convertUtmToLatLng(catastroObj['xcen'], catastroObj['ycen'], zoneNum, 'N');

                                            bankBuildings[catastroObj['buildingId']]['latitude'] = latLongObj['lat'];
                                            bankBuildings[catastroObj['buildingId']]['longitude'] = latLongObj['lng'];

                                            this.getSearchListings(catastroObj['buildingId'], latLongObj['lat'], latLongObj['lng'], 1, '', 10, function (result) {
                                                bankBuildings[result['buildingId']]['priceMetersZone'] = result['avg'];
                                            });

                                            this.getSearchListings(catastroObj['buildingId'], latLongObj['lat'], latLongObj['lng'], '', inputBuildingData['comunidad'], 50, function (result) {
                                                bankBuildings[result['buildingId']]['priceMetersLocation'] = result['avg'];
                                            });
                                        }).bind(this));
                                    }

                                    var index = 0;
                                    this.getIndexForBankBuilding(function (result) {
                                        index = result + 1;
                                    });

                                    var returned = false;
                                    var expectedTimeOutdated = 0;
                                    if (processOutdated == "true") {
                                        N1qlQuery = couchbase.N1qlQuery;
                                        bucket.query(
                                            N1qlQuery.fromString('SELECT t.processTimestamp FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding"'),
                                            function (err, rows) {
                                                if (rows.length > 0) {
                                                    var now = Date.now();
                                                    for (var i = 0; i < rows.length; i++) {
                                                        var days = (now - rows[i]['processTimestamp']) / 86400000;
                                                        if (days > 30) { //not processed 1 month ago
                                                            expectedTimeOutdated++;
                                                        }
                                                    }
                                                }

                                                returned = true;
                                            });
                                    }

                                    var createBankBuilding = (function () {
                                        setTimeout((function () {
                                            var done = true;
                                            var bankBuilding;
                                            var buildingFields = Object.keys(bankBuildings);

                                            for(var j = 0; j < buildingFields.length; j++) {
                                                bankBuilding = bankBuildings[buildingFields[j]];
                                                if (bankBuilding['latitude'] == undefined || bankBuilding['longitude'] == undefined
                                                    || bankBuilding['priceMetersZone'] == undefined || bankBuilding['priceMetersLocation'] == undefined || index == 0){
                                                    done = false;
                                                    break;
                                                }
                                            }

                                            if ((processOutdated == undefined || processOutdated == "false" || returned == true) && done == true) {
                                                for(var j = 0; j < buildingFields.length; j++) {
                                                    bankBuilding = bankBuildings[buildingFields[j]];

                                                    bankBuilding['index'] = index++;
                                                    bankBuilding['priceZone'] = bankBuilding['priceMetersZone'] * parseFloat(bankBuilding['cp']);
                                                    bankBuilding['priceLocation'] = bankBuilding['priceMetersLocation'] * parseFloat(bankBuilding['cp']);
                                                    bankBuilding['priceSell'] = bankBuilding['priceZone'] * parseFloat(bankBuilding['sup_construida']) * 0.75;

                                                    //Set false for buy operation
                                                    var pisoArr = ['-1', '-2', '0', '00', 'BAJ', 'BAJA', 'BAJO', 'BAJOS', 'BJ', 'BJ-1', 'BX', 'PB', 'S1', 'SO', 'SOT', 'SM', 'SMS'];
                                                    var cituacionArr = ['OBRA NUEVA EN CURSO. TERMINADA FISICAMENTE PERO NO REGISTRALMENTE', 'OBRA NUEVA EN CURSO. NO TERMINADA FISICAMENTE', 'ACTIVO EN RUINA', 'PROINDIVISO'];

                                                    if (bankBuilding['available'] == true
                                                        && (bankBuilding['tipo1'] != 'VIVIENDA')
                                                        && (bankBuilding['tipo2'] == 'PISO' && pisoArr.indexOf(bankBuilding['piso']) >= 0)
                                                        && (cituacionArr.indexOf(bankBuilding['cituacion']) >= 0)
                                                        && (bankBuilding['priceZone'] < bankBuilding['priceLocation'])
                                                        && ((bankBuilding['priceSell'] - bankBuilding['priceBuy']) / bankBuilding['priceBuy'] < 1)
                                                        && (bankBuilding['priceSell'] - bankBuilding['priceBuy'] < 40000)
                                                        && (bankBuilding['priceBuy'] < bankBuilding['priceMetersZone'] * 26)) {

                                                        bankBuilding['workflow'][1]['state'] = false;

                                                    }

                                                    console.log('Creating bankBuilding: %s', bankBuilding['buildingId']);
                                                    //Create bank building document
                                                    this.createBankBuilding(bankBuilding, false);
                                                }

                                                inputOperationData['processed'] = true;
                                                //Update processed to true of bank operation document
                                                this.createBankOperation(inputOperationData, false);

                                                //Update index
                                                this.upsertToDb('indexGeneratorForBankBuilding', index - 1, false);
                                                console.log('DONE');
                                            } else {
                                                createBankBuilding();
                                            }
                                        }).bind(this), 1000);
                                    }).bind(this);

                                    createBankBuilding();

                                    inputOperationData.buildings = inputBuildings;

                                    console.log('Creating bankOperation: %s', inputOperationData.operationId);

                                    //Create bank operation document
                                    this.createBankOperation(inputOperationData, false);

                                    //Handle response
                                    var news = [];
                                    var updated = [];
                                    var not_available = [];
                                    var tempBankUpdateData = [];
                                    var bankBuildingData = [];

                                    var N1qlQuery = couchbase.N1qlQuery;
                                    bucket.query(
                                        N1qlQuery.fromString('SELECT t.buildingId FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding"'),
                                        function (err, rows) {
                                            for (var i = 0; i < rows.length; i++) {
                                                bankBuildingData.push(rows[i]['buildingId']);
                                            }

                                            bucket.query(
                                                N1qlQuery.fromString('SELECT t.buildings FROM ' + config.bucketName + ' t WHERE t._documentType = "tempBankUpdate" AND t.id = "' + ticketId + '"'),
                                                function (err, rows) {
                                                    if (rows.length > 0) {
                                                        var item = rows[0]['buildings'];
                                                        for (var i = 0; i < item.length; i++) {
                                                            tempBankUpdateData.push(item[i]['id']);
                                                        }

                                                        for(var i = 0; i < tempBankUpdateData.length; i++) {
                                                            if (bankBuildingData.indexOf(tempBankUpdateData[i]) >= 0) {
                                                                updated.push({'id' : tempBankUpdateData[i]});
                                                            } else {
                                                                news.push({'id' : tempBankUpdateData[i]});
                                                            }
                                                        }

                                                        for(var i = 0; i < bankBuildingData.length; i++) {
                                                            if (tempBankUpdateData.indexOf(bankBuildingData[i]) < 0) {
                                                                not_available.push({'id' : bankBuildingData[i]});
                                                            }
                                                        }
                                                    }

                                                    var buildings = {
                                                        'new': news,
                                                        'updated': updated,
                                                        'not_available': not_available
                                                    };

                                                    var returnResponse = function () {
                                                        setTimeout(function () {
                                                            if (processOutdated == undefined || processOutdated == "false" || returned == true) {
                                                                data = {
                                                                    operation: 'upload',
                                                                    buildings: buildings,
                                                                    expectedTimeNew: news.length,
                                                                    expectedTimeOutdated: expectedTimeOutdated
                                                                };

                                                                if (res) {
                                                                    res.json({
                                                                        success: success,
                                                                        error: errors,
                                                                        data: data
                                                                    });
                                                                }
                                                            } else {
                                                                returnResponse();
                                                            }
                                                        }, 1000);
                                                    };

                                                    returnResponse();
                                                });
                                        });
                                }
                            });
                        } else {
                            errors.push("The timestamp is older than " + allowDays + " day.");
                        }
                    } else {
                        errors.push("User ID doesn't match with User ID of access token");
                    }
                } else {
                    errors.push("TempBankUpdate document not found with ticket id: " + ticketId);
                }

                if (errors.length > 0 && res) {
                    res.json({
                        success: success,
                        error: errors,
                        data: data
                    });
                }
            }).bind(this)
        );
    },

    deleteAll: function(res) {
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('DELETE FROM ' + config.bucketName),
            function (err, rows) {
              res.json(rows);
            });
    },

    getPendingBankOperations: function (res) {
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankOperation" AND t.processed = false'),
            function (err, rows) {
                res.json(rows);
            });
    },

    getBankBuildings: function (operation, state, from, size, res) {
        var N1qlQuery = couchbase.N1qlQuery;
        var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding"';

        bucket.query(
            N1qlQuery.fromString(queryString),
            function (err, rows) {
                if (rows.length > 0) {
                    var data = [];
                    var result = true;
                    for (var i = 0; i < rows.length; i++) {
                        if (operation != undefined && operation != '') {
                            result = result && modelHelper.searchInObject(rows[i]['workflow'], 'operation', operation);
                        }

                        if (state != undefined && state != '') {
                            result = result && modelHelper.searchInObject(rows[i]['workflow'], 'state', Boolean(state));
                        }

                        if (result == true) {
                            data.push(rows[i]);
                        }
                    }

                    if (from != undefined && size != undefined) {
                        rows = data.slice(from, from + size);
                    } else {
                        rows = data;
                    }
                }

                res.json(rows);
            });
    },

    getBankBuilding: function (index, res) {
        if (index != undefined && index != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankBuilding" AND `index` = ' + index;

            bucket.query(
                N1qlQuery.fromString(queryString),
                function (err, rows) {
                    var data;
                    if (rows != null && rows.length > 0) {
                        data = rows[0];
                    } else {
                        data = 'BankBuilding not found.'
                    }

                    res.json(data);
                });
        } else {
            res.json("Index can not be empty.");
        }
    },

    getNextBankBuilding: function (index, res) {
        if (index != undefined && index != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankBuilding" AND `index` > ' + index + ' ORDER BY `index` ASC LIMIT 1';

            bucket.query(
                N1qlQuery.fromString(queryString),
                function (err, rows) {
                    var data;
                    if (rows != null && rows.length > 0) {
                        data = rows[0];
                    } else {
                        data = 'Next BankBuilding not found.'
                    }

                    res.json(data);
                });
        } else {
            res.json("Index can not be empty.");
        }
    },

    getPreviousBankBuilding: function (index, res) {
        if (index != undefined && index != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankBuilding" AND `index` < ' + index + ' ORDER BY `index` ASC LIMIT 1';

            bucket.query(
                N1qlQuery.fromString(queryString),
                function (err, rows) {
                    var data;
                    if (rows != null && rows.length > 0) {
                        data = rows[0];
                    } else {
                        data = 'Previous BankBuilding not found.'
                    }

                    res.json(data);
                });
        } else {
            res.json("Index can not be empty.");
        }
    },

    setStateBankBuilding: function (index, operation, state, res) {
        if (index != undefined && index != '' && operation != undefined && operation != '' && state != undefined && state != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankBuilding" AND `index` = ' + index;

            bucket.query(
                N1qlQuery.fromString(queryString),
                (function (err, rows) {
                    var data;
                    var success = false;
                    var message;

                    if (rows != null && rows.length > 0) {
                        data = rows[0];

                        var foundFlag = false;
                        var workflowObj;
                        var workflow = data['workflow'];
                        var keys = Object.keys(workflow);
                        for (var i = 0; i < keys.length; i++) {
                            workflowObj = workflow[keys[i]];
                            if (workflowObj['operation'] == operation) {
                                workflowObj['state'] = Boolean(state);
                                workflow[keys[i]] = workflowObj;
                                data['workflow'] = workflow;
                                foundFlag = true;
                                break;
                            }
                        }

                        if (foundFlag == true) {
                            //Update bank building
                            this.createBankBuilding(data, false);

                            success = true;
                            message = 'Set state successfully.';
                        } else {
                            message = 'Operation not found.';
                        }
                    } else {
                        message = 'BankBuilding not found.';
                    }

                    res.json({
                        'success' : success,
                        'message': message
                    });
                }).bind(this));
        } else {
            var message = '';
            if (index == undefined || index == '') {
                message = "Index can not be empty.";
            } else if (operation == undefined || operation == '') {
                message = "Operation can not be empty.";
            } else if (state == undefined || state == '') {
                message = "State is empty.";
            }

            res.json({
                'success' : false,
                'message': message
            });
        }
    },

    setAvailableBankBuilding: function (index, available, res) {
        if (index != undefined && index != '' && available != undefined && available != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankBuilding" AND `index` = ' + index;

            bucket.query(
                N1qlQuery.fromString(queryString),
                (function (err, rows) {
                    var data;
                    var success = false;
                    var message;

                    if (rows != null && rows.length > 0) {
                        data = rows[0];

                        data['available'] = Boolean(available);

                        //Update bank building
                        this.createBankBuilding(data, false);

                        success = true;
                        message = 'Set available successfully.';
                    } else {
                        message = 'BankBuilding not found.';
                    }

                    res.json({
                        'success' : success,
                        'message': message
                    });
                }).bind(this));
        } else {
            var message = '';
            if (index == undefined || index == '') {
                message = "Index can not be empty.";
            } else if (available == undefined || available == '') {
                message = "Operation can not be empty.";
            }

            res.json({
                'success' : false,
                'message': message
            });
        }
    },

    getOperations: function (operation, res) {
        if (operation != undefined && operation != '') {
            var N1qlQuery = couchbase.N1qlQuery;
            var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE _documentType = "bankOperation" AND `operation` = "' + operation + '"';

            bucket.query(
                N1qlQuery.fromString(queryString),
                (function (err, rows) {
                    res.json(rows);
                }).bind(this));
        } else {
            var message = 'Operation can not be empty.';

            res.json({
                'success' : false,
                'message': message
            });
        }
    },

    exportBankBuilding: function (operation, state, name, res) {
        var N1qlQuery = couchbase.N1qlQuery;
        var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding" and t.available = true';

        bucket.query(
            N1qlQuery.fromString(queryString),
            (function (err, rows) {
                if (rows.length > 0) {
                    var excelHeader = bankBuilding.BankBuildingDTO.ExcelHeader;
                    var data = [];
                    data.push(Object.values(excelHeader));
                    var result = true;

                    for (var i = 0; i < rows.length; i++) {
                        if (operation != undefined && operation != '') {
                            result = result && modelHelper.searchInObject(rows[i]['workflow'], 'operation', operation);
                        }

                        if (state != undefined && state != '') {
                            result = result && modelHelper.searchInObject(rows[i]['workflow'], 'state', Boolean(state));
                        }

                        if (result == true) {
                            var item = [];
                            var inputBuildings = [];
                            var value;
                            var keys = Object.keys(excelHeader);
                            for(var j = 0; j < keys.length; j++) {
                                value = rows[i][keys[j]];
                                if (value == undefined) {
                                    value = '';
                                }
                                item.push(value);

                                if (keys[j] == 'buildingId') {
                                    inputBuildings.push({buildingId: value});
                                }
                            }
                            data.push(item);
                        }
                    }

                    this.exportToExcel(name, data, (function () {
                        console.log('Export successfully!');

                        let inputOperationData = {
                            operationId: uuid.v4(),
                            timestamp: Date.now(),
                            operation: 'export',
                            state: {
                                operation: operation,
                                value: state
                            },
                            buildings: inputBuildings
                        };

                        this.createBankOperation(inputOperationData, false);

                        res.json(inputOperationData);
                    }).bind(this));
                }
            }).bind(this));
    },

    importAuxiliar0000: function(res) {
        var N1qlQuery = couchbase.N1qlQuery;

        let sql1 = 'CREATE INDEX `idx_documentType` ON `' + config.bucketName + '`(`_documentType`)';
        let sql2 = 'CREATE INDEX `idx_owner_001` ON `' + config.bucketName + '`(`_documentType`, `mainOwner`.`name`) WHERE `_documentType` = "owner";'
        let sql3 = 'CREATE INDEX `idx_worksheet_001` ON `' + config.bucketName + '`(`_documentType`, `info`.`currentOwner`.`name`, `street`, `number`) WHERE `_documentType` = "worksheet";'
        let sql4 = 'CREATE INDEX `idx_building_001` ON `' + config.bucketName + '`(`_documentType`, `ownerName`, `id`) WHERE `_documentType` = "building";'

        bucket.query(N1qlQuery.fromString(sql1),function (err, result) {
            if (err) {
                console.log(err);                
            }
        });
        bucket.query(N1qlQuery.fromString(sql2),function (err, result) {
            if (err) {
                console.log(err);                
            }
        });
        bucket.query(N1qlQuery.fromString(sql3),function (err, result) {
            if (err) {
                console.log(err);                
            }
        });
        bucket.query(N1qlQuery.fromString(sql4),function (err, result) {
            if (err) {
                console.log(err);                
            }
        });

        if (res) {
            res.json({ok:true});
        }
        
    },

    importAuxiliar0010: function() {

        console.log('IMPORT - AUX 001');

        this.upsertToDb('department:2', { _documentType: 'department', id: '2', description: 'Nota' }, false);
        this.upsertToDb('department:3', { _documentType: 'department', id: '3', description: 'Visita' }, false);
        this.upsertToDb('department:4', { _documentType: 'department', id: '4', description: 'Reunión' }, false);
        this.upsertToDb('department:5', { _documentType: 'department', id: '5', description: 'Reserva / Arras' }, false);
        this.upsertToDb('department:11', { _documentType: 'department', id: '11', description: 'Nuevo Contacto' }, false);
        this.upsertToDb('department:12', { _documentType: 'department', id: '12', description: 'Llamada' }, false);
        this.upsertToDb('department:13', { _documentType: 'department', id: '13', description: 'Rellamada' }, false);
        this.upsertToDb('department:14', { _documentType: 'department', id: '14', description: 'Teléfono Erróneo' }, false);
        this.upsertToDb('department:15', { _documentType: 'department', id: '15', description: 'Nota Rellamada' }, false);
        this.upsertToDb('department:16', { _documentType: 'department', id: '16', description: 'No Vende' }, false);
        this.upsertToDb('department:17', { _documentType: 'department', id: '17', description: 'Ya Vendido' }, false);
    
        this.upsertToDb('negotation:1', { _documentType: 'negotation', id: '1', description: 'EN CARTERA', color: 'Lime', timestamp: '0x0000000000968F65' }, false);
        this.upsertToDb('negotation:2', { _documentType: 'negotation', id: '2', description: 'NO INTERESA', color: 'Red', timestamp: '0x00000000008F987E' }, false);
        this.upsertToDb('negotation:3', { _documentType: 'negotation', id: '3', description: 'EN SEGUIMIENTO', color: 'YellowGreen', timestamp: '0x000000000094B2C6' }, false);
        this.upsertToDb('negotation:4', { _documentType: 'negotation', id: '4', description: 'COMPRADO', color: 'Magenta', timestamp: '0x000000000094B2C7' }, false);
    
        this.upsertToDb('error:11', { _documentType: 'error', id: '11', description: 'FALLECIDO', type: 'PROPRIETARI', timestamp: '0x000000001F776E59' }, false);
        this.upsertToDb('error:12', { _documentType: 'error', id: '12', description: 'DETERIORADO', type: 'EDIFICIO', timestamp: '0x000000001F776E5A' }, false);
        this.upsertToDb('error:13', { _documentType: 'error', id: '13', description: 'FALLECIDO', type: 'EDIFICIO', timestamp: '0x000000001F776E5B' }, false);
        this.upsertToDb('error:15', { _documentType: 'error', id: '15', description: 'NINGUNO', type: 'EDIFICIO', timestamp: '0x000000001F776E5C' }, false);
        this.upsertToDb('error:18', { _documentType: 'error', id: '18', description: 'NO VENDE', type: 'WEB', timestamp: '0x000000001F776E5D' }, false);
        this.upsertToDb('error:19', { _documentType: 'error', id: '19', description: 'VISITA', type: 'WEB', timestamp: '0x000000001F776E5E' }, false);
        this.upsertToDb('error:21', { _documentType: 'error', id: '21', description: 'SEGUIR', type: 'WEB', timestamp: '0x000000001F776E5F' }, false);
        this.upsertToDb('error:22', { _documentType: 'error', id: '22', description: 'NO SEGUIR', type: 'WEB', timestamp: '0x000000001F776E60' }, false);
        this.upsertToDb('error:31', { _documentType: 'error', id: '31', description: 'MAL ESTADO', type: 'INFORMADORES', timestamp: '0x000000001F776E61' }, false);
        this.upsertToDb('error:32', { _documentType: 'error', id: '32', description: 'SOLAR', type: 'INFORMADORES', timestamp: '0x000000001F776E62' }, false);
        this.upsertToDb('error:33', { _documentType: 'error', id: '33', description: 'ENTE PUBLICO', type: 'INFORMADORES', timestamp: '0x000000001F776E63' }, false);
        this.upsertToDb('error:42', { _documentType: 'error', id: '42', description: 'NO HAY DATOS', type: 'INFORMADORES!', timestamp: '0x000000001F776E64' }, false);
        this.upsertToDb('error:44', { _documentType: 'error', id: '44', description: 'HOTELES', type: 'INFORMADORES', timestamp: '0x000000001F776E65' }, false);
        this.upsertToDb('error:45', { _documentType: 'error', id: '45', description: 'NAVES INDUSTRIALES', type: 'INFORMADORES', timestamp: '0x000000001F776E66' }, false);
        this.upsertToDb('error:47', { _documentType: 'error', id: '47', description: 'SIN INCIDENCIA', type: 'INFORMADORES!', timestamp: '0x0000000024DF4FFA' }, false);
        this.upsertToDb('error:48', { _documentType: 'error', id: '48', description: 'HORIZONTALES', type: 'INFORMADORES', timestamp: '0x0000000024DF5010' }, false);
        this.upsertToDb('error:49', { _documentType: 'error', id: '49', description: 'UNIFAMILIARES', type: 'INFORMADORES', timestamp: '0x0000000024DF5011' }, false);

        this.upsertToDb('servicetype:10', { _documentType: 'servicetype', id: '10', description: 'INICIO', timestamp: ' 0x0000000001BD1333' }, false);
        this.upsertToDb('servicetype:15', { _documentType: 'servicetype', id: '15', description: '', timestamp: ' 0x0000000001C69693' }, false);
        this.upsertToDb('servicetype:16', { _documentType: 'servicetype', id: '16', description: 'PROP. ENVIADA', timestamp: ' 0x0000000001C6974B' }, false);
        this.upsertToDb('servicetype:17', { _documentType: 'servicetype', id: '17', description: 'PROP. RECHAZADA', timestamp: ' 0x00000000436BDE52' }, false);
        this.upsertToDb('servicetype:18', { _documentType: 'servicetype', id: '18', description: 'VENDIDO', timestamp: ' 0x0000000001EC9949' }, false);
        this.upsertToDb('servicetype:19', { _documentType: 'servicetype', id: '19', description: 'DESCARTADO', timestamp: ' 0x0000000001C6973B' }, false);
        this.upsertToDb('servicetype:21', { _documentType: 'servicetype', id: '21', description: 'NO VENDE', timestamp: ' 0x0000000001EC9963' }, false);
        this.upsertToDb('servicetype:22', { _documentType: 'servicetype', id: '22', description: 'PROP. ACEPTADA', timestamp: ' 0x0000000001F18564' }, false);
        this.upsertToDb('servicetype:24', { _documentType: 'servicetype', id: '24', description: 'COMPRADO', timestamp: ' 0x0000000003E44554' }, false);
        this.upsertToDb('servicetype:25', { _documentType: 'servicetype', id: '25', description: 'PARA INTERMEDIACIÓN', timestamp: ' 0x0000000041C2EC21' }, false);
        this.upsertToDb('servicetype:26', { _documentType: 'servicetype', id: '26', description: 'INTERMEDIACIÓN', timestamp: ' 0x0000000041C2EC22' }, false);
        this.upsertToDb('servicetype:27', { _documentType: 'servicetype', id: '27', description: 'INTERMEDIATO', timestamp: ' 0x0000000041C4375F' }, false);

        this.upsertToDb('ccbfis:1', { _documentType: 'ccbfis', id: '1', ccb: 'ADMINFINCAS', fis: '' }, false);
        this.upsertToDb('ccbfis:2', { _documentType: 'ccbfis', id: '2', ccb: 'CONTACTO', fis: ' PRINCIPAL' }, false);
        this.upsertToDb('ccbfis:3', { _documentType: 'ccbfis', id: '3', ccb: 'FAMILIARES', fis: ' PRINCIPAL' }, false);
        this.upsertToDb('ccbfis:4', { _documentType: 'ccbfis', id: '4', ccb: 'FAMILIARES', fis: ' SECONDARY' }, false);
        this.upsertToDb('ccbfis:5', { _documentType: 'ccbfis', id: '5', ccb: 'FAMILIARES', fis: ' VECINOS' }, false);

        this.upsertToDb('situation:2', { _documentType: 'situation', id: '2', description: 'VACIO', color: 'WhiteSmoke' }, false);
        this.upsertToDb('situation:4', { _documentType: 'situation', id: '4', description: 'INDEFINIDO', color: 'Red' }, false);
        this.upsertToDb('situation:5', { _documentType: 'situation', id: '5', description: 'A TERMINO', color: 'LightSalmon' }, false);
        this.upsertToDb('situation:6', { _documentType: 'situation', id: '6', description: 'OKUPAS', color: 'Magenta' }, false);

        // TODO 
        // CREATE INDEX documentType_idx ON mkpremium(_documentType);

    },

    // history-worksheet relations
    importAuxiliar0020: function(res){

        console.log('IMPORT - AUX 002');
        let t = this;

        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "history" and worksheetId = "0" and owner is not null'),
            function (err, rows) {;          
    
                if (err) {
                    console.log(err);
                    throw err;
                }

                //console.log(rows);
    
                for(var i = 0; i < rows.length;i++) {                
                    let row = rows[i];
                    let historyId = row['id'];
    
                    let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet"';
    
                    if (row['owner']) {
                        sql += " and info.currentOwner.name = '" + row['owner'] + "'";
                    }
                    if (row['street']) {
                        sql += " and info.street = '" + row['street'] + "'";
                    }
                    if (row['number']) {
                        sql += " and info.`number` = '" + row['number'] + "'";
                    }
                    //console.log('sql', sql);
    
                    let worksheetId = "0";
                    bucket.query(
                        N1qlQuery.fromString(sql),
                        function (err, worksheets) {;
                            if (worksheets && worksheets.length > 0) {
                                //console.log('rows2', rows2[0]['id']);
                                let worksheet = worksheets[0];
                                worksheetId = worksheet['id'];
    
                                if (worksheetId != "0") {
                                    row['worksheetId'] = worksheetId;
                                    //console.log('upsert', 'history:' + historyId, row);
                                    t.upsertToDb('history:' + historyId, row, false);

                                    // update worksheet
                                    if (!worksheet['history']) {
                                        worksheet['history'] = [];
                                    }

                                    if (worksheet.history.indexOf(historyId) <= -1) {
                                        worksheet['history'].push(historyId);
                                        t.upsertToDb('worksheet:' + worksheetId, worksheet, false);
                                    }

                                }
                            }
                            //console.log(rows2);
                    });
                }
    
                if (res) {
                    res.json({done:true});
                }                
    
            });
    },

    // history-worksheet relations, sometimes there are duplicates
    importAuxiliar0021: function(res){
    
            console.log('IMPORT - AUX 002');
            let t = this;
    
            var N1qlQuery = couchbase.N1qlQuery;
            bucket.query(
                N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.history is not null'),
                function (err, worksheets) {;          
        
                    if (err) {
                        console.log(err);
                        throw err;
                    }
    
                    //console.log(rows);
        
                    for(var i = 0; i < worksheets.length;i++) {                
                        let worksheet = worksheets[i];

                        if (worksheet.history && worksheet.history.length > 1) {

                            var uniqueHistory = worksheet.history.filter((v, i, a) => a.indexOf(v) === i);
                            worksheet.history = uniqueHistory;

                            t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
                        }

                    }
        
                    if (res) {
                        res.json({done:true});
                    }                
        
                });
        },


    // TODO External function
    createGuid: function () {  
        function _p8(s) {  
            var p = (Math.random().toString(16)+"000000000").substr(2,8);  
            return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
        }  
        return _p8() + _p8();  
    },

    // history-worksheet (flags)
    importAuxiliar0022: function(res){
    
            console.log('IMPORT - AUX 0022');
            let t = this;
    
            var N1qlQuery = couchbase.N1qlQuery;
            bucket.query(
                N1qlQuery.fromString('SELECT t.id, t.info.flags FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.info.flags is not null'),
                function (err, worksheets) {;          
        
                    if (err) {
                        console.log(err);
                        throw err;
                    }
    
                    //console.log(rows);
        
                    for(var i = 0; i < worksheets.length;i++) {                
                        let worksheet = worksheets[i];

                        for(var j = 0; j < worksheet.flags.length; j++) {                
                            
                            if (worksheet.flags[j].action == "create") {

                                let historyData = {
                                    _documentType: 'history',
                                    id: t.createGuid(),
                                    worksheetId: worksheet.id,                                
                                    // operatorId: data.id_operatore,
                                    // departmentId: data.id_dipartimento,
                                };
                                        
                                if (worksheet.flags[j].operator) {
                                    historyData.operatorId = worksheet.flags[j].operator;
                                }
                                if (worksheet.flags[j].date) {
                                    historyData.tmStmp = worksheet.flags[j].date;
                                }
                                historyData.action = worksheet.flags[j].action;
                                let historyDTO = JSON.parse(JSON.stringify(new history.HistoryDTO(historyData)));                                
                                t.upsertToDb('history:' + historyDTO.id, historyDTO, false);
                            }
                        }
                    }
        
                    if (res) {
                        res.json({done:true});
                    }                
        
                });
        },        

    // history-worksheet relations
    importAuxiliar0030: function(res){

        console.log('IMPORT - AUX 003');
        let t = this;

        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT worksheetId, id FROM ' + config.bucketName + ' t WHERE t._documentType = "history" and worksheetId <> "0" order by worksheetId'),
            function (err, rows) {;              
                //console.log(rows);
    
                if (err) {
                    console.log(err);
                    throw err;
                }

                for(var i = 0; i < rows.length;i++) {                
                    let row = rows[i];

                    bucket.get('worksheet:' + row.worksheetId, function(err, result) {
                        if (err) {
                            console.log(err);
                            //throw err;
                        }
                        else {
                            //console.log(result.value);  
                            let worksheet = result.value;
                            if (!worksheet.history) {
                                worksheet['history'] = [];                                
                            }
                            if (worksheet.history.indexOf(row.id) <= -1) {
                                worksheet.history.push(row.id);
                                t.upsertToDb('worksheet:' + row.worksheetId, worksheet, false);
                            }
                            
                        }                        
                    });    
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });
        
    },

    importAuxiliar0040: function(res) {

        console.log('IMPORT - AUX 004');
        let t = this;

        var N1qlQuery = couchbase.N1qlQuery;        
        bucket.query(
            N1qlQuery.fromString('SELECT t.id, t.description FROM ' + config.bucketName + ' t WHERE t._documentType = "department"'),
            function (err, departments) {;              
                
                //console.log('departments', departments);
                //res.json({done:true});
                if (err) {
                    console.log(err);
                    throw err;
                }
                
                bucket.query(
                    N1qlQuery.fromString('SELECT t.id, t.departmentId FROM ' + config.bucketName + ' t WHERE t._documentType = "history" and departmentId is not null'),
                    function (err, rows) {;              
                        //console.log(rows);
            
                        for(var i = 0; i < rows.length;i++) {                
                            let row = rows[i];
            
                            bucket.get('history:' + row.id, function(err, result) {
                                if (err) {
                                    //console.log(err);
                                    throw err;
                                }
                                else {                                
                                    let history = result.value;
                                    //console.log('history', result.value);  
    
                                    if (departments.find(d=> d.id == row.departmentId)) {                                    
                                        history.department = departments.find(d=> d.id == row.departmentId).description;
                                        t.upsertToDb('history:' + row.id, history, false);
                                    }                                
                                }                        
                            });    
                        }    
            
                        if (res) {
                            res.json({done:true});
                        }
            
                    });
    
            });
    },

    importAuxiliar0050: function(res) {

        console.log('IMPORT - AUX 005');
        let t = this;

        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet"'),
            function (err, rows) {;              
                //console.log(rows);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < rows.length; i++) {                
                    let worksheet = rows[i];
                    worksheet['owners'] = [];
                    let mainOwnerName = worksheet.info.currentOwner.name;

                    // CREATE INDEX IX_owner_002 ON mkpremium(_documentType, mainOwner.name) WHERE _documentType = "owner" 
                    if (worksheet.info && worksheet.info.currentOwner) {
                        let sql = 'SELECT t.id, t.verified, t.name FROM ' + config.bucketName + ' t WHERE t._documentType = "owner" and t.mainOwner.name = "' + mainOwnerName + '"';
                        
                        //console.log(sql);
                        bucket.query(
                            N1qlQuery.fromString(sql),
                            function (err, owners) {;      
    
                                //console.log('owners', owners);
                                if (owners && owners.length > 0) {
                                    for(var j = 0; j < owners.length; j++) {   
                                        let owner = owners[j];                                        
                                        worksheet['owners'].push({ ownerId: owner.id, verified: owner.verified, main: (mainOwnerName == owner.name) });                                                    
                                    }
                                    t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
                                }    
    
                        }); 
    
                    }
                    
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });
    },

    importAuxiliar005ById: function(res, id) {
        
            console.log('IMPORT - AUX 005');
            let t = this;
    
            var N1qlQuery = couchbase.N1qlQuery;
            bucket.query(
                N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" AND id = "' + id + '"'),
                function (err, rows) {;              
                    //console.log(rows);
    
                    if (err) {
                        console.log(err);
                        throw err;
                    }
        
                    for(var i = 0; i < rows.length; i++) {                
                        let worksheet = rows[i];
                        worksheet['owners'] = [];
        
                        if (worksheet.info && worksheet.info.currentOwner) {
                            let sql = 'SELECT t.id, t.mainOwner.name as mainOwnerName, t.verified, t.name FROM ' + config.bucketName + ' t WHERE t._documentType = "owner" and t.mainOwner.name = "' + worksheet.info.currentOwner.name + '"';
                            
                            //console.log(sql);
                            bucket.query(
                                N1qlQuery.fromString(sql),
                                function (err, owners) {;      
        
                                    //console.log('owners', owners);
                                    if (owners && owners.length > 0) {
                                        for(var j = 0; j < owners.length; j++) {   
                                            let owner = owners[j];
                                            // if (!worksheet.owners) {
                                            //     worksheet['owners'] = [];
                                            // }
                                            worksheet['owners'].push({ ownerId: owner.id, verified: owner.verified, main: (owner.mainOwnerName == owner.name) });            
                                            //console.log('worksheet', worksheet);
                                            t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
        
                                        }
                                    }    
        
                            }); 
        
                        }
                        
                    }    
        
                    if (res) {
                        res.json({done:true});
                    }
        
                });
        },
            
    importAuxiliar0060: function(res) {

        console.log('IMPORT - AUX 006');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "owner" and t.mainOwner.name = t.name'),
            function (err, owners) {;              
                //console.log(owners);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                if (owners && owners.length > 0) {
                    for(var i = 0; i < owners.length; i++) {                
                        let owner = owners[i];
        
                        if (owner.mainOwner && owner.mainOwner.name) {
                            bucket.query(
                                N1qlQuery.fromString('SELECT t.id FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.info.currentOwner.name = "' + owner.mainOwner.name + '"'),
                                function (err, worksheets) {;      
            
                                    //console.log('worksheets', worksheets);
                                    if (worksheets && worksheets.length > 0) {
                                        owner['worksheetId'] = worksheets[0].id;
                                        t.upsertToDb('owner:' + owner.id, owner, false);
                                    }    
            
                            }); 
                        }
                        
                    }    
        
                    if (res) {
                        res.json({done:true});
                    }
                }
                
    
            });
    },
    
    importAuxiliar0070: function(res) {

        console.log('IMPORT - AUX 007');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet"'),
            function (err, rows) {;              
                //console.log(rows);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < rows.length; i++) {                
                    let worksheet = rows[i];
                    worksheet['buildings'] = [];

                    if (worksheet.info && worksheet.info.currentOwner) {
                        let sql = 'SELECT t.id FROM ' + config.bucketName + ' t WHERE t._documentType = "building" and t.ownerName = "' + worksheet.info.currentOwner.name + '"';
                        
                        //console.log(sql);
                        bucket.query(
                            N1qlQuery.fromString(sql),
                            function (err, buildings) {;      
    
                                //console.log('owners', owners);
                                if (buildings && buildings.length > 0) {
                                    for(var j = 0; j < buildings.length; j++) {   
                                        let building = buildings[j];                                        
                                        worksheet['buildings'].push(building.id);                                     
                                    }
                                    t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
                                }    
                        }); 
    
                    }
                    
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });
    },

    importAuxiliar0080: function(res) {

        console.log('IMPORT - AUX 008');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "building" AND ownerName is not null'),
            function (err, buildings) {;              
                //console.log(buildings);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < buildings.length;i++) {                
                    let building = buildings[i];
                    building['worksheets'] = [];

                    let sql = 'SELECT t.id FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.info.currentOwner.name = "' + building.ownerName + '"';
                    
                    //console.log(sql);
                    bucket.query(
                        N1qlQuery.fromString(sql),
                        function (err, worksheets) {;      
                            //console.log('owners', owners);
                            if (worksheets && worksheets.length > 0) {
                                for(var j = 0; j < worksheets.length; j++) {   
                                    let worksheet = worksheets[j];                                    
                                    building['worksheets'].push(worksheet.id);            
                                    //console.log('worksheet', worksheet);                                    
                                }
                                t.upsertToDb('building:' + building.id, building, false);
                            }    
                    }); 

                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });

    },

    // create empty array of owners when null
    importAuxiliar0090: function(res) {
        
        console.log('IMPORT - AUX 090');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet"'),
            function (err, worksheets) {;              
                //console.log(buildings);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < worksheets.length;i++) {                
                    let worksheet = worksheets[i];

                    if (!worksheet.owners) {                        
                        worksheet['owners'] = [];
                        t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
                    }
                    
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });
    },

    // create notes documents from history
    importAuxiliar0100: function(res) {
        
        console.log('IMPORT - AUX 100');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "history" AND t.notes is not null'),
            function (err, histories) {;              
                //console.log(buildings);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < histories.length;i++) {                
                    let history = histories[i];

                    let note = {
                        _documentType: "note",
                        id: history.id,
                        note: history.notes,
                        date: history.notesDate,
                        operatorId: history.operatorId,
                        // the fields are needed because, sometimes, worksheetId doesn't match
                        number: history.number,                        
                        owner: history.owner,
                        street: history.street,
                        worksheetId: history.worksheetId,

                    };


                    t.upsertToDb('note:' + history.id, note, false);
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });
    },

    // create fifo data
    importAuxiliar0110: function(res) {
        
        console.log('IMPORT - AUX 110');
        let t = this;
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" order by random()'),
            function (err, worksheets) {;              
                //console.log(buildings);

                if (err) {
                    console.log(err);
                    throw err;
                }
    
                for(var i = 0; i < worksheets.length;i++) {                
                    let worksheet = worksheets[i];


                    if (worksheet.info.flags.filter(f => f.action == 'recall').length > 0) {
                        worksheet.info['fifo'] = 'RECALL';                        
                    }
                    else if (worksheet.info.flags.filter(f => f.action == 'sells' && f.sells == true).length > 0) {
                        worksheet.info['fifo'] = 'SELLS';
                    }
                    else if (worksheet.info.flags.filter(f => f.action == 'visit').length > 0) {
                        worksheet.info['fifo'] = 'VISIT';
                    }
                    else {
                        worksheet.info['fifo'] = 'NORMAL';
                    }

                    if (worksheet.info.date) {
                        worksheet.info['fifoDate'] = worksheet.info.date;
                    }
                    else {
                        worksheet.info['fifoDate'] = (new Date()).toISOString().slice(0,19).replace(/-/g,"");
                    }

                    if (worksheet.info.fifoDate == "") {
                        worksheet.info.fifoDate = (new Date()).toISOString().slice(0,19).replace(/-/g,"");
                    }                    

                    t.upsertToDb('worksheet:' + worksheet.id, worksheet, false);
                }    
    
                if (res) {
                    res.json({done:true});
                }
    
            });

    },

    getInfoCatastro: function (catastro, callback) {
        var params = {
            'Provincia': '',
            'Municipio': '',
            'SRS': '',
            'RC': catastro.substr(0, 14)
        };
        var url = 'https://ovc.catastro.meh.es/ovcservweb/ovcswlocalizacionrc/ovccoordenadas.asmx/Consulta_CPMRC';
        var options = {
            "method": "GET",
            "rejectUnauthorized": false,
            "url": url,
            'qs': params,
            "headers": {"Content-Type": "text/xml"}
        };

        request(options, (function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var document = new xmldoc.XmlDocument(body);
                var catastroObj = {
                    'buildingId': catastro,
                    'xcen': document.valueWithPath("coordenadas.coord.geo.xcen"),
                    'ycen': document.valueWithPath("coordenadas.coord.geo.ycen"),
                    'srs': document.valueWithPath("coordenadas.coord.geo.srs")
                };
                callback(catastroObj);
            }
        }).bind(catastro));
    },

    getSearchListings: function (buildingId, lat, lng, km, place_name, max_result, callback) {
        var radius = lat + ',' + lng;
        if (km != '') {
            radius += ',' + km + 'km';
        }
        var params = {
            'action': 'search_listings',
            'encoding': 'json',
            'pretty': 1,
            'number_of_results': max_result,
            'listing_type': 'buy',
            'bedroom_min': '',
            'bedroom_max': '',
            'size_min': '',
            'size_max': '',
            'price_max': '',
            'price_min': '',
            'property_type': 'flat',
            'radius': radius,
            'page': 1,
            'has_photo': 0,
            'keywords': '',
            '_': Date.now()
        };

        if (place_name != '') {
            params['place_name'] = place_name;
        }

        var url = 'https://api.nestoria.es/api';
        var options = {
            "method": "GET",
            "rejectUnauthorized": false,
            "url": url,
            'qs': params,
            "headers": {"Content-Type": "application/json"}
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var avg = 0;
                var listings = body['response']['listings'];
                if (listings != undefined) {
                    var count = 0;
                    var total = 0;
                    for(var i = 0; i < listings.length; i++) {
                        count++;
                        if (listings[i]['size'] > 0) {
                            total += listings[i]['price'] / listings[i]['size'];
                        } else {
                            total += 0;
                        }
                    }

                    if (count > 0) {
                        avg = total / count;
                    }
                }

                callback({'buildingId': buildingId, 'avg': avg});
            }
        });
    },

    getIndexForBankBuilding: function (callback) {
        bucket.get('indexGeneratorForBankBuilding', function(err, result) {
            if (err) {
                console.log(err);
                throw err;
            }

            callback(result.value);
        });
    },

    exportToExcel: function (name, data, callback) {
        let workbook = new Excel.Workbook();

        workbook.creator = 'Kode Plus';
        workbook.created = new Date();

        let worksheet = workbook.addWorksheet(name, {properties: {showGridLines: false}});

        for (const item of data) {
            worksheet.addRow(item);
        }

        workbook.xlsx.writeFile(config.reportDir + '/' + name)
            .then(callback);
    }
};




// =================================================================
// module
// =================================================================
module.exports = migrationManager;

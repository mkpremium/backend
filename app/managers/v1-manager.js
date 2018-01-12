var config      = require('../../config');
var couchbase   = require('couchbase');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);
var bcrypt      = require('bcrypt');
var jwt         = require('jsonwebtoken');
var uuid        = require('uuid');
var soap        = require('soap');
var request     = require('request');
var xmldoc      = require('xmldoc');
var utmObj      = require('utm-latlng');
var Excel       = require('exceljs');
var history     = require('../models/history');
var bankOperation = require('../models/bankOperation');
var bankBuilding = require('../models/bankBuilding');
var modelHelper = require('../models/models-helper');
var bankBuildings = {};

// var modelHelper = require('../models/models-helper');
// var buildings   = require('../models/building');
// var operators   = require('../models/operators');
// var owners      = require('../models/owners');
// var persons     = require('../models/persons');
// var houseStates = require('../models/housestate');
// var worksheets  = require('../models/worksheets');
// var history     = require('../models/history');

var v1Manager = {

    getQueueItem: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" order by random() limit 1'),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }

                // try to get owners info
                // let id = rows[0]['id'];
                // migrationManager.importAuxiliar005ById(null, id);

                res.json(rows[0]);
            });
    },

    getQueueItemNormal: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.info.fifo = "NORMAL" order by t.info.fifoDate, random() limit 1'),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }

                // try to get owners info
                // let id = rows[0]['id'];
                // migrationManager.importAuxiliar005ById(null, id);

                res.json(rows[0]);
            });
    },    

    getQueueItemRecall: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.info.fifo = "RECALL" order by t.info.fifoDate, random() limit 1'),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }

                // try to get owners info
                // let id = rows[0]['id'];
                // migrationManager.importAuxiliar005ById(null, id);

                res.json(rows[0]);
            });
    },    

    getQueueItemWithOwners: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.owners is not null order by random() limit 1'),
            function (err, rows) {;          
                if (err) {                    
                    console.log(err);
                    res.json(err);
                }

                res.json(rows[0]);
            });
    },

    getQueue: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" order by random() limit 100'),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }
                res.json(rows);
            });
    },

    getHistory: function (res, worksheetId){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "history" AND t.worksheetId = "' + worksheetId + '"'),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }
                res.json(rows);
            });
    },

    getOwnerProperties: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" AND t.info.currentOwner.name = "' + name + '"';                
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    addWorksheetOwner: function (res, worksheetId, owner){

        bucket.get('worksheet:' + worksheetId, function(err, result) {
            if (err) {
                console.log(err);
                res.json(err);
            }
            else {                   
                worksheet = result.value;
                if (!worksheet['owners']) {
                    worksheet['owners'] = [];
                }
                worksheet['owners'].push({ ownerId: ownerId, main: main, verified: verified });

                migrationManager.upsertToDb('worksheet:' + worksheetId, worksheet);
                
                res.json(worksheet);
            }                        
        });


    },

    setFIFOState: function (res, worksheetId, fifo, state){

        bucket.get('worksheet:' + worksheetId, function(err, result) {
            if (err) {
                console.log(err);
                res.json(err);
            }
            else {                   
                worksheet = result.value;
                worksheet.info['fifo'] = fifo;
                worksheet.info['fifoDate'] = (new Date()).toISOString().slice(0,19).replace(/-/g,"");
                worksheet.info.state = state;

                migrationManager.upsertToDb('worksheet:' + worksheetId, worksheet);
                
                res.json(worksheet);
            }                        
        });
    },    

    getOwner: function (res, id){
        //let N1qlQuery = couchbase.N1qlQuery;

        bucket.get('owner:' + id, function(err, result) {
            if (err) {
                console.log(err);
                res.json(err);
            }
            else {                                
                res.json(result.value);
            }                        
        });
    },

    getRegistryOwners: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "owner" AND t.mainOwner.name = "' + name + '"';                
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    updateOwner: function (res, owner){

        let pk = 'owner:' + owner.id;
        bucket.get(pk, function(err, result) {
            if (err) {
                console.log(err);
                throw err;
            }
            //console.log(result.value);
            if (owner.phone) {
                result.phone = owner.phone;
            }

            migrationManager.upsertToDb(pk, result);

            res.json(result);
        });


    },    

    getPersonsOwners: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "person" AND t.owner = "' + name + '"';                
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    getPersonFamily: function (res, address, state, postalCode){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "person" AND t.address.address = "' + address + '" AND t.address.state = "' + state + '" AND t.address.postalCode = "' + postalCode + '"';                
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    //console.log(err);
                    throw err;
                }                
                res.json(rows);
            });
    },

    getPersonBrothers: function (res, surname1, surname2, bornYear, id){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "person" AND t.surname1 = "' + surname1 + '" AND t.surname2 = "' + surname2 + '" ';                
        sql += 'AND t.bornDate.year >= ' + ( parseInt(bornYear) - 10 ) + ' '
        sql += 'AND t.bornDate.year <= ' + ( parseInt(bornYear) + 10 ) + ' '
        sql += 'AND t.id.year <> "' + id + '" '
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    getPersonSons: function (res, surname1, surname1Pair, bornYear){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "person" AND t.surname1 = "' + surname1 + '" AND t.surname2 = "' + surname1Pair + '" ';                
        sql += 'AND t.bornDate.year >= ' + ( parseInt(bornYear) + 30 ) + ' '
        sql += 'AND t.bornDate.year <= ' + ( parseInt(bornYear) + 50 ) + ' '
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    getPersonHouse: function (res, address, postalCode){
        let N1qlQuery = couchbase.N1qlQuery;        
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "person" AND t.address.address = "' + address + '" AND t.address.postalCode = "' + postalCode + '"';                        
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    getHouseState: function (res, catastroId){
        let N1qlQuery = couchbase.N1qlQuery;        
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "housestate" AND t.catastroId = "' + catastroId + '"';                        
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, rows) {;          
                if (err) {
                    console.log(err);
                    res.json(err);
                }                
                res.json(rows);
            });
    },

    addHistory: function (res, history){

        history['_documentType'] = 'history';

        if (!history['id']) {
            history['id'] = migrationManager.createGuid();
        }

        let worksheetId = history.worksheetId;
        if (worksheetId) {

            migrationManager.upsertToDb('history:' + history.id, history, false);

            bucket.get('worksheetId:' + worksheetId, function(err, result) {
                if (err) {
                    console.log(err);
                    res.json(err);
                }
                else {                   
                    let worksheet = result.value;
                    worksheet.history.push(history.id);                    
                    migrationManager.upsertToDb('worksheetId:' + worksheetId, worksheet);
                    res.json({done:true});
                }                        
            });
        }
        else {
            res.json({done:false});
        }

        //res.json({done:true});
    },

    removeHistory: function (res, history){
        
        if (history['id']) {

            bucket.get('history:' + history.id, function(err, result) {
                if (err) {
                    console.log(err);
                    res.json(err);
                }
                else {                   
                    let historyToDelete = result.value;
                    historyToDelete['deleted'] = true;                        
                    migrationManager.upsertToDb('history:' + history.id, historyToDelete);
                    res.json(historyToDelete);
                }                        
            });

        }
        else {
            res.json({done:false});
        }

    },
    
    searchHistory: function (res, search){
        
        let sql = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "history" ';                        
        let filter = false;

        if (search['owner']) {
            sql += 'AND t.owner = "' + search['owner'] + '" ';
            filter = true;
        }
        if (search['worksheetId']) {
            sql += 'AND t.worksheetId = "' + search['worksheetId'] + '" ';
            filter = true;
        }
        if (search['iniDate']) {
            sql += 'AND t.tmStmp >= "' + search['iniDate'] + '" ';
            filter = true;
        }
        if (search['endDate']) {
            sql += 'AND t.tmStmp <= "' + search['endDate'] + '" ';
            filter = true;
        }

        if (filter) {            
            bucket.query(
                N1qlQuery.fromString(sql),
                function (err, rows) {;          
                    if (err) {
                        console.log(err);
                        res.json(err);
                    }                
                    res.json(rows);
                });
        }
        else {
            res.json({done:false});
        }
    },   


    register: function (res, name, password){

        var guid = uuid.v4();

        var pk = "operator:" + guid;
        var hashedPassword = bcrypt.hashSync(password, 8);
        var data = {
            "_documentType": "operator",
            "id": guid,
            "name": name,
            "password": hashedPassword,
            "operatorNumber": "0",
            "ip": null,
            "level": 0,
            "blocked": false,
            "superUser": false,
            "tmstmp": "",
            "creationDate": null,
            "deletionDate": null
        };

        bucket.manager().createPrimaryIndex(function() {
            bucket.upsert(pk, data, function(err, result) {
                if (err) {
                    console.log(err);
                    throw err;
                }

                // create a token
                var token = jwt.sign({ id: guid }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.json({ auth: true, token: token });

            });
        });
    },

    login: function (res, name, password) {
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "operator" AND t.name = "' + name + '"';
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, users) {
                if (err) {
                    //console.log(err);
                    throw err;
                }

                if (users.length == 0) {
                    return res.status(401).send({ auth: false, token: null });
                }

                var user = users[0];

                var passwordIsValid = bcrypt.compareSync(password, user.password);
                if (!passwordIsValid) {
                    return res.status(401).send({ auth: false, token: null });
                }

                var token = jwt.sign({ id: user.id }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.json({ auth: true, token: token });
            });

    },

    me: function (res, userId) {
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "operator" AND t.id = "' + userId + '"';
        bucket.query(
            N1qlQuery.fromString(sql),
            function (err, users) {
                if (err) {
                    //console.log(err);
                    throw err;
                }

                if (users.length == 0) {
                    return res.status(404).send("No user found.");
                }
                res.json(users[0]);
            });

    },

    getData: function (res, data) {

        let historyData = {
            _documentType: 'numintec',
            id: uuid.v4(),
            worksheetId: "",
            operatorId: "",
            departmentId: "",
            tmStmp: "",
            action: "event",
            notes: JSON.stringify(data)
        };

        let historyDTO = JSON.parse(JSON.stringify(new history.HistoryDTO(historyData)));

        var pk = 'history:' + historyDTO.id;

        bucket.manager().createPrimaryIndex(function() {
            bucket.upsert(pk, historyDTO, function(err, result) {
                if (err) {
                    console.log(err);
                    throw err;
                }

                res.json({
                    "success": true,
                    "data": data
                });
            });
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

                        return result;
                    });
                }
            });
        });
        return;
    },

    numintecCall: function (res, userId, from, to) {

        if (!req.query.method) {
            return res.status(404).send("Method not found.");
        }

        var params = req.query;

        // The trailing slash "/" is important. Otherwise it will return 404
        var url = 'https://api.invoxcontact.com/Call/rest/' + params.method + "/";
        console.log(url);
        var options = {
            "url": url,
            "method": "GET",
            'qs': params
        };

        request(options, function (error, response, body) {

            if (error) {
                console.log(error);
            }

            res.json(JSON.parse(body));
        });

    },

    numintecAgent: function (res, req) {

        if (!req.query.method) {
            return res.status(404).send("Method not found.");
        }

        var params = req.query;

        // The trailing slash "/" is important. Otherwise it will return 404
        var url = 'https://api.invoxcontact.com/Agent/rest/' + params.method + "/";
        console.log(url);
        var options = {
            "url": url,
            "method": "GET",
            'qs': params
        };

        request(options, function (error, response, body) {

            if (error) {
                console.log(error);
            }

            res.json(JSON.parse(body));
        });
    },

    testcall: function (res, userId) {

        var url = 'https://api.invoxcontact.com/Call/?wsdl';
        var args = {'license': 'MKPREMIUM-xtZVOGay7PqZzcKyVtZd2qiKsXq2CfSo9ts4wwGdXCqpq5QcElHfVvFalaM1GNDDb7iYbbxotdHy1VuIqWwrpmgtyd'};

        var soapOptions = {
            forceSoap12Headers: true
        };


        soap.createClient(url, soapOptions, function(err, client) {

            var args = {"from" : "abc", "to" : '+84907193168'};
            client.setSecurity(new soap.BasicAuthSecurity('operador.905', '98b1d8cf'));
            client.call(args, function(err, result) {

                if (err) {
                    return res.status(500).send({auth: false, message: 'Failed to make numintec call.'});
                }

                console.log(result);
                res.json(result);
            });


            // client.Authentication(args, function(err, result) {
            //     if (err) {
            //         return res.status(500).send({auth: false, message: 'Failed to authenticate Numintec key.'});
            //     }
            //
            //     if (result.return.$value) {
            //
            //         var args = {"from" : "abc", "to" : '+84907193168'};
            //         // client.setSecurity(new soap.BasicAuthSecurity('operador.905', '98b1d8cf'));
            //         client.call(args, function(err, result) {
            //
            //             if (err) {
            //                 return res.status(500).send({auth: false, message: 'Failed to make numintec call.'});
            //             }
            //
            //             console.log(result);
            //             res.json(result);
            //         });
            //
            //
            //     } else {
            //         return res.status(403).send({auth: false, message: 'Failed to authenticate Numintec key.'});
            //     }
            //
            // });
        });

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
                if (rows.length == 0) {
                    errors.push("TempBankUpdate document not found with ticket id: " + ticketId);
                } else {
                    if (rows[0]['userId'] != userId) {
                        errors.push("User ID doesn't match with User ID of access token");
                    } else {
                        var allowDays = 1;
                        var now = Date.now();
                        var days = (now - rows[0]['timestamp']) / 86400000;

                        if (days > allowDays) {
                            errors.push("The timestamp is older than " + allowDays + " day.");
                        } else {
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
                                    errors.push(error);
                                } else {
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
                                            }
                                        );
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
                                                }
                                            );
                                        }
                                    );
                                }
                            });
                        }
                    }
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

    getPendingBankOperations: function (res) {
        var N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankOperation" AND t.processed = false'),
            function (err, rows) {
                if (rows.length == 0) {
                    res.json({
                        'success': false,
                        'message': 'Pending BankOperation not found.'
                    });
                } else {
                    res.json({
                        'success': true,
                        'data': rows
                    });
                }
            }
        );
    },

    getBankBuildings: function (operation, state, from, size, res) {
        var N1qlQuery = couchbase.N1qlQuery;
        var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding"';

        bucket.query(
            N1qlQuery.fromString(queryString),
            function (err, rows) {
                if (rows.length == 0) {
                    res.json({
                        'success': false,
                        'message': 'BankBuilding not found.'
                    });
                } else {
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

                    res.json({
                        'success': true,
                        'data': rows
                    });
                }
            }
        );
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
                        res.json({
                            'success': true,
                            'data': data
                        });
                    } else {
                        res.json({
                            'success': false,
                            'message': 'BankBuilding not found.'
                        });
                    }
                }
            );
        } else {
            res.json({
                'success': false,
                'message': 'Index can not be empty.'
            });
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
                        res.json({
                            'success': true,
                            'data': data
                        });
                    } else {
                        res.json({
                            'success': false,
                            'message': 'Next BankBuilding not found.'
                        });
                    }
                }
            );
        } else {
            res.json({
                'success': false,
                'message': 'Index can not be empty.'
            });
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
                        res.json({
                            'success': true,
                            'data': data
                        });
                    } else {
                        res.json({
                            'success': false,
                            'message': 'Previous BankBuilding not found.'
                        });
                    }
                }
            );
        } else {
            res.json({
                'success': false,
                'message': 'Index can not be empty.'
            });
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
                }).bind(this)
            );
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
                }).bind(this)
            );
        } else {
            var message = '';
            if (index == undefined || index == '') {
                message = "Index can not be empty.";
            } else if (available == undefined || available == '') {
                message = "Operation can not be empty.";
            }

            res.json({
                'success': false,
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
                function (err, rows) {
                    res.json({
                        'success': true,
                        'data': rows
                    });
                }
            );
        } else {
            res.json({
                'success': false,
                'message': 'Operation can not be empty.'
            });
        }
    },

    exportBankBuilding: function (operation, state, name, res) {
        var N1qlQuery = couchbase.N1qlQuery;
        var queryString = 'SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "bankBuilding" and t.available = true';

        bucket.query(
            N1qlQuery.fromString(queryString),
            (function (err, rows) {
                if (rows.length == 0) {
                    res.json({
                        'success' : false,
                        'message': 'Bank building data not found.'
                    });
                } else {
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
module.exports = v1Manager;

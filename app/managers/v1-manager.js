var config      = require('../../config');
var couchbase   = require('couchbase');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);
var bcrypt      = require('bcrypt');
var jwt         = require('jsonwebtoken');
var uuid        = require('uuid');
var soap        = require('soap');
var history     = require('../models/history');

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
        }

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

    call: function (res, userId, from, to) {

        // var args = {"from" : from, "to" : to};
        // client.setSecurity(new soap.BasicAuthSecurity('operador.905', '98b1d8cf'));
        // user: operador.905
        // pass: 98b1d8cf

        // client.setSecurity(new soap.BearerSecurity('MKPREMIUM-xtZVOGay7PqZzcKyVtZd2qiKsXq2CfSo9ts4wwGdXCqpq5QcElHfVvFalaM1GNDDb7iYbbxotdHy1VuIqWwrpmgtyd'));

        // client.call(args, function(err, result) {
        //
        //     if (err) {
        //         return res.status(500).send({auth: false, message: 'Failed to authenticate.'});
        //     }
        //
        //     console.log(result);
        //     res.json(result);
        // });
        res.json({"success" : true});

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

    }

};

// =================================================================
// module
// =================================================================
module.exports = v1Manager;

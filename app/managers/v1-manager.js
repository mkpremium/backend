var config      = require('../../config');
var couchbase   = require('couchbase');
var cluster     = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket      = cluster.openBucket(config.bucketName);
var bcrypt      = require('bcrypt');
var jwt         = require('jsonwebtoken');

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
            N1qlQuery.fromString('SELECT t.* FROM mkpremium t WHERE t._documentType = "worksheet" order by random() limit 1'),
            function (err, rows) {;          
                if (err) {
                    //console.log(err);
                    throw err;
                }
                res.json(rows[0]);
            });
    },

    getQueue: function (res){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM mkpremium t WHERE t._documentType = "worksheet" order by random() limit 100'),
            function (err, rows) {;          
                if (err) {
                    //console.log(err);
                    throw err;
                }
                res.json(rows);
            });
    },

    getHistory: function (res, worksheetId){
        let N1qlQuery = couchbase.N1qlQuery;
        bucket.query(
            N1qlQuery.fromString('SELECT t.* FROM mkpremium t WHERE t._documentType = "history" AND t.worksheetId = "' + worksheetId + '"'),
            function (err, rows) {;          
                if (err) {
                    //console.log(err);
                    throw err;
                }
                res.json(rows);
            });
    },

    getOwnerProperties: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "worksheet" AND t.info.currentOwner.name = "' + name + '"';                
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

    getOwner: function (res, id){
        let N1qlQuery = couchbase.N1qlQuery;

        bucket.get('owner:' + id, function(err, result) {
            if (err) {
                //console.log(err);
                throw err;
            }
            else {                                
                res.json(result.value);
            }                        
        });
    },

    getRegistryOwners: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "owner" AND t.mainOwner.name = "' + name + '"';                
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

    getPersonsOwners: function (res, name){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "person" AND t.owner = "' + name + '"';                
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

    getPersonFamily: function (res, address, state, postalCode){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "person" AND t.address.address = "' + address + '" AND t.address.state = "' + state + '" AND t.address.postalCode = "' + postalCode + '"';                
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
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "person" AND t.surname1 = "' + surname1 + '" AND t.surname2 = "' + surname2 + '" ';                
        sql += 'AND t.bornDate.year >= ' + ( parseInt(bornYear) - 10 ) + ' '
        sql += 'AND t.bornDate.year <= ' + ( parseInt(bornYear) + 10 ) + ' '
        sql += 'AND t.id.year <> "' + id + '" '
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

    getPersonSons: function (res, surname1, surname1Pair, bornYear){
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "person" AND t.surname1 = "' + surname1 + '" AND t.surname2 = "' + surname1Pair + '" ';                
        sql += 'AND t.bornDate.year >= ' + ( parseInt(bornYear) + 30 ) + ' '
        sql += 'AND t.bornDate.year <= ' + ( parseInt(bornYear) + 50 ) + ' '
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

    getPersonHouse: function (res, address, postalCode){
        let N1qlQuery = couchbase.N1qlQuery;        
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "person" AND t.address.address = "' + address + '" AND t.address.postalCode = "' + postalCode + '"';                        
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

    getHouseState: function (res, catastroId){
        let N1qlQuery = couchbase.N1qlQuery;        
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "housestate" AND t.catastroId = "' + catastroId + '"';                        
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

    register: function (res, name, password){

        var pk = "operator:" + name;
        var hashedPassword = bcrypt.hashSync(password, 8);
        var data = {
            "_documentType": "operator",
            "id": name,
            "name": name,
            "password": hashedPassword,
            "operatorNumber": "0",
            "ip": null,
            "level": 0,
            "blocked": false,
            "superUser": false,
            "tmstmp": "0x000000005E47C7F0",
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
                var token = jwt.sign({ id: name }, config.secret, {
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

                var user = users[0];

                var passwordIsValid = bcrypt.compareSync(password, user.password);
                if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
                var token = jwt.sign({ id: user.name }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.json({ auth: true, token: token });
            });

    },

    me: function (res, userId) {
        let N1qlQuery = couchbase.N1qlQuery;
        let sql = 'SELECT t.* FROM mkpremium t WHERE t._documentType = "operator" AND t.name = "' + userId + '"';
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

    }

};

// =================================================================
// module
// =================================================================
module.exports = v1Manager;

var config           = require('../../config');
var couchbase        = require('couchbase');
var cluster          = new couchbase.Cluster(config.database);
cluster.authenticate(config.databaseUser, config.databasePassword);
var bucket           = cluster.openBucket(config.bucketName);
var migrationManager = require('../managers/migration-manager');


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
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.fifo = "NORMAL" order by t.info.fifoDate, random() limit 1'),
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
            N1qlQuery.fromString('SELECT t.* FROM ' + config.bucketName + ' t WHERE t._documentType = "worksheet" and t.fifo = "RECALL" order by t.info.fifoDate, random() limit 1'),
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

        migrationManager.upsertToDb('history:' + history.id, history, false);
        res.json({done:true});
    },

    removeHistory: function (res, history){
        
        if (history['id']) {
            let sql = 'DELETE FROM ' + config.bucketName + ' t WHERE t._documentType = "history" AND t.id = "' + history.id + '"';                        
            bucket.query(
                N1qlQuery.fromString(sql),
                function (err, rows) {;          
                    if (err) {
                        console.log(err);
                        res.json(err);
                    }                
                    res.json({done:true});
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

};




// =================================================================
// module
// =================================================================
module.exports = v1Manager;

var toLowerCaseRequest = function (obj) {    
    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newObj={}
    while (n--) {
      key = keys[n];
      newObj[key.toLowerCase()] = obj[key];
    }
    return newObj;
};


var removeNulls = function(obj) {
    var key, keys = Object.keys(obj);
    var n = keys.length;
    while (n--) {
      key = keys[n];
      if (obj[key] === 'NULL') {
        obj[key] = null;
      }
    }

    // insert or update
    return obj;
}


// =================================================================
// module
// =================================================================
module.exports.toLowerCaseRequest = toLowerCaseRequest;
module.exports.removeNulls = removeNulls;




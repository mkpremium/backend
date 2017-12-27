var toLowerCaseRequest = function (obj) {    
    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newObj = {};
    while (n--) {
      key = keys[n];
      newObj[key.toLowerCase().replace(' ', '_')] = obj[key];
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
};

var checkCSVFormed = function(fields, bankFields) {
    if (fields.length === bankFields.length) {
        for (var i = 0; i < fields.length; i++) {
            if (fields[i] !== bankFields[i]) {
                return false;
            }
        }

        return true;
    } else {
        return false;
    }
};


// =================================================================
// module
// =================================================================
module.exports.toLowerCaseRequest = toLowerCaseRequest;
module.exports.removeNulls = removeNulls;
module.exports.checkCSVFormed = checkCSVFormed;




/**
 * This code is necessary because couchbase callback doesn't play well
 * with Bluebird promisify functions
 */

/**
 * Turns a function with one argument and callback to promises style
 * @param bucket
 * @param name
 * @return {function(*=): Promise<any>}
 */
function turnsAsync1(bucket, name) {
  return pk => new Promise((resolve, reject) => {
    bucket[name](pk, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Turns a function with two arguments and callback to promises style
 * @param bucket
 * @param name
 * @return {function(*=): Promise<any>}
 */
function turnsAsync2(bucket, name) {
  return (pk, data) => new Promise((resolve, reject) => {
    bucket[name](pk, data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export default function promises(bucket) {
  bucket.queryAsync = turnsAsync2(bucket, 'query');
  bucket.upsertAsync = turnsAsync2(bucket, 'upsert');
  bucket.getAsync = turnsAsync1(bucket, 'get');
}

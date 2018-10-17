/**
 * This code is necessary because couchbase callback doesn't play well
 * with Bluebird promisify functions
 */

function turnsAsync(bucket, name) {
  return (...args) => new Promise((resolve, reject) => {
    const cb = (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    };
    bucket[name].apply(bucket, args.concat([cb]));
  });
}

export default function promises(bucket) {
  const manager = bucket.manager();
  bucket.createIndexAsync = turnsAsync(manager, 'createIndex');
  bucket.flushAsync = turnsAsync(manager, 'flush');
  bucket.queryAsync = turnsAsync(bucket, 'query');
  bucket.upsertAsync = turnsAsync(bucket, 'upsert');
  bucket.getAsync = turnsAsync(bucket, 'get');
  bucket.getAndLockAsync = turnsAsync(bucket, 'getAndLock');
  bucket.unlockAsync = turnsAsync(bucket, 'unlock');
  bucket.counterAsync = turnsAsync(bucket, 'counter');
}

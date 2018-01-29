import debug from 'debug';
import Couchbase from 'couchbase';
import {couchbase} from '../../config';

import attachHelpers from './helpers';

const debugCouchbase = debug('app:couchbase');
const defaultOpts = {
  middleware: true
};

let retries = 3;

export default (opts = defaultOpts) => {
  let resolve = null;
  let reject = null;

  debugCouchbase(`initializing couchbase connection with "${couchbase.uri}"`);
  const cluster = new Couchbase.Cluster(couchbase.uri);
  cluster.authenticate(couchbase.user, couchbase.pass);

  // http://bluebirdjs.com/docs/api/deferred-migration.html
  const promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });

  const bucket = cluster.openBucket(couchbase.bucket);

  checkBucket(bucket, cluster, resolve, reject);

  if (!opts.middleware) {
    return promise;
  }

  return (req, res, next) => {
    Object.assign(req.app.locals, {cluster, bucket});
    next();
  };
};

function checkBucket(bucket, cluster, resolve, reject) {
  if (retries <= 0) {
    reject(new Error(`It's possible a error trying to connect bucket ${bucket._name} check your setup`));
  }

  debugCouchbase(`checking bucket ${bucket._name} for connection (${retries})`);

  if (bucket.connected) {
    debugCouchbase(`bucket ${bucket._name} connected`);
    attachHelpers(bucket);
    resolve(bucket);
  } else {
    retries--;
    setTimeout(() => checkBucket(bucket, cluster, resolve, reject), 1500);
  }
}

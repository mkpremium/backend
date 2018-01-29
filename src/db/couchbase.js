import debug from 'debug';
import Couchbase from 'couchbase';
import {couchbase} from '../../config';
import Promise from 'bluebird';

import attachHelpers from './helpers';

const debugCouchbase = debug('app:couchbase');

let retries = 3;

export default () => {
  debugCouchbase(`initializing couchbase connection with "${couchbase.uri}"`);
  const cluster = new Couchbase.Cluster(couchbase.uri);
  cluster.authenticate(couchbase.user, couchbase.pass);

  // this is a initial naive support for promise of the couchbase
  // library
  const bucket = Promise.promisifyAll(cluster.openBucket(couchbase.bucket));

  checkBucket(bucket);

  return (req, res, next) => {
    Object.assign(req.app.locals, {cluster, bucket});
    next();
  };
};

function checkBucket(bucket) {
  if (retries <= 0) {
    console.error(`It's possible a error trying to connect bucket ${bucket._name} check your setup`);
    process.exit(1);
  }

  debugCouchbase(`checking bucket ${bucket._name} for connection (${retries})`);

  if (bucket.connected) {
    debugCouchbase(`bucket ${bucket._name} connected`);
    attachHelpers(bucket);
  } else {
    retries--;
    setTimeout(() => checkBucket(bucket), 1500);
  }
}

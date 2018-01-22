import Couchbase from 'couchbase';
import {couchbase} from '../../config';
import Promise from 'bluebird';

import attachHelpers from './helpers';

export default () => {
  const cluster = new Couchbase.Cluster(couchbase.uri);
  cluster.authenticate(couchbase.user, couchbase.pass);

  // this is a initial naive support for promise of the couchbase
  // library
  const bucket = Promise.promisifyAll(cluster.openBucket(couchbase.bucket));

  attachHelpers(bucket);

  return (req, res, next) => {
    Object.assign(req.app.locals, {cluster, bucket});
    next();
  };
};

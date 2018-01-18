import Couchbase from 'couchbase';
import {couchbase} from '../../config';

const cluster = new Couchbase.Cluster(couchbase.uri);
cluster.authenticate(couchbase.user, couchbase.pass);
const bucket = cluster.openBucket(couchbase.bucket);

export default {cluster, bucket};

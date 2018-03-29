import {join} from 'path';
import {N1qlQuery} from 'couchbase';

export const port = parseInt(process.env.PORT || '9001');
export const emitHistoryEvents = process.env.EMIT_HISTORY_EVENTS || false;
export const emitModelEvents = process.env.EMIT_MODEL_EVENTS || false;
export const socket = {
  port: parseInt(process.env.SOCKET_PORT || '9002'),
  server: process.env.SOCKET_SERVER || 'http://localhost',
  reconnectionAttempts: process.env.SOCKET_CONNECTION_RETRIES || 10
};
export const cronjobsPort = parseInt(process.env.CRONJOBS_PORT || '9003');
export const couchbase = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucket: process.env.COUCHBASE_BUCKET || 'mkpremium',
  user: process.env.COUCHBASE_USER || 'Administrator',
  pass: process.env.COUCHBASE_PASS || 'password',
  timeout: parseInt(process.env.COUCHBASE_TIMEOUT || 1500),
  retries: parseInt(process.env.COUCHBASE_TIMEOUT_RETRIES || 3),
  consistency: parseInt(process.env.COUCHBASE_CONSISTENCY || N1qlQuery.Consistency.STATEMENT_PLUS)
};
export const jwt = {
  secret: process.env.JWT_SECRET || 'Bitdistrict1sGreat',
  expiresIn: process.env.JWT_EXPIRES || '1 day'
};

export const numintec = {
  apiUrl: process.env.NUMINTEC_API_URL || 'http://api.invoxcontact.com',
  apiKey: process.env.NUMINTEC_API_LICENSE
};

export const saltFactor = parseInt(process.env.SALT_FACTOR || 10);

export const migrationEnabled = Boolean(process.env.MIGRATION_MODULE || false);
export const uploadDir = process.env.REPORT_DIR || '/tmp';
export const gearmanConfig = {
  host: process.env.GERMAN_HOST || 'localhost',
  port: parseInt(process.env.GEARMAN_PORT || 4730)
};

const defaultFirebaseServiceAccount = join(__dirname, 'firebase.json');
export const firebase = {
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || defaultFirebaseServiceAccount,
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://mkpremiumcomerciales.firebaseio.com'
};

export const errorVerbosity = parseInt(process.env.ERR_HANDLER_LEVEL || 0);

export const awsConfig = {
  region: process.env.AWS_REGION || 'eu-west-3',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.S3_BUCKET_NAME || 'mkpremium',
  prefix: process.env.S3_METADATA_PREFIX || 'dev'
};

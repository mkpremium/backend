import {N1qlQuery} from 'couchbase';
export const port = parseInt(process.env.PORT || '9001');
export const sendRecordEvents = process.env.SEND_RECORD_EVENTS || false;
export const socket = {
  port: parseInt(process.env.SOCKET_PORT || '9002'),
  server: process.env.SOCKET_SERVER || 'http://localhost'
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
  expiresIn: '1 day'
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

export const errorVerbosity = parseInt(process.env.ERR_HANDLER_LEVEL || 0);

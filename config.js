import {N1qlQuery} from 'couchbase';
export const port = parseInt(process.env.PORT || '9001');
export const socketPort = parseInt(process.env.SOCKET_PORT || '9002');
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

export const reportDir = process.env.REPORT_DIR || 'app/csv';

export const errorVerbosity = parseInt(process.env.ERR_HANDLER_LEVEL || 0);

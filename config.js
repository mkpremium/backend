import multer from 'multer';
import nodemailer from 'nodemailer';
import t from 'tcomb';
import {join} from 'path';
import _ from 'lodash';
import {N1qlQuery} from 'couchbase';

export const port = parseInt(process.env.APP_PORT || '9001');
export const emitHistoryEvents = JSON.parse(process.env.EMIT_HISTORY_EVENTS || false);
export const emitModelEvents = JSON.parse(process.env.EMIT_MODEL_EVENTS || false);
export const socket = {
  enabled: JSON.parse(process.env.SOCKET_ENABLED || 'true'),
  port: parseInt(process.env.SOCKET_PORT || '9002'),
  server: process.env.SOCKET_SERVER || 'http://localhost',
  reconnectionAttempts: process.env.SOCKET_CONNECTION_RETRIES || 10
};
export const couchbase = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucket: process.env.COUCHBASE_BUCKET || 'mkpremium',
  user: process.env.COUCHBASE_USER || 'Administrator',
  pass: process.env.COUCHBASE_PASS || 'password',
  timeout: parseInt(process.env.COUCHBASE_TIMEOUT || 2500),
  retries: parseInt(process.env.COUCHBASE_TIMEOUT_RETRIES || 3),
  consistency: parseInt(process.env.COUCHBASE_CONSISTENCY || N1qlQuery.Consistency.STATEMENT_PLUS)
};
export const jwt = {
  secret: process.env.JWT_SECRET || 'Bitdistrict1sGreat',
  expiresIn: process.env.JWT_EXPIRES || '3 day',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_JWT_EXPIRES || '10 days'
};

export const numintec = {
  apiUrl: process.env.NUMINTEC_API_URL || 'http://api.invoxcontact.com',
  apiKey: process.env.NUMINTEC_API_LICENSE
};

export const saltFactor = parseInt(process.env.SALT_FACTOR || 10);

export const migrationEnabled = JSON.parse(process.env.MIGRATION_MODULE || false);
export const uploadDir = process.env.REPORT_DIR || '/tmp';
export const gearmanConfig = {
  enabled: JSON.parse(process.env.GEARMAN_ENABLE || 'true'),
  host: process.env.GEARMAN_HOST || 'localhost',
  port: parseInt(process.env.GEARMAN_PORT || 4730),
  recoverTime: 5000 // gearman defaults to 30000
};

export const errorVerbosity = parseInt(process.env.ERR_HANDLER_LEVEL || 0);

export const awsConfig = {
  region: process.env.AWS_REGION || 'eu-west-3',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.S3_BUCKET_NAME || 'mkpremium',
  prefix: process.env.S3_METADATA_PREFIX || 'dev',
  signatureVersion: 'v4'
};

export const tests = {
  skipCalls: JSON.parse(process.env.TEST_SKIP_CALLS || false)
};

export const isTest = () => process.env.NODE_ENV === 'test';
export const isMaybeTesting = v => isTest() ? t.maybe(v) : v;

const defaultFirebaseServiceAccount = join(__dirname, 'firebaseComerciales.json');
const defaultFirebaseServiceAccountInformadores = join(__dirname, 'firebaseInformadores.json');

function isEnabled(value) {
  if (_.isEmpty(value)) {
    return !isTest();
  }
  return JSON.parse(value);
}

export const firebaseComerciales = {
  enabled: isEnabled(process.env.FIREBASE_COMERCIALES || 'true'),
  serviceAccount: process.env.FIREBASE_COMERCIALES_SERVICE_ACCOUNT_KEY || defaultFirebaseServiceAccount,
  databaseURL: process.env.FIREBASE_COMERCIALES_DATABASE_URL || '',
  prefixURL: process.env.FIREBASE_COMERCIALES_PREFIX_URL || ''
};

export const firebaseInformadores = {
  enabled: isEnabled(process.env.FIREBASE_INFORMADORES || 'true'),
  serviceAccount: process.env.FIREBASE_INFORMADORES_SERVICE_ACCOUNT_KEY || defaultFirebaseServiceAccountInformadores,
  databaseURL: process.env.FIREBASE_INFORMADORES_DATABASE_URL || '',
  prefixURL: process.env.FIREBASE_INFORMADORES_PREFIX_URL || ''
};

const defaultUploadDir = join(__dirname, '.uploads');

export const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, process.env.UPLOAD_DIR || defaultUploadDir);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.fieldname}`);
  }
});

export const mailer = {
  info: (info) => {
    if (process.env.MAILER_HOST === 'smtp.ethereal.email') {
      return nodemailer.getTestMessageUrl(info);
    }
    return '';
  },
  transporter: nodemailer.createTransport({
    host: process.env.MAILER_HOST || 'smtp.ethereal.email',
    port: Number(process.env.MAILER_PORT || '587'),
    secure: JSON.parse(process.env.MAILER_SECURE || false),
    auth: {
      user: process.env.MAILER_USER || 'v3hn5oczispny2x4@ethereal.email',
      pass: process.env.MAILER_PASS || 'kF5nfKm6XreTsMN8Br'
    },
    logger: false,
    debug: false,
    tls: {
      rejectUnauthorized: false
    }
  })
};

export const cadastreLocation = {
  serviceUrl: 'http://ovc.catastro.meh.es/ovcservweb/ovcswlocalizacionrc/ovccoordenadas.asmx/Consulta_CPMRC',
  waitTimeMS: Number(process.env.SERVICES_WAIT_TIME || 2000)
};

export const cadastreAddress = {
  serviceUrl: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx?op=Consulta_DNPRC',
  waitTimeMS: Number(process.env.SERVICES_WAIT_TIME || 2000),
  cachePrefix: process.env.CADASTRE_ADDRESS_CACHE_KEY || 'address_cache'
};

export const nestoriaService = {
  serviceUrl: 'https://api.nestoria.es:443/api',
  waitTimeMS: Number(process.env.SERVICES_WAIT_TIME || 2000),
  cachePrefix: process.env.NESTORIA_CACHE_KEY || 'nestoria_cache'
};

export const operatorPerformance = {
  numberOfDayOffset: Number(process.env.PERFORMANCE_OFFSET_DAYS || 15)
};

export const proxyEnable = JSON.parse(process.env.PROXY_ENABLE || false);

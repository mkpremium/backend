import { N1qlQuery } from 'couchbase'
import multer from 'multer'
import nodemailer from 'nodemailer'
import { join } from 'path'
import t from 'tcomb'
import { logger } from './src/infrastructure/logger'

export const port = parseInt(process.env.APP_PORT || '9001')
export const emitModelEvents = JSON.parse(process.env.EMIT_MODEL_EVENTS || false)
export const socket = {
  enabled: JSON.parse(process.env.SOCKET_ENABLED || 'true'),
  port: parseInt(process.env.SOCKET_PORT || '9002'),
  server: process.env.SOCKET_SERVER || 'http://localhost',
  reconnectionAttempts: process.env.SOCKET_CONNECTION_RETRIES || 10
}
export const couchbase = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucket: process.env.COUCHBASE_BUCKET || 'mkpremium',
  user: process.env.COUCHBASE_USER || 'Administrator',
  pass: process.env.COUCHBASE_PASS || 'password',
  timeout: parseInt(process.env.COUCHBASE_TIMEOUT || 2500),
  retries: parseInt(process.env.COUCHBASE_TIMEOUT_RETRIES || 3),
  consistency: parseInt(process.env.COUCHBASE_CONSISTENCY || N1qlQuery.Consistency.STATEMENT_PLUS),
  uriAPIRest: process.env.COUCHBASE_API_REST || 'http://127.0.0.1:8094/api/index/'
}
export const jwt = {
  secret: process.env.JWT_SECRET || 'Bitdistrict1sGreat',
  expiresIn: process.env.JWT_EXPIRES || '3 day',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_JWT_EXPIRES || '10 days'
}

export const numintec = {
  apiUrl: process.env.NUMINTEC_API_URL || 'http://api.invoxcontact.com',
  apiKey: process.env.NUMINTEC_API_LICENSE
}

export const saltFactor = parseInt(process.env.SALT_FACTOR || 10)

export const metadataS3Config = {
  region: process.env.METADATA_S3_REGION || 'eu-west-2',
  bucket: process.env.METADATA_S3_BUCKET || 'mkpremium-files'
}

export const isTest = () => process.env.NODE_ENV === 'test'
export const isMaybeTesting = v => isTest() ? t.maybe(v) : v

const defaultUploadDir = join(__dirname, '.uploads')

export const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, process.env.UPLOAD_DIR || defaultUploadDir)
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.fieldname}`)
  }
})

export const mailer = {
  info: (info) => {
    if (process.env.MAILER_HOST === 'smtp.ethereal.email') {
      return nodemailer.getTestMessageUrl(info)
    }
    return ''
  },
  transporter: nodemailer.createTransport({
    host: process.env.MAILER_HOST || 'smtp.ethereal.email',
    port: Number(process.env.MAILER_PORT || '587'),
    secure: JSON.parse(process.env.MAILER_SECURE || false),
    connectionTimeout: 2000,
    auth: {
      user: process.env.MAILER_USER || 'v3hn5oczispny2x4@ethereal.email',
      pass: process.env.MAILER_PASS || 'kF5nfKm6XreTsMN8Br'
    },
    logger: logger,
    debug: process.env.DEBUG === 'ON',
    tls: {
      rejectUnauthorized: false
    }
  })
}

export const cadastrewaitTimeMS = Number(process.env.SERVICES_WAIT_TIME || 2000)

export const operatorPerformance = {
  numberOfDayOffset: Number(process.env.PERFORMANCE_OFFSET_DAYS || 15)
}

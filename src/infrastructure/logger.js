import winston, { createLogger } from 'winston'

const level = process.env.DEBUG === 'ON' ? 'debug' : 'info'
// const level = 'info'
export const logger = createLogger({
  level,
  levels: winston.config.syslog.levels,
  format: winston.format.json(),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' })
    new winston.transports.Console({
      format: winston.format.json()
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.json()
    })
  ]
})
logger.info('logger started', { loggingLevel: level })

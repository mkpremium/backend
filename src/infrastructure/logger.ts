import winston, { createLogger } from 'winston'

const level = process.env.DEBUG === 'ON' ? 'debug' : 'info'

export const logger = createLogger({
  level,
  levels: winston.config.syslog.levels,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.json()
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.json()
    })
  ]
})
logger.info('logger started', { loggingLevel: level })

export const initLogger = () => logger

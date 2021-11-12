import winston, { createLogger, Logger as WinstonLogger } from 'winston'

const level = process.env.DEBUG === 'ON' ? 'debug' : 'info'

export type Logger = Pick<WinstonLogger, 'info' | 'warning' | 'error' | 'crit'>

export const logger = createLogger({
  level,
  levels: winston.config.syslog.levels,
  format: winston.format.json(),
  defaultMeta: {
    version: process.env.app_version || 'local',
  },
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

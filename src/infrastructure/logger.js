import winston, { createLogger } from 'winston'

export const logger = createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' })
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

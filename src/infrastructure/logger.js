import winston, { createLogger } from 'winston'

const level = process.env.DEBUG ? 'debug' : 'info'
export const logger = createLogger({
  level,
  format: winston.format.json(),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' })
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

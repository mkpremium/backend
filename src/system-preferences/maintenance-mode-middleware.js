import { wrap } from 'express-promise-wrap'
import { SystemPreferencesRepository } from './models'
import { newHttpError } from '../lib/http-error'

async function maintenanceMode (req, res, next) {
  const pref = await SystemPreferencesRepository.getPreferences()
  if (pref.maintenanceModeEnabled) {
    throw newHttpError(503, 'El sistema se encuentra en mantenimiento')
  } else {
    next()
  }
}

export const maintenanceModeMiddleware = wrap(maintenanceMode)

export default (app) => {
  app.use(maintenanceModeMiddleware)
}

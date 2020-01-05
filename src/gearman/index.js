import gearman from 'gearmanode'
import { gearmanConfig } from '../../config'

export default (app) => {
  if (gearmanConfig.enabled) {
    app.locals.gearman = gearman.client(gearmanConfig)
  }
}

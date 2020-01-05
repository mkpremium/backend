import debug from 'debug'
import routes from './routes'
import { migrationEnabled } from '../../config'

const debugMigration = debug('app:migration')

export default (app) => {
  debugMigration('enabled', migrationEnabled)
  if (!migrationEnabled) {
    return
  }

  app.set('view engine', 'ejs')
  app.set('tmpdir', '/tmp')
  app.use('/migration', routes)
}

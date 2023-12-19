import routes from './routes'

import './types'

export default (app, secured) => {
  app.use('/email', secured, routes)
}

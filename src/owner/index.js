import routes from './routes'

import './types'
import jwt from '../middleware/jwt'

export default (app, {setOwnerFeaturedContactService}) => {
  const secured = jwt()

  app.use('/owners', secured, routes(setOwnerFeaturedContactService))
}

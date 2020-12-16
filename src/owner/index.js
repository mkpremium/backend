import routes from './routes'

import './types'
import jwt from '../middleware/jwt'

export default (app, { setOwnerFeaturedContactService, ownerRepository }) => {
  const secured = jwt()

  app.use('/owners', secured, routes(setOwnerFeaturedContactService, ownerRepository))
}

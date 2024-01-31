import { permissions } from '../middleware/jwt'
import { createBuildingsRoutes } from './routes'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { AwilixContainer } from 'awilix'

export function buildingRoutes (awilixContainer: AwilixContainer, app, secured) {
  const buildingsRoutes = createBuildingsRoutes(awilixContainer)
  app.use('/buildings', secured, buildingsRoutes)

  const buildingRoutes = Router()
  buildingRoutes.put(
    '/:buildingId/expenses',
    permissions.admin,
    wrap(awilixContainer.resolve('setBuildingExpensesController'))
  )
  buildingRoutes.post(
    '/:buildingId/offer-requests',
    secured,
    wrap(awilixContainer.resolve('addOfferRequestController'))
  )
  buildingRoutes.post(
    '/:buildingId/proposals',
    secured,
    wrap(awilixContainer.resolve('addProposalController'))
  )

  app.use('/building', secured, buildingRoutes)
}

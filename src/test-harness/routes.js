import { wrap } from 'express-promise-wrap'
import jwt, { permissions } from '../middleware/jwt'
import { createBuildingFactory, CreateBuildingRequest } from './create-building'
import { createOwnerFactory } from './create-owner'
import { createBuildingWorksheetFactory } from './create-worksheet'

export function createTestHarness (app, dependenciesContainer) {
  const secured = jwt()
  const createOwner = createOwnerFactory(dependenciesContainer.ownerRepository)
  const createWorksheet = createBuildingWorksheetFactory(dependenciesContainer.worksheetRepository)
  const createBuilding = createBuildingFactory(
    dependenciesContainer.buildingRepository,
    createOwner,
    createWorksheet
  )

  app.post(
    '/test-harness/create-building',
    secured,
    permissions.admin,
    wrap(
      async (req, res) => {
        const createBuildingReq = CreateBuildingRequest(req.body)
        res.json(await createBuilding(createBuildingReq))
      }
    )
  )
}

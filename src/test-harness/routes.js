import { wrap } from 'express-promise-wrap'
import jwt, { permissions } from '../middleware/jwt'
import { createBuildingFactory, CreateBuildingRequest } from './create-building'
import { CreateOwnerCmd, createOwnerFactory } from './create-owner'
import { createBuildingWorksheetFactory } from './create-worksheet'
import { createOwnerCmd } from './fake-data-generator'

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

  app.post(
    '/test-harness/create-owner',
    secured,
    permissions.admin,
    wrap(
      async (req, res) => {
        const fakeOwner = createOwnerCmd(createOwnerCmd.buildingId)
        res.json(await createOwner(CreateOwnerCmd(fakeOwner)))
      }
    )
  )
}

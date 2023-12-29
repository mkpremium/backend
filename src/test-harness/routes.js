import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { OperatorRepository } from '../operator/models'
import { createBuildingFactory, CreateBuildingRequest } from './create-building'
import { CreateOwnerCmd, createOwnerFactory } from './create-owner'
import { createBuildingWorksheetFactory } from './create-worksheet'
import { createOwnerCmd } from './fake-data-generator'

export function createTestHarness (app, awilixContainer, secured) {
  const createOwner = createOwnerFactory(awilixContainer.resolve('ownersRepository'))
  const createWorksheet = createBuildingWorksheetFactory(awilixContainer.resolve('worksheetRepository'))
  const createBuilding = createBuildingFactory(
    awilixContainer.resolve('buildingsRepository'),
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

  app.post(
    '/test-harness/impersonate',
    secured,
    permissions.admin,
    wrap(async (req, res) => {
      const repo = new OperatorRepository()
      const { userId } = req.query
      const user = await repo.findByIdOrThrow(userId)
      const response = await repo.createAuthenticatedResponse(user)

      res.json(response)
    }))
}

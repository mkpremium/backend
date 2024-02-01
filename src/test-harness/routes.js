import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createBuildingFactory, CreateBuildingRequest } from './create-building'
import { createBuildingWorksheetFactory } from './create-worksheet'

export function createTestHarness (app, awilixContainer, secured) {
  const createWorksheet = createBuildingWorksheetFactory(awilixContainer.resolve('worksheetRepository'))
  const createBuilding = createBuildingFactory(
    awilixContainer.resolve('buildingsRepository'),
    awilixContainer.resolve('addOwnerService'),
    createWorksheet
  )
  const operatorRepository = awilixContainer.resolve('operatorRepository')

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
    '/test-harness/impersonate',
    secured,
    permissions.admin,
    wrap(async (req, res) => {
      const { userId } = req.query
      const user = await operatorRepository.findByIdOrThrow(userId)
      const response = await operatorRepository.createAuthenticatedResponse(user)

      res.json(response)
    }))
}

import { expect } from 'chai'
import { UserRoles } from '../../src/types/user'
import { buildUser } from '../common'
import { createTestContainer } from '../create-test-container'

describe.skip('PropertyManagerRepository', function () {
  let propertyManagerRepository, operatorRepository

  beforeEach(async function () {
    try {
      const diContainer = await createTestContainer()
      propertyManagerRepository = diContainer.resolve('propertyManagersRepository')
    } catch (e) {
      console.trace(e)
      throw e
    }
  })

  describe('getActivePropertyManagers', function () {
    it('returns empty list when there is no active property manager', async function () {
      const result = await propertyManagerRepository.getActivePropertyManagers()

      expect(result).to.be.deep.empty
    })

    it('returns only active property managers', async function () {
      await operatorRepository.save(buildUser({
        id: 'property-manager-user-id',
        username: 'property-manager-user-name',
        profile: {
          firstName: 'ignored',
          lastName: 'ignored',
          city: 'Barcelona'
        },
        roles: [UserRoles.BUSINESS],
        profitGoal: {
          amount: 100,
          updatedAt: new Date()
        }
      }))

      const result = await propertyManagerRepository.getActivePropertyManagers()

      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.be.deep.equal({
        id: 'property-manager-user-id',
        userName: 'property-manager-user-name',
        city: 'Barcelona',
        profitGoal: 100,
        maxLine: null
      })
    })
  })
})

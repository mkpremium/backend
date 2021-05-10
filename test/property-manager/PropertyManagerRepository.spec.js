import { expect } from 'chai'
import couchbase from '../../src/db/legacy-connect-couchbase'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { OperatorRepository } from '../../src/operator/models'
import { PropertyManagerRepository } from '../../src/property-manager/PropertyManagerRepository'
import { OperatorRoles } from '../../src/types/operator'
import { buildUser } from '../common'

describe('PropertyManagerRepository', () => {
  let couchbaseBucket, propertyManagerRepository, operatorRepository

  beforeEach(async () => {
    couchbaseBucket = await couchbase()
    propertyManagerRepository = new PropertyManagerRepository(new CouchbaseAdapter(couchbaseBucket))
    operatorRepository = new OperatorRepository()
    await couchbaseBucket.flushAsync()
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  describe('getActivePropertyManagers', () => {
    it('returns empty list when there is no active property manager', async () => {
      const result = await propertyManagerRepository.getActivePropertyManagers()

      expect(result).to.be.deep.empty
    })

    it('returns only active property managers', async () => {
      await operatorRepository.save(buildUser({
        id: 'property-manager-user-id',
        username: 'property-manager-user-name',
        profile: {
          firstName: 'ignored',
          lastName: 'ignored',
          city: 'Barcelona'
        },
        roles: [ OperatorRoles.BUSINESS ],
        profitGoal: {
          amount: 100,
          updatedAt: new Date()
        }
      }))

      const result = await propertyManagerRepository.getActivePropertyManagers()

      expect(result).to.have.lengthOf(1)
      expect(result[ 0 ]).to.be.deep.equal({
        id: 'property-manager-user-id',
        userName: 'property-manager-user-name',
        city: 'Barcelona',
        profitGoal: 100,
        maxLine: null
      })
    })
  })
})

import { CouchbaseAdapter } from '../../src/db/CouchbaseAdapter'
import { PropertyManagerRepository } from '../../src/PropertyManager/PropertyManagerRepository'
import { expect } from 'chai'
import couchbase from '../../src/db/couchbase'
import { OperatorRepository } from '../../src/operator/models'
import { buildOperator } from '../common'
import { OperatorRoles } from '../../src/types/operator'

describe('PropertyManagerRepository', () => {
  let couchbaseBucket, propertyManagerRepository, operatorRepository

  before(async () => {
    couchbaseBucket = await couchbase()
    propertyManagerRepository = new PropertyManagerRepository(new CouchbaseAdapter(couchbaseBucket))
    operatorRepository = new OperatorRepository()
  })

  beforeEach(async () => {
    await couchbaseBucket.removeAll()
  })

  describe('getActivePropertyManagers', () => {
    it('returns empty list when there is no active property manager', async () => {
      const result = await propertyManagerRepository.getActivePropertyManagers()

      expect(result).to.be.deep.empty
    })

    it('returns only active property managers', async () => {
      await operatorRepository.save(buildOperator({
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
        profitGoal: 100
      })
    })
  })
})

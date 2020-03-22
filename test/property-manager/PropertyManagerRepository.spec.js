import { PropertyManagerRepository } from '../../src/property-manager/PropertyManagerRepository'
import { expect } from 'chai'
import couchbase from '../../src/db/couchbase'
import { OperatorRepository } from '../../src/operator/models'
import { buildOperator } from '../common'
import { OperatorRoles } from '../../src/types/operator'

describe('PropertyManagerRepository', () => {
  let couchbaseBucket, propertyManagerRepository, operatorRepository

  before(async () => {
    couchbaseBucket = await couchbase()
    propertyManagerRepository = new PropertyManagerRepository(couchbaseBucket)
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

  describe('featured owner management', () => {
    it('sets and retrieves featured owner for a building and property agent', async () => {
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

      const updatedPropertyManager = await propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager(
        'property-manager-user-id',
        'building-id',
        'owner-id'
      )

      expect(updatedPropertyManager.featuredOwners).to.deep.contains({ ownerId: 'owner-id', buildingId: 'building-id' })
    })

    it('updates and retrieves featured owner for a building and property agent', async () => {
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
        },
        featuredOwners: [
          {
            buildingId: 'building-id',
            ownerId: 'owner-id'
          }
        ]
      }))

      const updatedPropertyManager = await propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager(
        'property-manager-user-id',
        'building-id',
        'new-owner-id'
      )

      expect(updatedPropertyManager.featuredOwners).to.not.deep.contains({
        ownerId: 'owner-id',
        buildingId: 'building-id'
      })
      expect(updatedPropertyManager.featuredOwners).to.deep.contains({
        ownerId: 'new-owner-id',
        buildingId: 'building-id'
      })
    })

    it('adds featured owner for a building and property agent keeping others', async () => {
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
        },
        featuredOwners: [
          {
            buildingId: 'building-id',
            ownerId: 'owner-id'
          }
        ]
      }))

      const updatedPropertyManager = await propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager(
        'property-manager-user-id',
        'other-building-id',
        'other-owner-id'
      )

      expect(updatedPropertyManager.featuredOwners).to.deep.contains({
        ownerId: 'owner-id',
        buildingId: 'building-id'
      })
      expect(updatedPropertyManager.featuredOwners).to.deep.contains({
        ownerId: 'other-owner-id',
        buildingId: 'other-building-id'
      })
    })
  })
})

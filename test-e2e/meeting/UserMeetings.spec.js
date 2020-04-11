import { expect } from 'chai'
import moment from 'moment'
import t from 'tcomb'
import { OwnerStatus } from '../../src/types/enums'
import { operatorCreateBusiness } from '../../test/common'
import { authenticatedGet, authenticatedPost, initApplication } from '../rest-api-helper'

const testBuildingId = 'test-building-id'

describe('Users Meetings', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it(`exposes endpoint to get user's meetings`, async () => {
    await authenticatedGet(`/users/${businessUser.id}/meetings`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([])
      })
  })

  it.skip(`retrieves users's meetings`, async () => {
    const owner = await createOwner(app)
    const building = await createBuilding(app, owner)
    await associateBuildingWithOwner(app, owner, building.id)

    const meetingDate = moment().add(1, 'day').hour(12).minute(0)
    const meeting = {
      'createdBy': businessUser.id,
      'notifyTo': businessUser.id,
      'event': {
        'contactId': 'contact-id',
        'ownerId': owner.id,
        'buildingId': building.id,
        'worksheetId': undefined,
        'eventAddress': 'Event Address',
        'eventLocation': { lat: 0, long: 0 },
        'inPerson': true
      },
      'notifyAt': meetingDate.toISOString(),
      'eventDate': meetingDate.toISOString()
    }

    await authenticatedPost(`/scheduled-events/meeting`, businessUser, app, meeting)
      .then(response => {
        expect(response.status).to.be.equal(201)
      })

    await authenticatedGet(`/users/${businessUser.id}/meetings`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([ {} ])
      })
  })
})

const createBuilding = async (app, owner) => {
  const { buildingRepository } = app.locals.dependenciesContainer
  const building = {
    id: testBuildingId,
    buildingType: 'VERTICAL',
    ownerId: owner.id,
    address: {
      street: 'street, address',
      number: '2a',
      postalCode: {
        verified: false
      },
      city: 'BARCELONA'
    },
    location: {}
  }

  return buildingRepository.save(building)
}

const createOwner = async (app) => {
  const { ownerRepository } = app.locals.dependenciesContainer

  return ownerRepository.createOwnerAndPerson({
    status: OwnerStatus.NON_VERIFIED,
    person: {
      name: 'Owner Name'
    }
  })
}

const associateBuildingWithOwner = (app, owner, buildingId) => {
  const updatedOwner = t.update(owner, {buildingId: {$set: buildingId}})
  const {ownerRepository} = app.locals.dependenciesContainer

  return ownerRepository.save(updatedOwner)
}

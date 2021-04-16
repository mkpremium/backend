import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { buildingBuilder } from '../building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import moment from 'moment'
import { Promise } from 'bluebird'

describe('OfferRequestsRepository', () => {
  const testBuilding = buildingBuilder().build()
  const testOwner = ownerBuilder({ buildingId: testBuilding.id }).build()
  let repository
  let flipperNegotiationsRepository
  let buildingsRepository
  let ownersRepository

  before(async () => {
    const container = await createTestContainer()
    buildingsRepository = container.resolve('buildingsRepository')
    ownersRepository = container.resolve('ownersRepository')
    repository = container.resolve('offerRequestsRepository')
    flipperNegotiationsRepository = container.resolve('commercialsBuildingRepository')
  })

  it('adds offer request to flipper negotiations', () => {
    const testOfferRequest = {
      ownerId: testOwner.id,
      destinationContactId: 'email-contact-id',
      reporterContactId: 'phone-reporter-contact-id',
      buildingId: testBuilding.id,
      flipperId: 'flipper-id',
      worksheetId: 'worksheet-id'
    }

    return Promise.all([ buildingsRepository.save(testBuilding), ownersRepository.save(testOwner) ])
      .then(() => repository.add(testOfferRequest))
      .then(async () => {
        const flipperNegotiations = await flipperNegotiationsRepository.listById([ testBuilding.id ])
        expect(flipperNegotiations).to.be.lengthOf(1)
        expect(flipperNegotiations[ 0 ].lastMeeting.inPerson).to.be.false
        expect(moment(flipperNegotiations[ 0 ].lastMeeting.dateMeeting).isSame(moment(), 'day')).to.be.true
      })
  })
})

import { Promise } from 'bluebird'
import { expect } from 'chai'
import moment from 'moment'
import { createTestContainer } from '../../create-test-container'
import { ownerBuilder } from '../../owner/owner.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { buildingBuilder } from '../building.builder'

describe('OfferRequestsRepository', () => {
  const testBuilding = buildingBuilder().build()
  const testOwner = ownerBuilder({ buildingId: testBuilding.id }).build()
  let repository
  let flipperNegotiationsRepository
  let buildingsRepository
  let ownersRepository
  let worksheetRepository

  before(async () => {
    const container = await createTestContainer()
    buildingsRepository = container.resolve('buildingsRepository')
    ownersRepository = container.resolve('ownersRepository')
    worksheetRepository = container.resolve('worksheetRepository')
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
      callerId: 'caller-id',
      worksheetId: 'worksheet-id'
    }

    return Promise.all([
      buildingsRepository.save(testBuilding),
      ownersRepository.save(testOwner),
      worksheetRepository.save(worksheetBuilder({ id: testOfferRequest.worksheetId }).build())
    ])
      .then(() => repository.add(testOfferRequest))
      .then(async () => {
        const flipperNegotiations = await flipperNegotiationsRepository.listById([ testBuilding.id ])
        expect(flipperNegotiations).to.be.lengthOf(1)
        expect(flipperNegotiations[ 0 ].lastMeeting.inPerson).to.be.false
        expect(moment(flipperNegotiations[ 0 ].lastMeeting.dateMeeting).isSame(moment(), 'day')).to.be.true
      })
  })
})

import { Promise as Bluebird } from 'bluebird'
import { expect } from 'chai'
import moment from 'moment'
import { OfferRequestsRepository } from '../../../src/building/repository/offer-requests.repository'
import { ListBuildingsService } from '../../../src/building/service/list-buildings.service'
import { createTestContainer } from '../../create-test-container'
import { ownerBuilder } from '../../owner/owner.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { buildingBuilder } from '../building.builder'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { WorksheetRepository } from '../../../src/worksheet/repository/worksheet.repository'

describe('OfferRequestsRepository', () => {
  const testBuilding = buildingBuilder().build()
  const testOwner = ownerBuilder({ buildingId: testBuilding.id }).build()
  let repository: OfferRequestsRepository
  let listBuildingsService: ListBuildingsService
  let buildingsRepository: BuildingsRepository
  let ownersRepository: OwnerRepository
  let worksheetRepository: WorksheetRepository

  before(async () => {
    const container = await createTestContainer({postgres: false, couchbase: true})
    buildingsRepository = container.resolve('buildingsRepository')
    ownersRepository = container.resolve('ownersRepository')
    worksheetRepository = container.resolve('worksheetRepository')
    repository = container.resolve('offerRequestsRepository')
    listBuildingsService = container.resolve('listBuildingsService')
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

    return Bluebird.all([
      buildingsRepository.save(testBuilding),
      ownersRepository.save(testOwner),
      worksheetRepository.save(worksheetBuilder({ id: testOfferRequest.worksheetId }).build())
    ])
      .delay(200)
      .then(() => repository.add(testOfferRequest))
      .then(async () => {
        const flipperNegotiations = await listBuildingsService.buildingsOfId(testBuilding.id)
        expect(flipperNegotiations).to.be.lengthOf(1)
        expect(flipperNegotiations[ 0 ].lastMeeting.inPerson).to.be.false
        expect(moment(flipperNegotiations[ 0 ].lastMeeting.dateMeeting).isSame(moment(), 'day')).to.be.true
      })
  })
})

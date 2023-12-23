import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { ownerBuilder } from '../../owner/owner.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { buildingBuilder } from '../building.builder'
import { OfferRequestsRepository } from '../../../src/building/repository/offer-requests.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { PostgresOwnersRepository } from '../../../src/owner/repository/postgres-owners.repository'
import { WorksheetRepository } from '../../../src/worksheet/repository/worksheet.repository'
import uuid from 'uuid/v4'
import { Factory } from 'rosie'
import { FlipperRepository } from '../../../src/flipper/flipper.repository'
import { ContactsRepository } from '../../../src/contacts/contacs.repository'
import { CallerRepository } from '../../../src/caller/caller.repository'

describe('PostgresOfferRequestsRepository', () => {
  let repository: OfferRequestsRepository
  let buildingsRepository: BuildingsRepository & BuildingsReadRepository
  let ownersRepository: PostgresOwnersRepository
  let contactsRepository: ContactsRepository
  let worksheetRepository: WorksheetRepository
  let flippersRepository: FlipperRepository
  let callerRepository: CallerRepository

  before(async () => {
    const container = await createTestContainer({ postgres: true, couchbase: false })
    buildingsRepository = container.resolve('postgresBuildingsRepository')
    ownersRepository = container.resolve('postgresOwnersRepository')
    contactsRepository = container.resolve('contactsRepository')
    worksheetRepository = container.resolve('postgresWorksheetRepository')
    flippersRepository = container.resolve('flippersRepository')
    callerRepository = container.resolve('callerRepository')
    repository = container.resolve('postgresOfferRequestsRepository')
  })

  it('adds offer request to flipper negotiations', async () => {
    const testBuilding = await buildingsRepository.save(buildingBuilder({ id: uuid() }).build())
    const testOwner = await ownersRepository.save(ownerBuilder({
      id: uuid(), buildingId: testBuilding.id
    }).build())
    const testWorksheet = await worksheetRepository.save(worksheetBuilder({
      id: uuid(),
      relatedBuildingIds: [ testBuilding.id ]
    }).build())
    const caller = await callerRepository.save(Factory.build('caller'))
    const flipper = await flippersRepository.save(Factory.build('flipper'))
    const destinationContact = await contactsRepository.save(Factory.build('phone-contact', {}))

    const testOfferRequest = {
      ownerId: testOwner.id,
      destinationContactId: destinationContact.id,
      reporterContactId: destinationContact.id,
      buildingId: testBuilding.id,
      flipperId: flipper.id,
      callerId: caller.id,
      worksheetId: testWorksheet.id,
    }

    await repository.add(testOfferRequest)
    const flipperNegotiations = await buildingsRepository.listById([ testBuilding.id ])
    expect(flipperNegotiations).to.be.lengthOf(1)
    // TODO: how to replace the following two assertions?
    // expect(flipperNegotiations[ 0 ].lastMeeting.inPerson).to.be.false
    // expect(moment(flipperNegotiations[ 0 ].lastMeeting.dateMeeting).isSame(moment(), 'day')).to.be.true
  })
})

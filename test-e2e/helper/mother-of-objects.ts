import moment from 'moment'
import t from 'tcomb'
import uuid from 'uuid/v4'
import { OwnerProps, OwnerStatus } from '../../src/owner/owner'
import { ScheduledEventsRepository } from '../../src/scheduled-events/repository/schedule-events.repository'
import { closeSellStock } from '../../src/stock/application'
import { Worksheet } from '../../src/worksheet/domain/worksheet'
import { BuildingProps } from '../../src/building/building'
import { DeepPartial } from 'typeorm'

const testBuildingId = 'test-building-id'
export const testPhoneContactId = 'test-contact-id'
export const testContactPhone = '666666666'
export const testOwnerName = 'Owner Name'
export const testOwnerFirstName = 'Owner First Name'

export const createBuilding = async (app, buildingProperties: DeepPartial<BuildingProps & { owner: OwnerProps }> = {}) => {
  const owner = await (buildingProperties.owner ? Promise.resolve(buildingProperties.owner) : createOwner(app))
  delete buildingProperties.owner
  const legacyBuildingsRepository = app.locals.diContainer.resolve('legacyBuildingsRepository')
  const building = {
    id: testBuildingId,
    buildingType: 'VERTICAL',
    ownerId: owner.id,
    owner: { id: owner.id, address: {} },
    address: {
      street: 'street, address',
      number: '2a',
      postalCode: {
        verified: false
      },
      city: 'BARCELONA'
    },
    location: {},
    ...buildingProperties
  }
  const savedBuilding = await legacyBuildingsRepository.save(building)
  await associateBuildingWithOwner(app, owner, savedBuilding.id)

  return savedBuilding
}

export const createWorksheetForBuilding = (app, building) => {
  const legacyWorksheetRepository = app.locals.diContainer.resolve('legacyWorksheetRepository')
  return legacyWorksheetRepository.save(Worksheet({
    id: uuid(),
    relatedBuildingIds: [ building.id ],
    buildingAddress: building.address,
    status: 'INVALID' as const,
    queueId: null
  }))
}

export const createOwner = async (app, { status } = { status: OwnerStatus.VERIFIED }) => {
  const container = typeof app.resolve === 'function' ? app : app.locals.diContainer
  const ownerRepository = container.resolve('ownersRepository')

  return ownerRepository.save({
    status,
    person: {
      name: testOwnerName,
      firstName: testOwnerFirstName,
      contacts: [
        {
          id: testPhoneContactId,
          type: 'TELEFONO',
          status: 'GOOD',
          value: testContactPhone
        }
      ]
    }
  })
}

export const associateBuildingWithOwner = (app, owner, buildingId) => {
  const updatedOwner = t.update(owner, { buildingId: { $set: buildingId } })
  const ownerRepository = app.locals.diContainer.resolve('ownersRepository')

  return ownerRepository.save(updatedOwner)
}

export const createProposalForBuilding = (app, { propertyAgentId, buildingId, ownerId = 'test-owner-id' }) => {
  const addProposalService = app.locals.diContainer.resolve('addProposalService')

  return addProposalService.addProposal(buildingId, propertyAgentId, {
    ownerId,
    aspiration: -1,
    proposal: 100000
  })
}

const testPurchaseReservationAmount = 50000
const testPurchaseAmount = 100000
const testSaleReservationAmount = 50001
const testSaleAmount = 100001

export const purchaseBuilding = async (app, { buildingId, propertyAgentId }) => {
  const stockService = app.locals.diContainer.resolve('stockService')
  return stockService.purchaseBuilding({
    buildingId,
    reservationAmount: testPurchaseReservationAmount,
    reservationDate: new Date(),
    transactionAmount: testPurchaseAmount,
    transactionDate: new Date()
  }, propertyAgentId)
}

export const sellBuilding = async (app, { buildingId, propertyAgentId }) => {
  const stockSalesService = app.locals.diContainer.resolve('stockSalesService')
  return stockSalesService.sellStock({
    buildingId,
    reservationAmount: testSaleReservationAmount,
    reservationDate: new Date(),
    transactionAmount: testSaleAmount,
    transactionDate: new Date()
  }, propertyAgentId)
}

export const closeBuildingStock = async (app, { buildingId, propertyAgentId }) => {
  return closeSellStock({ buildingId }, propertyAgentId)
}

export const createMeeting = (app, {
  propertyAgentId,
  contactId,
  buildingId,
  ownerId
}) => {
  const meetingDate = moment().add(1, 'day').hour(12).minute(0)
  const meeting = {
    'createdBy': propertyAgentId,
    'notifyTo': propertyAgentId,
    'event': {
      'contactId': contactId,
      'ownerId': ownerId,
      'buildingId': buildingId,
      'worksheetId': undefined,
      'eventAddress': 'Event Address',
      'eventLocation': { lat: 0, long: 0 },
      'inPerson': true
    },
    'notifyAt': meetingDate.toISOString(),
    'eventDate': meetingDate.toISOString()
  }

  const repo = new ScheduledEventsRepository()
  return repo.addScheduledMeetingEvent(meeting, propertyAgentId)
}

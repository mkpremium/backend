import moment from 'moment'
import t from 'tcomb'
import { ScheduledEventsRepository } from '../../src/scheduled-events/models'
import { closeSellStock } from '../../src/stock/application'
import { OwnerStatus } from '../../src/types/enums'
import { WorksheetRepository } from '../../src/worksheet/models/worksheet'

const testBuildingId = 'test-building-id'
export const testPhoneContactId = 'test-contact-id'
export const testContactPhone = '666666666'
export const testOwnerName = 'Owner Name'
export const testOwnerFirstName = 'Owner First Name'

export const createBuilding = async (app, buildingProperties) => {
  const owner = await createOwner(app)
  const { buildingRepository } = app.locals.legacyDependenciesContainer
  const building = {
    ...{
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
      location: {}
    },
    ...buildingProperties
  }
  const savedBuilding = await buildingRepository.save(building)
  await associateBuildingWithOwner(app, owner, savedBuilding.id)

  return savedBuilding
}

export const createWorksheetForBuilding = async (app, building) => {
  await WorksheetRepository.createNewForBuilding(building)
}

export const createOwner = async (app) => {
  const { ownerRepository } = app.locals.legacyDependenciesContainer

  return ownerRepository.createOwnerAndPerson({
    status: OwnerStatus.VERIFIED,
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
  const { ownerRepository } = app.locals.legacyDependenciesContainer

  return ownerRepository.save(updatedOwner)
}

export const createProposalForBuilding = (app, { propertyAgentId, buildingId }) => {
  const { addProposalService } = app.locals.dependenciesContainer

  return addProposalService.addProposal(buildingId, propertyAgentId, {
    aspiration: -1,
    proposal: 100000
  })
}

const testPurchaseReservationAmount = 50000
const testPurchaseAmount = 100000
const testSaleReservationAmount = 50001
const testSaleAmount = 100001

export const purchaseBuilding = async (app, { buildingId, propertyAgentId }) => {
  const { stockService } = app.locals.dependenciesContainer
  return stockService.purchaseBuilding({
    buildingId,
    reservationAmount: testPurchaseReservationAmount,
    reservationDate: new Date(),
    transactionAmount: testPurchaseAmount,
    transactionDate: new Date()
  }, propertyAgentId)
}

export const sellBuilding = async (app, { buildingId, propertyAgentId }) => {
  const { stockSalesService } = app.locals.dependenciesContainer
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

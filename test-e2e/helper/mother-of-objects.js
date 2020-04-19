import t from 'tcomb'
import { closeSellStock, createPurchaseStock, sellPurchasedStock } from '../../src/stock/application'
import { OwnerStatus } from '../../src/types/enums'
import { WorksheetRepository } from '../../src/worksheet/models/worksheet'

const testBuildingId = 'test-building-id'
export const testPhoneContactId = 'test-contact-id'
export const testContactPhone = '666666666'
export const testOwnerName = 'Owner Name'
export const testOwnerFirstName = 'Owner First Name'

export const createBuilding = async (app, owner, options) => {
  const { buildingRepository } = app.locals.dependenciesContainer
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
    ...options
  }

  return buildingRepository.save(building)
}

export const createWorksheetForBuilding = async (app, building) => {
  await WorksheetRepository.createNewForBuilding(building)
}

export const createOwner = async (app) => {
  const { ownerRepository } = app.locals.dependenciesContainer

  return ownerRepository.createOwnerAndPerson({
    status: OwnerStatus.NON_VERIFIED,
    person: {
      name: testOwnerName,
      firstName: testOwnerFirstName,
      contacts: [
        {
          id: testPhoneContactId,
          type: 'TELEFONO',
          value: testContactPhone
        }
      ]
    }
  })
}

export const associateBuildingWithOwner = (app, owner, buildingId) => {
  const updatedOwner = t.update(owner, { buildingId: { $set: buildingId } })
  const { ownerRepository } = app.locals.dependenciesContainer

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
  return createPurchaseStock({
    buildingId,
    reservationAmount: testPurchaseReservationAmount,
    reservationDate: new Date(),
    transactionAmount: testPurchaseAmount,
    transactionDate: new Date()
  }, propertyAgentId)
}

export const sellBuilding = async (app, { buildingId, propertyAgentId }) => {
  return sellPurchasedStock({
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

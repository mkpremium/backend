import t from 'tcomb'
import { OwnerStatus } from '../../src/types/enums'

const testBuildingId = 'test-building-id'
export const testPhoneContactId = 'test-contact-id'
export const testContactPhone = '666666666'
export const testOwnerName = 'Owner Name'

export const createBuilding = async (app, owner) => {
  const { buildingRepository } = app.locals.dependenciesContainer
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
    location: {}
  }

  return buildingRepository.save(building)
}

export const createOwner = async (app) => {
  const { ownerRepository } = app.locals.dependenciesContainer

  return ownerRepository.createOwnerAndPerson({
    status: OwnerStatus.NON_VERIFIED,
    person: {
      name: testOwnerName,
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

export const createProposalForBuilding = (app, propertyAgent, building) => {
  const { addProposalService } = app.locals.dependenciesContainer

  return addProposalService.addProposal(building.id, propertyAgent.id, {
    aspiration: -1,
    proposal: 100000
  })
}

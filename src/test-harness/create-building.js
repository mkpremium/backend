import t from 'tcomb'
import uuid from 'uuid/v4'
import { TypedContactInfo } from '../types/common'
import { OwnerStatus } from '../types/enums'
import { CreateOwnerCmd } from './create-owner'
import { CreateWorksheetRequest } from './create-worksheet'

export const CreateBuildingRequest = t.struct({
  owner: t.maybe(
    t.struct({
      name: t.maybe(t.String),
      firstName: t.maybe(t.String),
      contacts: t.maybe(t.list(TypedContactInfo)),
      status: t.maybe(t.enums.of(Object.values(OwnerStatus)))
    })
  ),
  building: t.maybe(t.struct({
    buildingType: t.maybe(t.String),
    address: t.maybe(t.struct({
      street: t.maybe(t.String),
      number: t.maybe(t.String),
      postalCode: t.maybe(t.struct({
        'number': t.maybe(t.String)
      })),
      'city': t.maybe(t.String)
    }))
  }))
}, { defaultProps: { owner: {}, building: {} } })

export const createBuildingFactory = (buildingRepository, createOwner, createBuildingWorksheet) => async (req) => {
  t.assert(CreateBuildingRequest.is(req))
  const buildingId = uuid()
  const owner = await createOwner(CreateOwnerCmd({ ...req.owner, buildingId }))
  const buildingPrototype = {
    buildingId,
    buildingType: 'VERTICAL',
    ownerId: owner.id,
    address: {
      street: 'street, address',
      number: '2a',
      postalCode: {
        number: '08820',
        verified: false
      },
      city: 'TEST_PORTO'
    },
    isTest: true,
    location: {}
  }
  const building = await buildingRepository.save({ ...buildingPrototype, ...req.building })

  const worksheet = await createBuildingWorksheet(CreateWorksheetRequest({
    building,
    ownerId: owner.id
  }))

  return { building, owner, worksheet }
}

import t from 'tcomb'
import uuid from 'uuid/v4'
import { NegotiationStatus } from '../types/building'
import { CreateOwnerCmd } from './create-owner'
import { CreateWorksheetRequest } from './create-worksheet'

export const CreateBuildingRequest = t.struct({
  owner: t.maybe(
    t.struct({
      name: t.maybe(t.String),
      firstName: t.maybe(t.String),
      contacts: t.maybe(t.list(t.String)),
      status: t.maybe(NegotiationStatus)
    })
  )
}, {
  defaultProps: {
    owner: {}
  }
})

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
      city: 'TEST_PORTO',
      isTest: true
    },
    location: {}
  }
  const building = await buildingRepository.save({ ...buildingPrototype, ...req.building })

  await createBuildingWorksheet(CreateWorksheetRequest({
    building,
    ownerId: owner.id
  }))

  return building
}

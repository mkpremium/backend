import _ from 'lodash'
import t from 'tcomb'
import { Building } from '../building/building'
import { TypedContactInfo } from '../owner/contact'
import { OwnerStatus } from '../owner/owner'
import { createBuildingReq, createOwnerCmd } from './fake-data-generator'
import { CreateOwnerCmd } from './create-owner'
import { CreateWorksheetRequest } from './create-worksheet'

export const CreateBuildingRequest = t.struct({
  owner: t.maybe(t.struct({
    name: t.maybe(t.String),
    firstName: t.maybe(t.String),
    contacts: t.maybe(t.list(TypedContactInfo)),
    status: t.maybe(t.enums.of(Object.values(OwnerStatus)))
  })),
  building: t.maybe(t.struct({
    buildingType: t.maybe(t.String),
    address: t.maybe(t.struct({
      street: t.maybe(t.String),
      number: t.maybe(t.String),
      postalCode: t.maybe(t.struct({
        number: t.maybe(t.String)
      })),
      city: t.maybe(t.String)
    }))
  })
  )
})

export const createBuildingFactory = (buildingsRepository, createOwner, createBuildingWorksheet) => async (req) => {
  t.assert(CreateBuildingRequest.is(req))
  const fakedRequest = createBuildingReq()
  const nbOfOwners = 1 + ((Math.random() * 10) % 2) // [1, 3]
  const building = await buildingsRepository.save(
    t.update(
      Building({ ...fakedRequest.building, isTest: true }),
      { $merge: req.owner }
    )
  )
  const ownersRequest = _.times(nbOfOwners, () => createOwnerCmd(building.id))
  const createOwnerCommands = ownersRequest.map(o => CreateOwnerCmd(o))

  const owners = await Promise.all(createOwnerCommands.map(cmd => createOwner(cmd)))

  const worksheet = await createBuildingWorksheet(CreateWorksheetRequest({
    building: building,
    ownersId: owners.map(({ id }) => id)
  }))

  return { building: building, owners, worksheet }
}

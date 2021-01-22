import t from 'tcomb'
import uuid from 'uuid/v4'
import { Building } from '../building/building'
import { createBuildingReq } from './fake-data-generator'
import { TypedContactInfo } from '../types/common'
import { OwnerStatus } from '../types/enums'
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

export const createBuildingFactory = (legacyBuildingsRepository, createOwner, createBuildingWorksheet) => async (req) => {
  t.assert(CreateBuildingRequest.is(req))
  const buildingId = uuid()
  const fakedRequest = createBuildingReq(buildingId)
  const createOwnerCommands = fakedRequest.owners.map(o => CreateOwnerCmd(o))

  const owners = await Promise.all(createOwnerCommands.map(cmd => createOwner(cmd)))
  const savedBuilding = await legacyBuildingsRepository.save(
    t.update(
      Building({ ...fakedRequest.building, isTest: true, ownerId: owners[ 0 ].id }),
      { $merge: req.owner }
    )
  )

  const worksheet = await createBuildingWorksheet(CreateWorksheetRequest({
    building: savedBuilding,
    ownersId: owners.map(({ id }) => id)
  }))

  return { building: savedBuilding, owners, worksheet }
}

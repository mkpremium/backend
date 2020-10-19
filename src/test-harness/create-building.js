import t from 'tcomb'
import uuid from 'uuid/v4'
import { Building } from '../types/building'
import { createBuildingReq } from './fake-data-generator'
import { TypedContactInfo } from '../types/common'
import { OwnerStatus } from '../types/enums'
import { CreateOwnerCmd } from './create-owner'
import { CreateWorksheetRequest } from './create-worksheet'

export const CreateBuildingRequest = t.struct({
  owner: t.struct({
    name: t.maybe(t.String),
    firstName: t.maybe(t.String),
    contacts: t.maybe(t.list(TypedContactInfo)),
    status: t.maybe(t.enums.of(Object.values(OwnerStatus)))
  }),
  building: t.struct({
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
}, { defaultProps: { owner: {}, building: {} } })

export const createBuildingFactory = (buildingRepository, createOwner, createBuildingWorksheet) => async (req) => {
  t.assert(CreateBuildingRequest.is(req))
  const buildingId = uuid()
  const fakedRequest = createBuildingReq(buildingId)
  const createOwnerCmd = CreateOwnerCmd(
    t.update(CreateOwnerCmd({ ...fakedRequest.owner }), { $merge: req.owner })
  )

  const owner = await createOwner(createOwnerCmd)
  const savedBuilding = await buildingRepository.save(
    t.update(
      Building({ ...fakedRequest.building, isTest: true, ownerId: owner.id }),
      { $merge: req.owner }
    )
  )

  const worksheet = await createBuildingWorksheet(CreateWorksheetRequest({
    building: savedBuilding,
    ownerId: owner.id
  }))

  return { building: savedBuilding, owner, worksheet }
}

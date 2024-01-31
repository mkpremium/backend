import { faker } from '@faker-js/faker/locale/es'
import _ from 'lodash'
import t from 'tcomb'
import { Building } from '../building/building'
import { TypedContactInfo } from '../owner/contact'
import { OwnerStatus } from '../owner/owner'
import { createBuildingReq, createOwnerCmd } from './fake-data-generator'
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

export const createBuildingFactory = (buildingsRepository, addOwnerService, createBuildingWorksheet) => async (req) => {
  t.assert(CreateBuildingRequest.is(req))
  const fakedRequest = createBuildingReq()
  const nbOfOwners = faker.number.int({ min: 1, max: 3 })
  const building = await buildingsRepository.save(
    t.update(
      Building({ ...fakedRequest.building, isTest: true }),
      { $merge: req.owner }
    )
  )
  const addOwnerCommands = _.times(nbOfOwners, () => createOwnerCmd(building.id))
  const owners = await Promise.all(addOwnerCommands.map(cmd => addOwnerService.addOwner(cmd)))

  const worksheet = await createBuildingWorksheet(CreateWorksheetRequest({
    building,
    ownersId: owners.map(({ id }) => id)
  }))

  return { building, owners, worksheet }
}

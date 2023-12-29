import faker from 'faker/locale/es'
import uuid from 'uuid/v4'
import { OwnerType } from '../owner/owner'
import _ from 'lodash'

export const createOwnerCmd = buildingId => {
  const ownerFirstName = faker.name.firstName()
  const ownerLastName = faker.name.lastName()
  const nbOfContacts = 1 + ((Math.random() * 10) % 5) // [1, 6]

  return {
    buildingId,
    name: `${ownerFirstName} ${ownerLastName}`,
    firstName: ownerFirstName,
    status: faker.helpers.shuffle([ 'VERIFICADO', 'NO_VERIFICADO' ])[ 0 ],
    type: faker.helpers.shuffle(Object.values(OwnerType))[ 0 ],
    contacts: _.times(nbOfContacts, () => ({
      id: uuid(),
      type: 'TELEFONO',
      value: faker.phone.phoneNumber('9########'),
      status: faker.helpers.shuffle([ 'UNDEFINED', 'GOOD' ])[ 0 ]
    }))
  }
}

export const createBuildingReq = (buildingId) => {
  const streetNumber = faker.datatype.number().toString()
  const nbOfOwners = 1 + ((Math.random() * 10) % 2) // [1, 3]

  return ({
    building: {
      id: buildingId,
      buildingType: faker.helpers.shuffle([ 'VERTICAL', 'HORIZONTAL' ])[ 0 ],
      address: {
        street: `${faker.address.streetName()}`,
        number: streetNumber,
        postalCode: {
          number: faker.address.zipCode()
        },
        city: 'BARCELONA',
        province: 'BARCELONA'
      },
      location: {}
    },
    owners: _.times(nbOfOwners, () => createOwnerCmd(buildingId))
  })
}

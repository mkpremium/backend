import faker from 'faker/locale/es'
import uuid from 'uuid/v4'
import { OwnerType } from '../types/enums'

export const createOwnerCmd = buildingId => {
  const ownerFirstName = faker.name.firstName()
  const ownerLastName = faker.name.lastName()

  return {
    buildingId,
    name: `${ownerFirstName} ${ownerLastName}`,
    firstName: ownerFirstName,
    status: faker.helpers.shuffle([ 'VERIFICADO', 'NO_VERIFICADO' ])[ 0 ],
    type: faker.helpers.shuffle(Object.values(OwnerType))[ 0 ],
    contacts: [
      {
        id: uuid(),
        type: 'TELEFONO',
        value: faker.phone.phoneNumber('9########'),
        status: faker.helpers.shuffle([ 'UNDEFINED', 'GOOD' ])[ 0 ]
      }
    ]
  }
}

export const createBuildingReq = (buildingId) => {
  const streetNumber = faker.random.number().toString()

  return ({
    building: {
      id: buildingId,
      buildingType: faker.helpers.shuffle([ 'VERTICAL', 'HORIZONTAL' ])[ 0 ],
      address: {
        street: `${faker.address.streetName()}, ${streetNumber}`,
        number: streetNumber,
        postalCode: {
          number: faker.address.zipCode()
        },
        city: 'TEST_PORTO'
      },
      location: {}
    },
    owner: createOwnerCmd(buildingId)
  })
}

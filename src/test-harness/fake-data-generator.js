import faker from 'faker/locale/es'
import uuid from 'uuid/v4'
import { OwnerStatus, OwnerType } from '../types/enums'

const streetNumber = faker.random.number().toString()
const ownerFirstName = faker.name.firstName()
const ownerLastName = faker.name.lastName()
export const createBuildingReq = () => ({
  building: {
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
  owner: {
    name: `${ownerFirstName} ${ownerLastName}`,
    firstName: ownerFirstName,
    status: faker.helpers.shuffle(Object.values(OwnerStatus))[ 0 ],
    type: faker.helpers.shuffle(Object.values(OwnerType))[ 0 ],
    contacts: [
      {
        id: uuid(),
        type: 'TELEFONO',
        value: faker.phone.phoneNumber(),
        status: faker.helpers.shuffle([ 'UNDEFINED', 'GOOD', 'BAD' ])[ 0 ]
      }
    ]
  }
})

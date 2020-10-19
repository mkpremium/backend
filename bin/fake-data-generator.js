import faker from 'faker/locale/es'
import uuid from 'uuid/v4'
import { OwnerStatus, OwnerType } from '../src/types/enums'

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

const t = {
  'owner': {
    'name': 'Francisca Soliz',
    'firstName': 'Francisca',
    'status': 'ENTE_PUBLICO',
    'type': 'FAMILIAR',
    'contacts': [
      {
        'id': '15e3ef8c-9f22-445b-9f3e-0e8810161a1d',
        'type': 'TELEFONO',
        'status': 'BAD'
      }
    ]
  },
  'req': {},
  'mixed': {
    'type': 'FAMILIAR'
  },
  'cmd': {
    'name': 'Owner Full Name',
    'status': 'NO_VERIFICADO',
    'buildingId': '41479e72-b147-4eca-820b-f53819d4d147',
    'type': 'FAMILIAR'
  }
}

console.log({ ...t.owner, ...t.req })

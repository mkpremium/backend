import { faker } from '@faker-js/faker/locale/es'
import uuid from 'uuid/v4'
import { OwnerType } from '../owner/owner'
import _ from 'lodash'

export const createOwnerCmd = (buildingId: string) => {
  const ownerFirstName = faker.person.firstName()
  const ownerLastName = faker.person.lastName()
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
      value: faker.helpers.fromRegExp('9########'),
      status: faker.helpers.shuffle([ 'UNDEFINED', 'GOOD' ])[ 0 ]
    }))
  }
}

export const createBuildingReq = (buildingId) => {
  const streetNumber = faker.number.int().toString()
  const nbOfOwners = 1 + ((Math.random() * 10) % 2) // [1, 3]
  const [ province, city ] = generateCityAndProvince()

  return ({
    building: {
      id: buildingId,
      buildingType: faker.helpers.shuffle([ 'VERTICAL', 'HORIZONTAL' ])[ 0 ],
      address: {
        street: faker.location.street(),
        number: streetNumber,
        postalCode: {
          number: faker.location.zipCode()
        },
        province,
        city,
      },
      location: {}
    },
    owners: _.times(nbOfOwners, () => createOwnerCmd(buildingId))
  })
}

function generateCityAndProvince () {
  const weightedCitiesAndProvinces = [
    [
      'BARCELONA',
      [
        {
          'weight': 76,
          'city': 'BADALONA'
        },
        {
          'weight': 866,
          'city': 'L\'HOSPITALET DE LLOBREGAT'
        },
        {
          'weight': 62,
          'city': 'SANTA COLOMA DE GRAMENET'
        },
        {
          'weight': 7817,
          'city': 'BARCELONA'
        }
      ]
    ],
    [
      'ILLES BALEARS',
      [
        {
          'weight': 2657,
          'city': 'PALMA'
        }
      ]
    ],
    [
      'LISBOA',
      [
        {
          'weight': 10477,
          'city': 'LISBOA'
        }
      ]
    ],
    [
      'LISBOA.',
      [
        {
          'weight': 7,
          'city': 'LISBOA.'
        }
      ]
    ],
    [
      'Lisboa',
      [
        {
          'weight': 1763,
          'city': 'Lisboa'
        }
      ]
    ],
    [
      'MADRID',
      [
        {
          'weight': 7354,
          'city': 'MADRID'
        }
      ]
    ],
    [
      'MÁLAGA',
      [
        {
          'weight': 7216,
          'city': 'MALAGA'
        }
      ]
    ],
    [
      'PORTO',
      [
        {
          'weight': 12244,
          'city': 'PORTO'
        },
        {
          'weight': 878,
          'city': 'VILA NOVA DE GAIA'
        }
      ]
    ],
    [
      'PORTO.',
      [
        {
          'weight': 17,
          'city': 'PORTO.'
        }
      ]
    ],
    [
      'Porto',
      [
        {
          'weight': 4286,
          'city': 'Porto'
        }
      ]
    ],
    [
      'SEVILLA',
      [
        {
          'weight': 6468,
          'city': 'SEVILLA'
        }
      ]
    ],
    [
      'VALENCIA',
      [
        {
          'weight': 5926,
          'city': 'VALENCIA'
        }
      ]
    ]
  ] as [ string, { weight: number, city: string }[] ][]
  const weightedProvinces = weightedCitiesAndProvinces.map(
    ([ province, cities ]) => ({
        value: province,
        weight:
          cities.reduce((count, { weight }) => count + weight, 0)
      }
    ))
  const province =  faker.helpers.weightedArrayElement(weightedProvinces)
  const cities = weightedCitiesAndProvinces.find(([ p ]) => p === province)![ 1 ]
  const city = faker.helpers.weightedArrayElement(cities.map(({ city, weight }) => ({ value: city, weight })))

  return [`TEST_${province}`, `TEST_${city}`]
}

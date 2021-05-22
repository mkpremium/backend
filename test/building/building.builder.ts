import { Building, BuildingProps } from '../../src/building/building'

const buildingPrototype = {
  id: 'test-building-id',
  buildingType: 'VERTICAL',
  address: {
    street: 'street, address',
    number: '2a',
    postalCode: {
      number: '0000',
      verified: false
    },
    city: 'BARCELONA'
  },
  location: {}
}

export const buildingBuilder = (overrides = {}) => {
  return {
    build (): BuildingProps {
      return Building({ ...buildingPrototype, ...overrides } as any)
    }
  }
}

import { Building, BuildingProps } from '../../src/building/building'
import uuid from 'uuid/v4'

const buildingPrototype: Omit<BuildingProps, 'id'> = {
  negotiationStatus: undefined,
  floorArea: 0,
  metadata: [],
  address: {
    type: 'CL',
    street: 'street, address',
    number: '2a',
    fullAddress: '',
    province: '',
    neighborhood: '',
    postalCode: {
      number: '0000',
      verified: false
    },
    city: 'BARCELONA'
  },
  location: {
    lat: 0,
    lng: 0
  }
}

export const buildingBuilder = (overrides: Partial<BuildingProps> = {}) => {
  return {
    build (): BuildingProps {
      return Building({ id: uuid(), ...buildingPrototype, ...overrides } as any)
    }
  }
}

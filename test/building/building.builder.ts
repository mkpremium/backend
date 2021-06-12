import { Building, BuildingProps } from '../../src/building/building'

const buildingPrototype: BuildingProps = {
  negotiationStatus: undefined,
  id: 'test-building-id',
  floorArea: 0,
  address: {
    type: 'CL',
    street: 'street, address',
    number: '2a',
    fullAddress: '',
    province: '',
    neighborhood: '',
    postalCode: {
      number: '0000',
      verified: false,
    },
    city: 'BARCELONA',
  },
  location: {
    lat: 0,
    lng: 0,
  }
}

export const buildingBuilder = (overrides: Partial<BuildingProps> = {}) => {
  return {
    build (): BuildingProps {
      return Building({ ...buildingPrototype, ...overrides } as any)
    }
  }
}

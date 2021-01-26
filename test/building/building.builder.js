import { Building } from '../../src/building/building'

export const buildingBuilder = () => {
  return {
    build () {
      return Building({
        id: 'test-building-id',
        buildingType: 'VERTICAL',
        address: {
          street: 'street, address',
          number: '2a',
          postalCode: {
            verified: false
          },
          city: 'BARCELONA'
        },
        location: {}
      })
    }
  }
}

import { CadastreApi } from '../../src/cadastre/api'
import {
  fakeBuildingByAddress,
  fakeBuildingByCadastre,
  fakeByCadastre,
  fakeCities,
  fakeProvinces,
  fakeStreets
} from './constants'

function findById (id) {
  return (item) => item.id === id
}

describe('cadastre/api', () => {
  const api = new CadastreApi({
    PROVINCES: fakeProvinces,
    CITIES: fakeCities,
    STREETS: fakeStreets,
    BUILDING_BY_ADDRESS: fakeBuildingByAddress,
    BUILDING_BY_CADASTRE: fakeBuildingByCadastre,
    LOCATION_BY_CADASTRE: fakeByCadastre
  })

  describe('fetchCities', () => {
    it('able to fetch a list of provinces by city', async () => {
      const cities = await api.fetchCities('BARCELONA')
      cities.should.be.an('array')
      cities.length.should.not.equal(0)
      const city = cities.find(findById('19'))
      city.id.should.equal('19')
      city.name.should.equal('BARCELONA')
    })
  })

  describe('fetchProvinces', () => {
    it('able to fetch a list of provinces', async () => {
      const provinces = await api.fetchProvinces()
      provinces.should.be.an('array')
      provinces.length.should.not.equal(0)
      const province = provinces.find(findById('15'))
      province.id.should.equal('15')
      province.name.should.equal('A CORUÑA')
    })
  })

  describe('fetchStreets', () => {
    it('able to fetch a list of provinces', async () => {
      const provinces = await api.fetchStreets('BARCELONA', 'L\'HOSPITALET DE LLOBREGAT')

      provinces.should.be.an('array')
      provinces.length.should.not.equal(0)
      const province = provinces.find(findById('893'))
      province.id.should.equal('893')
      province.name.should.equal('ZONA FRANCA DE LA')
      province.type.should.equal('CM')
      province.typeName.should.be.an('array')
      province.typeName.should.be.an('array')
      province.typeName.should.eql(['CAMINO', 'CARMEN'])
    })
  })

  describe('fetchBuildingByAddress', () => {
    it.skip('able to fetch cadastre by using normalized building address', async () => {
      const resultBuilding = await api.fetchBuildingByAddress(
        {
          province: 'MADRID',
          city: 'MADRID',
          street: {
            type: 'PZ',
            name: 'TIRSO DE MOLINA'
          },
          number: '8'
        }
      )

      const building = {
        address: {
          city: 'MADRID',
          fullAddress: 'PZ TIRSO DE MOLINA 8 MADRID',
          number: '8',
          postalCode: {
            number: '28012'
          },
          province: 'MADRID',
          street: 'TIRSO DE MOLINA',
          type: 'PZ'
        },
        buildingDate: '1900',
        cadastre: {
          address: 'PZ TIRSO DE MOLINA 8 28012 MADRID (MADRID)',
          reference: '0339101VK4703G0001WK'
        },
        coefficient: '100,000000',
        elements: {
          average: 291.1,
          commons: 341,
          number: 10
        },
        entities: [
          {
            door: 'DR',
            plant: '00',
            surface: '282',
            type: 'COMERCIO'
          },
          {
            door: 'IZ',
            plant: '00',
            surface: '274',
            type: 'COMERCIO'
          },
          {
            door: 'DR',
            plant: '01',
            surface: '353',
            type: 'VIVIENDA'
          },
          {
            door: 'IZ',
            plant: '01',
            surface: '245',
            type: 'VIVIENDA'
          },
          {
            door: 'DR',
            plant: '02',
            surface: '436',
            type: 'VIVIENDA'
          },
          {
            door: 'IZ',
            plant: '02',
            surface: '162',
            type: 'VIVIENDA'
          },
          {
            door: 'DR',
            plant: '03',
            surface: '159',
            type: 'VIVIENDA'
          },
          {
            door: '01',
            plant: '-1',
            surface: '659',
            type: 'ALMACEN'
          },
          {
            door: 'ES',
            plant: 'CC',
            surface: '156',
            type: 'VIVIENDA'
          },
          {
            door: 'UN',
            plant: 'OM',
            surface: '185',
            type: 'ALMACEN'
          }
        ],
        floorArea: '2911',
        propertyType: 'UR',
        use: 'Residencial'
      }

      resultBuilding.should.eql(building)
    })
  })

  describe('fetchLocationByCadastre', async () => {
    it('able to fetch building location by using cadastreReference', async () => {
      const location = await api.fetchLocationByCadastre('7398504DF2779G')
      location.should.be.an('object')
      location.lat.should.equal(41.36566014092729)
      location.lng.should.equal(2.128741678304813)
    })
  })

  describe('fetchBuildingByCadastre', async () => {
    it.skip('able to fetch building info by using cadastreReference', async () => {
      const resultBuilding = await api.fetchBuildingByCadastre('1448401VK4714G0001EH')
      const building = {
        address: {
          city: "L'HOSPITALET DE LLOBREGAT",
          fullAddress: "CL UNIO DE LA 41 L'HOSPITALET DE LLOBREGAT",
          number: '41',
          postalCode: {
            number: '08902'
          },
          province: 'BARCELONA',
          street: 'UNIO DE LA',
          type: 'CL'
        },
        buildingDate: '2001',
        cadastre: {
          address: "CL UNIO DE LA 41(B) Es:1 Pl:-1 Pt:01 08902 L'HOSPITALET DE LLOBREGAT (BARCELONA)",
          reference: '7398504DF2779G0001LO'
        },
        coefficient: '0,160000',
        elements: {
          average: 11,
          commons: 11,
          number: 1
        },
        entities: [
          {
            door: '01',
            plant: '-1',
            surface: '11',
            type: 'APARCAMIENTO'
          }
        ],
        floorArea: '22',
        propertyType: 'UR',
        use: 'Almacen-Estacionamiento'
      }
      resultBuilding.should.eql(building)
    })
  })
})

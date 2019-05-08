import {CadastreApi} from '../../src/cadastre/api';
import {fakeByAddress, fakeByCadastre, fakeCities, fakeProvinces, fakeStreets} from './constants';

function findById(id) {
  return (item) => item.id === id;
}

describe('cadastre/api', () => {
  const api = new CadastreApi({
    PROVINCES: fakeProvinces,
    CITIES: fakeCities,
    STREET: fakeStreets,
    BY_ADDRESS: fakeByAddress,
    BY_CADASTRE: fakeByCadastre
  });

  describe('fetchCities', () => {
    it('able to fetch a list of provinces by city', async() => {
      const cities = await api.fetchCities('BARCELONA');
      cities.should.be.an('array');
      cities.length.should.not.equal(0);
      const city = cities.find(findById('19'));
      city.id.should.equal('19');
      city.name.should.equal('BARCELONA');
    });
  });

  describe('fetchProvinces', () => {
    it('able to fetch a list of provinces', async() => {
      const provinces = await api.fetchProvinces();
      provinces.should.be.an('array');
      provinces.length.should.not.equal(0);
      const province = provinces.find(findById('15'));
      province.id.should.equal('15');
      province.name.should.equal('A CORUÑA');
    });
  });

  describe('fetchStreets', () => {
    it('able to fetch a list of provinces', async() => {
      const provinces = await api.fetchStreets('BARCELONA', 'L\'HOSPITALET DE LLOBREGAT');

      provinces.should.be.an('array');
      provinces.length.should.not.equal(0);
      const province = provinces.find(findById('893'));
      province.id.should.equal('893');
      province.name.should.equal('ZONA FRANCA DE LA');
      province.type.should.equal('CM');
      province.typeName.should.be.an('array');
      province.typeName.should.be.an('array');
      province.typeName.should.eql(['CAMINO', 'CARMEN']);
    });
  });

  describe('fetchCadastreByAddress', () => {
    it('able to fetch cadastre by using normalized building address', async() => {
      const reference = await api.fetchCadastreByAddress({
        province: 'BARCELONA',
        city: 'L\'HOSPITALET DE LLOBREGAT',
        street: {
          type: 'AV',
          name: 'CARRILET DEL'
        },
        number: '50'
      });

      reference.should.equal('7398504DF2779G');
    });
  });

  describe('fetchLocationByCadastre', async() => {
    it('able to fetch building location by using cadastreReference', async() => {
      const location = await api.fetchLocationByCadastre('7398504DF2779G');
      location.should.be.an('object');
      location.lat.should.equal(41.36566014092729);
      location.lng.should.equal(2.128741678304813);
    });
  });
});

import {CadastreRepository} from '../../src/cadastre/models';
import {deleteAll} from '../common';

describe('cadastre/model', () => {
  describe('getProvinces', () => {
    // before(async() => deleteAll());
    it('fetch fresh data from cadastre', async() => {
      const repo = new CadastreRepository();
      const provinces = await repo.getProvinces();
      provinces.should.be.an('array');
      provinces.length.should.not.equal(0);
    });

    it('fetch cached data from cadastre', async function() {
      // force to finalice before be able to do request
      this.timeout(1000);
      const repo = new CadastreRepository();
      const provinces = await repo.getProvinces();
      provinces.should.be.an('array');
      provinces.length.should.not.equal(0);
    });
  });

  describe('getCities', () => {
    it('fetch fresh data from cadastre', async() => {
      const repo = new CadastreRepository();
      const results = await repo.getCitiesByProvince('BARCELONA');
      results.should.be.an('array');
      results.length.should.not.equal(0);
    });

    it('fetch cached data from cadastre', async function() {
      // force to finalice before be able to do request
      this.timeout(1000);
      const repo = new CadastreRepository();
      const results = await repo.getCitiesByProvince('BARCELONA');
      results.should.be.an('array');
      results.length.should.not.equal(0);
    });
  });
});

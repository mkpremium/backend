import {join} from 'path';
import sinon from 'sinon';

import {csvToJson} from '../../../src/migration/lib';
import migrateFromCsv from '../../../src/migration/models/building';

const filename = join(__dirname, '../../fixtures/sample_buildings.csv');

describe('migration.models', () => {
  describe('building', () => {
    it('migrateFromCsv()', async() => {
      const migratedData = [];

      const spy = sinon.spy();
      const processFunc = data => {
        spy();
        migratedData.push(migrateFromCsv(data));
      };
      await csvToJson(filename, processFunc);
      spy.should.have.been.callCount(3);
      migratedData.should.have.length(3);

      migratedData[0].address.should.be.a('object');
      migratedData[0].address.postalCode.number.should.equal(8019);
      migratedData[0].cadastre.should.be.a('object');
      migratedData[0].cadastre.reference.should.equal('5431505DF2853A0001WA');

      migratedData[2].owner.should.be.a('object');
      migratedData[2].owner.phones.should.have.length(2);
      migratedData[2].owner.phones[0].should.be.a('object');
    });
  });
});

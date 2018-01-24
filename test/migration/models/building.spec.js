import {join} from "path";
import sinon from "sinon";

import {csvToJson} from "../../../src/migration/lib";
import migrateFromCsv from "../../../src/migration/models/building";

const filename = join(__dirname, '../../fixtures/sample_buildings.csv');

describe('migration.models', () => {
  describe('building', () => {
    it('migrateFromCsv()', async () => {

      const spy = sinon.spy();
      const processFunc = data => {
        spy();
        const building = migrateFromCsv(data);
        console.log(JSON.stringify(building, null, 2));
      };
      await csvToJson(filename, processFunc);
      spy.should.have.been.callCount(2);
    });
  });
});

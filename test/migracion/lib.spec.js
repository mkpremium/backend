import {csvToJson} from "../../src/migration/lib";

import chai from 'chai';
import sinon from 'sinon';
import sc from 'sinon-chai';

import {join} from 'path';

chai.should();
chai.use(sc);

describe('migration.lib', () => {
  describe('csvToJson()', () => {
    it('parse sample.csv', async () => {
      const filepath = join(__dirname, '../fixtures/sample.csv');
      const spy = sinon.spy();
      const processFunc = () => {
        spy();
      };

      await csvToJson(filepath, processFunc);
      spy.should.have.been.callCount(3);
    });
  })
});

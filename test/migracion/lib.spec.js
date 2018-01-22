import {csvToJson} from "../../src/migration/lib";

import chai from 'chai';
import sinon from 'sinon';
import sc from 'sinon-chai';

import {join} from 'path';

import Promise from 'bluebird';

chai.should();
chai.use(sc);

const filename = join(__dirname, '../fixtures/sample.csv');

describe('migration.lib', () => {
  describe('csvToJson()', () => {
    it('parse sample.csv', async () => {

      const spy = sinon.spy();
      const processFunc = () => spy();

      await csvToJson(filename, processFunc);
      spy.should.have.been.callCount(3);
    });

    it('allow perform async code on processFunc @slow', async () => {
      const spy = sinon.spy();
      const processFunc = async() => {
        await Promise.delay(1000);
        spy();
      };

      await csvToJson(filename, processFunc);
      spy.should.have.been.callCount(3);
    });
  })
});

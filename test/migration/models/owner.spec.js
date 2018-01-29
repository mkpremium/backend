import {join} from "path";
import sinon from "sinon";

import migrateFromCsv, {combineDuplicatesDocumentNumber} from "../../../src/migration/models/owner";
import {csvToJson} from "../../../src/migration/lib";

const filename = join(__dirname, '../../fixtures/sample_owners.csv');
const csv = join(__dirname, '../../../csv/PROPIETARIOS.csv');

describe('migration.models', () => {
  describe('owner', () => {
    const migratedData = [];
    const spy = sinon.spy();
    before(async() => {
      const processFunc = data => {
        spy();

        const {person, owner} = migrateFromCsv(data);
        migratedData.push(person);
        migratedData.push(owner);
      };

      await csvToJson(filename, processFunc);
    });

    it('migrateFromCsv()', () => {
      spy.should.have.been.callCount(26);
      migratedData.should.have.length(52);

      const personsWithContact = migratedData.filter( o => o.name === 'Tena Lafaja Pilar');
      personsWithContact.should.have.length(1);
      personsWithContact[0].contacts.should.have.length(1);
      migratedData
        .filter( o => o._documentType === 'owner')
        .should.have.length(26);

      migratedData
        .filter( o => o._documentType === 'person')
        .should.have.length(26);
    });

    it('combineDuplicatesDocumentNumber()', async () => {
      const combinedData = combineDuplicatesDocumentNumber(migratedData);
      combinedData
        .filter( o => o._documentType === 'person')
        .should.have.length(21);
      combinedData
        .filter( o => o._documentType === 'owner')
        .should.have.length(26);
    });

    it('migrateFromCsv() PROPIETARIOS.csv @slow', async () => {
      const migratedData = [];
      const spy = sinon.spy();

      const processFunc = data => {
        spy();

        const {person, owner} = migrateFromCsv(data);
        migratedData.push(person);
        migratedData.push(owner);
      };

      await csvToJson(csv, processFunc);

      spy.should.have.been.callCount(6293);
      migratedData.should.have.length(6293 * 2);

      const combinedData = combineDuplicatesDocumentNumber(migratedData);
      combinedData.should.have.length(12280);
    }).timeout(0);
  });
});

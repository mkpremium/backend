import debug from 'debug';
import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import {PersonRepository} from '../../src/owner/models';
import t from 'tcomb';
import {cleanObjectKeys, removeNullValues} from "../../src/migration/models/models-helper";

const debugMigrate = debug('app:migration:owners-add-phone');

export const Input = t.struct({
  id_fornitore: t.Str,
  cellulare: t.maybe(t.Str)
});

export async function migrateOwnersPhones(inputFile, bucket) {
  const migration = new MigrateOwnerPhone(inputFile, bucket);
  return migration.run();
}

class MigrateOwnerPhone extends MigrateModelV3 {
  async processFunc(data, row) {
    try {
      await Promise.resolve(this.parseToData(data, row));
    } catch (error) {
      console.error('Migrate verify-owners error:', error.message, 'at', row, data);
    }
  }
  
  async parseToData(data, row) {
    const input = Input(removeNullValues(cleanObjectKeys(data)));
    const migrateOwnerId = input.id_fornitore;
    
    if (input.cellulare) {
      
      debugMigrate('\nStart process for row with Id_Fornitore:', data['Id_Fornitore']);
      const personRepository = new PersonRepository();
      const person = await personRepository.findByMigrateOwnerId(migrateOwnerId, true);
      await MigrateOwnerPhone.addPersonContact(person, input.cellulare);
      debugMigrate('Finished process with Id_Fornitore:', data['Id_Fornitore']);
    } else {
      // no-op
    }
  }
  
  /**
   * Adds person contacts.
   * @returns {Promise<void>}
   */
  static async addPersonContact(person, newPhone) {
    const personRepository = new PersonRepository();
    const updatedContacts = t.update(person.contacts, {$push: [{
        type: 'TELEFONO',
        value: newPhone
      }]});
    const updatedPerson = t.update(person, {contacts: {$merge: updatedContacts}});
    await personRepository.save(updatedPerson);
  }
}

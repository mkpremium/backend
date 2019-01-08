import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import {PersonRepository} from '../../src/owner/models';
import parse from '../../src/migration/models/owner';
import merge from 'deepmerge';
import t from 'tcomb';

export async function migrateOwners(inputFile, bucket) {
  const migrateOwners = new MigrateOwner(inputFile, bucket);
  return migrateOwners.run();
}

class MigrateOwner extends MigrateModelV3 {
  async parseToData(data, row) {
    const {person, owner} = parse(data);
    const currentPerson = await MigrateOwner.findPerson(person.name);
    let updatedOwner = owner;
    if (currentPerson) {
      const mergedPerson = merge(person, currentPerson);
      updatedOwner = t.update(owner, {
        personId: {$set: mergedPerson.id},
        person: {$set: mergedPerson}
      });
    } else {
      await this.pushToDatabase(person);
    }

    await this.pushToDatabase(updatedOwner);
  }

  static async findPerson(name) {
    const cleanName = name.replace(/\d/g, '').trim();
    const repo = new PersonRepository();
    const qb = repo.getQueryBuilder()
      .where('t.name = ?', cleanName);
    const [person] = await repo.query(qb);

    return person;
  }
}

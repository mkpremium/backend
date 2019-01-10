import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import parse from '../../src/migration/models/owner';
import merge from 'deepmerge';
import t from 'tcomb';
import {OwnerStatus} from '../../src/types/enums';

export async function migrateOwners(inputFile, bucket) {
  const migrateOwners = new MigrateOwner(inputFile, bucket);
  return migrateOwners.run();
}

export async function migrateVerifyOwners(inputFile, bucket) {
  const migration = new MigrateVerifyOwner(inputFile, bucket);
  return migration.run();
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

class MigrateVerifyOwner extends MigrateModelV3 {
  async parseToData(data, row) {
    const {owner, input} = parse(data);
    const migrateId = owner._migrateId;
    const migrateOwner = await MigrateVerifyOwner.findByMigrateId(migrateId);
    await MigrateVerifyOwner.verifyOwner(migrateOwner, input);
  }

  static async findByMigrateId(migrateId) {
    const repo = new OwnerRepository();
    return repo.findOneByMigrateId(migrateId);
  }

  static async verifyOwner(owner, input) {
    if (input.verificato !== '1') {
      return;
    }

    const updatedOwner = owner.verifyOwner('migrate', true, {
      status: OwnerStatus.VERIFIED
    });

    const repo = new OwnerRepository();
    return repo.save(updatedOwner, false);
  }
}

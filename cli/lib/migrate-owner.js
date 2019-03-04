import debug from 'debug';
import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import parse from '../../src/migration/models/owner';
import merge from 'deepmerge';
import t from 'tcomb';
import {OwnerStatus} from '../../src/types/enums';
import {WorksheetRepository} from "../../src/worksheet/models/worksheet";
import Promise from "bluebird";
import {WorkSheetStatus} from "../../src/types/worksheet";
import fromJSON from "tcomb/lib/fromJSON";

const debugMigrate = debug('app:migration:owners-verify');

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
    if (input.verificato === '1') {
      debugMigrate('\nStart process for row with Id_Fornitore:', data['Id_Fornitore']);
      const migrateOwner = await MigrateVerifyOwner.findByMigrateId(migrateId);
      await MigrateVerifyOwner.verifyOwner(migrateOwner);
      debugMigrate('After owner verification, owner id: ', migrateOwner.id);
      const worksheetRepository = new WorksheetRepository();
      const worksheet = await worksheetRepository.findWorksheetByOwner(migrateOwner.id);
      if (worksheet) {
        debugMigrate('Updating worksheet status, worksheet id: ', worksheet.id);
        const w = fromJSON(worksheet, t.WorkSheet);
        const updatedWorksheet = w.setStatus(WorkSheetStatus.WITH_OWNER);
        await worksheetRepository.save(updatedWorksheet, false);
        debugMigrate('Finished process with owner id:', migrateOwner.id);
      }
    } else {
      // no-op
    }
  }

  static async findByMigrateId(migrateId) {
    const repo = new OwnerRepository();
    return repo.findOneByMigrateId(migrateId);
  }

  static async verifyOwner(owner) {
    const updatedOwner = owner.verifyOwner('migrate', true, {
      status: OwnerStatus.VERIFIED
    });

    const repo = new OwnerRepository();
    return repo.save(updatedOwner, false);
  }
}

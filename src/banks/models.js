import {CouchbaseModel} from '../db/model';
import t from './types';
import {newHttpError} from '../lib/http-error';
import {retrievePricesAndLocationInfo} from './lib/services';
import {BANK_WORKER_NAMES} from './worker/workers';

export class BankFileRepository extends CouchbaseModel {
  constructor(gearman) {
    super();
    this.gearman = gearman;
    this.Struct = t.BankFile;
  }

  async processFile(file) {
    const params = {
      filename: file.originalName,
      filepath: file.path
    };
    const bankFile = await this.save(params);
    this.gearman.submitJob(BANK_WORKER_NAMES.LOAD, bankFile.id);
    return bankFile;
  }
}

export class BankFileDataRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BankFileData;
  }

  async process(bankFileData) {
    const $merge = await retrievePricesAndLocationInfo(bankFileData);
    const updatedBankFileData = t.update(bankFileData, {
      $merge,
      processed: {$set: true}
    });
    return this.save(updatedBankFileData);
  }

  async findByIdOrThrow(id) {
    const bankFileData = await this.findById(id);
    if (!bankFileData) {
      throw newHttpError(404, `BankFileData ${id} no existe`);
    }

    return bankFileData;
  }
}

export class BanksCityDataRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BanksCityData;
  }

  static async findByName(name) {
    const repo = new BanksCityDataRepository();
    const qb = repo.getQueryBuilder();
    qb
      .where('name = ?', name)
      .limit(1);
    const [result] = repo.query(qb);
    return result;
  }
}

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
      mimetype: file.mimetype,
      filename: file.originalname,
      filepath: file.path
    };
    const bankFile = await this.save(params);
    const payload = JSON.stringify(bankFile);
    const options = {background: true};
    this.gearman.submitJob(BANK_WORKER_NAMES.LOAD, payload, options);
    return bankFile;
  }
}

export class BankFileDataRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BankFileData;
  }

  async process(bankFileData) {
    const $merge = await retrievePricesAndLocationInfo(bankFileData.cadastreReference);
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
    const [result] = await repo.query(qb);
    return result;
  }
}

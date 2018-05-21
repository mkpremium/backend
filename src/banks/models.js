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

  async setProcessed(bankFile, $set) {
    const updated = t.update(bankFile, {processed: {$set}});
    console.log('setProcessed', bankFile, {$set});
    return this.save(updated);
  }

  async setTotal(bankFile, $set) {
    const updated = t.update(bankFile, {total: {$set}});
    return this.save(updated);
  }
}

export class BankFileDataRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BankFileData;
  }

  async updateCounter(bankFileId) {
    const repoFile = new BankFileRepository();
    const counter = repoFile.getCounter();
    const file = await repoFile.findById(bankFileId);
    const value = await counter.count(bankFileId, 1);
    return repoFile.setProcessed(file, value);
  }

  async process(bankFileData) {
    const $merge = await retrievePricesAndLocationInfo(bankFileData.cadastreReference);
    const updatedBankFileData = t.update(bankFileData, {
      $merge,
      processed: {$set: true}
    });

    await this.save(updatedBankFileData);
    await this.updateCounter(updatedBankFileData.bankFileId);
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

import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../db/model';
import t from './types';
import {newHttpError} from '../lib/http-error';
import {calculateFilter, retrievePricesAndLocationInfo} from './lib/services';
import {BANK_WORKER_NAMES} from './worker/workers';

export class BankFileRepository extends CouchbaseModel {
  constructor(gearman) {
    super();
    this.gearman = gearman;
    this.Struct = t.BankFile;
  }

  static async calculateFilter(bankFileId, params) {
    const thresholds = fromJSON(params, t.BankFilterUserInput);
    const results = await calculateFilter(bankFileId, thresholds);
    return fromJSON({results}, t.ListBankFileData);
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
    return this.save(updated);
  }

  async setTotal(bankFile, $set) {
    const updated = t.update(bankFile, {total: {$set}});
    return this.save(updated);
  }

  static single(bankFile) {
    return fromJSON(bankFile, t.BankFileResponse);
  }

  static multiple(bankFiles) {
    return fromJSON({results: bankFiles}, t.ListBankFileResponse);
  }

  async list() {
    const qb = this.getQueryBuilder();
    qb
      .order('createdAt')
      .limit(5);

    const results = await this.query(qb);

    return BankFileRepository.multiple(results);
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

  async findByFileBankId(bankFileId) {
    const qb = this
      .getQueryBuilder()
      .where('bankFileId = ?', bankFileId);

    return this.query(qb);
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

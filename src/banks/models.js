import XLSX from 'xlsx';
import fromJSON from 'tcomb/lib/fromJSON';
import _difference from 'lodash/difference';
import _uniq from 'lodash/uniq';
import {CouchbaseModel} from '../db/model';
import t from './types';
import {newHttpError} from '../lib/http-error';
import {calculateFilter, calculateFilterSpecific, retrievePricesAndLocationInfo} from './lib/services';
import {BANK_WORKER_NAMES} from './worker/workers';

const invertedList = {
  blacklisted: 'whitelisted',
  whitelisted: 'blacklisted'
};

function updateListed(action, userInput, newValues) {
  const action1 = action;
  const action2 = invertedList[action];
  return {
    [action1]: _uniq(userInput[action1].concat(newValues)),
    [action2]: _difference(userInput[action2], newValues)
  };
}

export class BankFileRepository extends CouchbaseModel {
  constructor(gearman) {
    super();
    this.gearman = gearman;
    this.Struct = t.BankFile;
  }

  async exportFile(bankFileId, args) {
    const params = fromJSON(args, t.BankFileExportInput);
    const filename = `/tmp/${bankFileId}.xlsx`;
    const bankFile = await this.findByIdOrThrow(bankFileId);
    const repoData = new BankFileDataRepository();
    const data = await repoData.findByFileBankIdAndBuy(bankFileId, params.buy);
    const rows = data.map(({bankFileRowData}) => bankFileRowData);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
    XLSX.writeFile(wb, filename);

    return {
      bankFile,
      exported: filename
    };
  }

  async doFilterAction(params, body) {
    const args = t.BankFilterUpdateInput(Object.assign({}, params, body));
    const repoData = new BankFileDataRepository();
    const bankFileDataRows = await repoData.findByIds(args.bankFileDataIds);
    const bankFile = await this.findByIdOrThrow(args.id);

    const bankFileDataIds = bankFileDataRows.map(({cadastreReference}) => cadastreReference);
    const updatedUserInput = t
      .update(bankFile.userInput, {$merge: updateListed(args.action, bankFile.userInput, bankFileDataIds)});
    const updatedBankFile = t.update(bankFile, {userInput: {$set: updatedUserInput}});

    await calculateFilterSpecific(bankFileDataRows, updatedBankFile.userInput);

    return this.save(updatedBankFile);
  }

  async calculateFilter(bankFileId, params) {
    const thresholds = fromJSON(params, t.BankFilterUserInput);
    const bankFile = await this.findByIdOrThrow(bankFileId);
    const bankFileUserInput = t.update(bankFile, {userInput: {$set: thresholds}});
    await this.save(bankFileUserInput);
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
      .order('createdAt', false)
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

  async findByFileBankIdAndBuy(bankFileId, buy) {
    const qb = this
      .getQueryBuilder()
      .where('bankFileId = ?', bankFileId)
      .where('buy = ?', buy);

    return this.query(qb);
  }

  async findByFileBankId(bankFileId) {
    const qb = this
      .getQueryBuilder()
      .where('bankFileId = ?', bankFileId);

    return this.query(qb);
  }

  async findByIds(bankFileDataIds) {
    if (bankFileDataIds.length < 1) {
      throw newHttpError(400, 'bankFileDataIds debe incluir al menos un valor');
    }
    const ids = `[${bankFileDataIds.map(id => `'${id}'`).join(', ')}]`;
    const qb = this
      .getQueryBuilder()
      .where(`id IN ${ids}`);
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

import gearman from 'gearmanode';
import Promise from 'bluebird';
import XLSX from 'xlsx';

import couchbase from '../../db/couchbase';
import {gearmanConfig} from '../../../config';

import {wrap} from '../../lib/workers';

import {BankFileDataRepository, BankFileRepository} from '../models';
import {BANK_WORKER_NAMES} from './workers';
import socket from '../../socket';

class BankLoadWorker {
  constructor() {
    this.db = Promise.all([
      couchbase(),
      socket.initModel()
    ]);
    this.client = gearman.client(gearmanConfig);
    this.worker = gearman.worker(gearmanConfig);

    this._getAsyncProcessRow = this._getAsyncProcessRow.bind(this);
    this._workerBankFile = this._workerBankFile.bind(this);
    this._setTotal = this._setTotal.bind(this);
  }

  _getAsyncProcessRow(bankFileId, cadastreCol, bankPriceCol) {
    const repo = new BankFileDataRepository();
    return async(row) => {
      const bankFileData = await repo.save({
        bankFileId,
        bankFileRowData: row,
        cadastreReference: row[cadastreCol],
        priceBank: Number(row[bankPriceCol])
      });

      const payload = JSON.stringify({id: bankFileData.id});
      const options = {
        unique: payload.id,
        background: true
      };
      this.client.submitJob(BANK_WORKER_NAMES.PROCESS, payload, options);
    };
  }

  async _setTotal(bankFile, total) {
    const repo = new BankFileRepository();
    return repo.setTotal(bankFile, total);
  }

  async _workerBankFile(bankFile) {
    const workbook = XLSX.readFile(bankFile.filepath);
    const [firstSheet] = workbook.SheetNames;
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
    const [cadastreCol, bankPriceCol] = Object.keys(sheet[0]);
    await this._setTotal(bankFile, sheet.length);
    await Promise.each(sheet, this._getAsyncProcessRow(bankFile.id, cadastreCol, bankPriceCol));
  }

  async run() {
    await this.db;
    this.worker.addFunction(BANK_WORKER_NAMES.LOAD, wrap(this._workerBankFile));
  }

  static init() {
    const worker = new BankLoadWorker();
    worker
      .run()
      .catch(console.log.bind(console));
  }
}

BankLoadWorker.init();

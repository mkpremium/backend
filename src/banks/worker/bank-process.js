import gearman from 'gearmanode';

import couchbase from '../../db/couchbase';
import {gearmanConfig} from '../../../config';

import {wrap} from '../../lib/workers';

import {BankFileDataRepository} from '../models';
import {BANK_WORKER_NAMES} from './workers';

class BankProcessWorker {
  constructor() {
    this.db = couchbase();
    this.worker = gearman.worker(gearmanConfig);
  }

  static async workerBankProcess(bankFileDataId) {
    const repo = new BankFileDataRepository();
    const bankFileData = repo.findByIdOrThrow(bankFileDataId);
    await repo.process(bankFileData);
  }

  async run() {
    await this.db;
    this.worker.addFunction(BANK_WORKER_NAMES.PROCESS, wrap(BankProcessWorker.workerBankProcess));
  }

  static init() {
    const worker = new BankProcessWorker();
    worker
      .run()
      .catch(console.log.bind(console));
  }
}

BankProcessWorker.init();

import debug from 'debug'
import gearman from 'gearmanode'

import couchbase from '../../db/couchbase'
import { gearmanConfig } from '../../../config'

import { wrap } from '../../lib/workers'

import { BankFileDataRepository, BankFileRepository } from '../models'
import { BANK_WORKER_NAMES } from './workers'
import socket from '../../socket'
import Promise from 'bluebird'

const debugProcess = debug('app:banks:worker:process')

class BankProcessWorker {
  constructor () {
    this.db = Promise.all([
      couchbase(),
      socket.initModel('bank-process')
    ])
    this.worker = gearman.worker(gearmanConfig)
  }

  static async workerBankProcess (args) {
    const bankFileDataId = args.id
    const repo = new BankFileDataRepository()
    const fileRepo = new BankFileRepository()

    const bankFileData = await repo.findById(bankFileDataId)
    if (!bankFileData) {
      debugProcess(`ignoring ${bankFileDataId}, not found on database`)
      return
    }
    const bankFile = await fileRepo.findById(bankFileData.bankFileId)
    if (!bankFile) {
      debugProcess(`ignoring ${bankFileDataId}, not found bank file '${bankFileData.bankFileId}' on database`)
      return
    }

    await repo.process(bankFileData)
  }

  async run () {
    await this.db
    this.worker.addFunction(BANK_WORKER_NAMES.PROCESS, wrap(BankProcessWorker.workerBankProcess))
  }

  static init () {
    const worker = new BankProcessWorker()
    worker
      .run()
      .catch(console.log.bind(console))
  }
}

BankProcessWorker.init()

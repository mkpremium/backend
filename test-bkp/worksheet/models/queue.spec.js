import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { WorksheetQueueRepository } from '../../../src/worksheet/models/queue'
import uuid from 'uuid/v4'
import { WorksheetRepository } from '../../../src/worksheet/models/worksheet'
import { CouchbaseModel } from '../../../src/db/model'

const operatorId = 'operator'
let queue = fromJSON({
  _documentType: 'worksheet-queue',
  name: 'madrid',
  id: 'd057309b-3b2f-4d42-b0ed-74bde6183839',
  worksheets: [
    {
      addedAt: '2018-03-06T18:51:47.520Z',
      id: '6c0c18fe-e0f3-470c-86e2-aaa9a327b3c5',
      operatorId: null,
      status: 'AVAILABLE',
      worksheetId: 'worksheet1'
    },
    {
      addedAt: '2018-03-06T18:51:47.521Z',
      id: '7eebfe4b-487c-4697-b0ae-47ada3e238ba',
      operatorId: 'operator',
      status: 'OPENED',
      worksheetId: 'worksheet2'
    },
    {
      addedAt: '2018-03-06T18:51:47.521Z',
      id: 'd5781bd7-961a-4846-a4ef-eb2b3217b978',
      operatorId: null,
      status: 'AVAILABLE',
      worksheetId: 'worksheet3'
    },
    {
      addedAt: '2018-03-06T18:51:47.522Z',
      id: 'cd4b3578-3fde-43aa-b75f-d08a7f34a97b',
      operatorId: null,
      status: 'AVAILABLE',
      worksheetId: 'worksheet4'
    },
    {
      addedAt: '2018-03-06T18:51:47.522Z',
      id: 'fa5243a9-48f0-4b6e-bb98-fff00bd4f4ce',
      operatorId: null,
      status: 'AVAILABLE',
      worksheetId: 'worksheet5'
    }
  ]
}, t.WorksheetQueue)

const _stubs = {}

function restoreStubs () {
  CouchbaseModel.prototype.save = _stubs.save
  WorksheetRepository.prototype.findById = _stubs.findById
}

function stubs () {
  _stubs.save = CouchbaseModel.prototype.save
  CouchbaseModel.prototype.save = async function (data) {
    const struct = new this.Struct(data)
    queue = t.update(struct, { id: { $set: data.id || uuid() } })
    return queue
  }

  _stubs.findById = WorksheetRepository.prototype.findById
  WorksheetRepository.prototype.findById = (id) => {
    return t.WorkSheet({ id })
  }
}

describe('WorksheetQueueRepository', () => {
  before(() => {
    stubs()
  })
  after(() => {
    restoreStubs()
  })

  describe('nextWorksheetInQueue()', () => {
    beforeEach(() => {
      queue = fromJSON({
        _documentType: 'worksheet-queue',
        name: 'madrid',
        id: 'd057309b-3b2f-4d42-b0ed-74bde6183839',
        worksheets: [
          {
            addedAt: '2018-03-06T18:51:47.520Z',
            id: '6c0c18fe-e0f3-470c-86e2-aaa9a327b3c5',
            operatorId: null,
            status: 'AVAILABLE',
            worksheetId: 'worksheet1'
          },
          {
            addedAt: '2018-03-06T18:51:47.521Z',
            id: '7eebfe4b-487c-4697-b0ae-47ada3e238ba',
            operatorId: 'operator',
            status: 'OPENED',
            worksheetId: 'worksheet2'
          },
          {
            addedAt: '2018-03-06T18:51:47.521Z',
            id: 'd5781bd7-961a-4846-a4ef-eb2b3217b978',
            operatorId: null,
            status: 'AVAILABLE',
            worksheetId: 'worksheet3'
          },
          {
            addedAt: '2018-03-06T18:51:47.522Z',
            id: 'cd4b3578-3fde-43aa-b75f-d08a7f34a97b',
            operatorId: null,
            status: 'AVAILABLE',
            worksheetId: 'worksheet4'
          },
          {
            addedAt: '2018-03-06T18:51:47.522Z',
            id: 'fa5243a9-48f0-4b6e-bb98-fff00bd4f4ce',
            operatorId: null,
            status: 'AVAILABLE',
            worksheetId: 'worksheet5'
          }
        ]
      }, t.WorksheetQueue)
    })
    it('able to pick next item in queue', async () => {
      const repo = new WorksheetQueueRepository()
      const worksheet = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet.id.should.equal('worksheet3')
    })

    it.skip('able to forward many times', async () => {
      const repo = new WorksheetQueueRepository()
      const worksheet3 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet3.id.should.equal('worksheet3')
      const worksheet4 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet4.id.should.equal('worksheet4')
      const worksheet5 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet5.id.should.equal('worksheet5')
    })

    it.skip('able to go first item in queue when reach end', async () => {
      const repo = new WorksheetQueueRepository()
      const worksheet3 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet3.id.should.equal('worksheet3')
      const worksheet4 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet4.id.should.equal('worksheet4')
      const worksheet5 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet5.id.should.equal('worksheet5')
      const worksheet1 = await repo.nextWorksheetInQueue(queue, operatorId)
      worksheet1.id.should.equal('worksheet1')
    })
  })
})

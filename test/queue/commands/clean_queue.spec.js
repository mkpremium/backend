import app from '../../../src/app'
import {
  deleteAll,
  operatorCreate,
  operatorCreateManager,
  operatorLogin,
  defaultPassword
} from '../../common'
import * as QueueHelper from '../../helpers/queue'
import WorksheetHelper from '../../helpers/worksheet'
import _ from 'lodash'

describe('clean-queue.commands', () => {
  let authenticatedOperator
  let authenticatedManager
  let queue, queueWorksheets
  let manager
  let anotherWorksheet
  beforeEach(async () => {
    await deleteAll()
    manager = await operatorCreateManager()
    authenticatedManager = await operatorLogin(app, { username: manager.username, password: defaultPassword })

    queue = await QueueHelper.createQueueEndpoint(authenticatedManager)

    // create operator related to queue above and authenticate the operator
    await operatorCreate('', queue.id)
    authenticatedOperator = await operatorLogin(app, { username: 'operator', password: defaultPassword })

    const worksheets = await WorksheetHelper.createWorksheetsWithBuildingsAssociated()

    // Ask for a worksheet (NEXT worksheet), a way to associate it with the queue
    const worksheetNEXT = await QueueHelper.doActionInQueueEndpoint(authenticatedOperator, queue.id)

    // verify the worksheet above is in the queue worksheets array
    queue = await QueueHelper.findByIdModel(queue.id)
    queueWorksheets = queue.worksheets
    queueWorksheets.length.should.equal(1)
    const queueWorksheet = _.first(queue.worksheets)
    queueWorksheet.worksheetId.should.equal(worksheetNEXT.id)

    // simulate a limbo worksheet with queueId = queue.id but not really in queue
    anotherWorksheet = worksheets.find(ws => ws.id !== worksheetNEXT.id)
    anotherWorksheet = await WorksheetHelper.updateQueueIdWorksheetModel(anotherWorksheet.id, queue.id)

    // verify the worksheet queue still has only one item
    queue = await QueueHelper.findByIdModel(queue.id)
    queueWorksheets = queue.worksheets
    queueWorksheets.length.should.equal(1)
  })
  describe('clean-queue.command by queue id', () => {
    it.skip('able to clean worksheets that have a queue id but are not in said queue worksheet array', async () => {
      // clean limbo worksheets with specific queue id
      await QueueHelper.cleanWorksheetsNotInQueueViaModel(queue.id)

      // verify limbo worksheet has queue id = null and verify array of worksheets in queue still has size = 1
      anotherWorksheet = await WorksheetHelper.findByIdModel(anotherWorksheet.id);
      (anotherWorksheet.queueId === null).should.equal(true)

      queue = await QueueHelper.findByIdModel(queue.id)
      queueWorksheets = queue.worksheets
      queueWorksheets.length.should.equal(1)
    })
  })

  describe('clean-queue.command clean all', () => {
    it.skip('able to clean all limbo worksheets for all queues ', async () => {
      // clean all limbo worksheets of all queues
      await QueueHelper.cleanAllWorksheetsNotInQueueViaModel()
      anotherWorksheet = await WorksheetHelper.findByIdModel(anotherWorksheet.id);
      (anotherWorksheet.queueId === null).should.equal(true)

      queue = await QueueHelper.findByIdModel(queue.id)
      queueWorksheets = queue.worksheets
      queueWorksheets.length.should.equal(1)
    })
  })
})

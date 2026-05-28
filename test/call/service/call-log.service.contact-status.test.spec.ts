import sinon from 'sinon'
import { CallLogService } from '../../../src/call/service/call-log.service'

describe('CallLogService contact status handlers', () => {
  let callLogService: CallLogService

  let logger: any
  let updateBuildingNegotiationStatusService: any
  let callLogRepository: any
  let callQueueRepository: any

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    updateBuildingNegotiationStatusService = {}

    callLogRepository = {}

    callQueueRepository = {
      freezeNoSale: sinon.stub().resolves(),
      freezeDoNotCall: sinon.stub().resolves()
    }

    callLogService = new CallLogService(
      logger as any,
      updateBuildingNegotiationStatusService as any,
      callLogRepository as any,
      callQueueRepository as any
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('contactNoSale', () => {
    it('marks contact as no sale', async () => {
      const calledAt = new Date('2026-05-25T10:00:00.000Z')

      const callLog: any = {
        startTimestamp: calledAt,
        callQueueId: 'queue-1'
      }

      await callLogService.contactNoSale(callLog)

      sinon.assert.calledOnceWithExactly(
        callQueueRepository.freezeNoSale,
        calledAt,
        'queue-1'
      )
    })

    it('does not throw when freezeNoSale fails', async () => {
      callQueueRepository.freezeNoSale.rejects(new Error('DB error'))

      const callLog: any = {
        startTimestamp: new Date('2026-05-25T10:00:00.000Z'),
        callQueueId: 'queue-1'
      }

      await callLogService.contactNoSale(callLog)

      sinon.assert.calledOnce(callQueueRepository.freezeNoSale)
    })
  })

  describe('contactDoNotCall', () => {
    it('marks contact as do not call', async () => {
      const calledAt = new Date('2026-05-25T10:00:00.000Z')

      const callLog: any = {
        startTimestamp: calledAt,
        callQueueId: 'queue-1'
      }

      await callLogService.contactDoNotCall(callLog)

      sinon.assert.calledOnceWithExactly(
        callQueueRepository.freezeDoNotCall,
        calledAt,
        'queue-1'
      )
    })

    it('does not throw when freezeDoNotCall fails', async () => {
      callQueueRepository.freezeDoNotCall.rejects(new Error('DB error'))

      const callLog: any = {
        startTimestamp: new Date('2026-05-25T10:00:00.000Z'),
        callQueueId: 'queue-1'
      }

      await callLogService.contactDoNotCall(callLog)

      sinon.assert.calledOnce(callQueueRepository.freezeDoNotCall)
    })
  })
})

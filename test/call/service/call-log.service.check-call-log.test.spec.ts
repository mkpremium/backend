import sinon from 'sinon'
import { CallLogService } from '../../../src/call/service/call-log.service'

describe('CallLogService.checkCallLog', () => {
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

    callQueueRepository = {}

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

  it('calls contactSale when vende is true', async () => {
    const contactSaleStub = sinon
      .stub(callLogService, 'contactSale')
      .resolves()

    const contactDoNotCallStub = sinon
      .stub(callLogService, 'contactDoNotCall')
      .resolves()

    const contactNoSaleStub = sinon
      .stub(callLogService, 'contactNoSale')
      .resolves()

    const callLog: any = {
      vende: true,
      noLlamar: false
    }

    await callLogService.checkCallLog(callLog)

    sinon.assert.calledOnceWithExactly(contactSaleStub, callLog)
    sinon.assert.notCalled(contactDoNotCallStub)
    sinon.assert.notCalled(contactNoSaleStub)
  })

  it('calls contactDoNotCall when noLlamar is true and vende is false', async () => {
    const contactSaleStub = sinon
      .stub(callLogService, 'contactSale')
      .resolves()

    const contactDoNotCallStub = sinon
      .stub(callLogService, 'contactDoNotCall')
      .resolves()

    const contactNoSaleStub = sinon
      .stub(callLogService, 'contactNoSale')
      .resolves()

    const callLog: any = {
      vende: false,
      noLlamar: true
    }

    await callLogService.checkCallLog(callLog)

    sinon.assert.notCalled(contactSaleStub)
    sinon.assert.calledOnceWithExactly(contactDoNotCallStub, callLog)
    sinon.assert.notCalled(contactNoSaleStub)
  })

  it('calls contactNoSale when vende is false and noLlamar is false', async () => {
    const contactSaleStub = sinon
      .stub(callLogService, 'contactSale')
      .resolves()

    const contactDoNotCallStub = sinon
      .stub(callLogService, 'contactDoNotCall')
      .resolves()

    const contactNoSaleStub = sinon
      .stub(callLogService, 'contactNoSale')
      .resolves()

    const callLog: any = {
      vende: false,
      noLlamar: false
    }

    await callLogService.checkCallLog(callLog)

    sinon.assert.notCalled(contactSaleStub)
    sinon.assert.notCalled(contactDoNotCallStub)
    sinon.assert.calledOnceWithExactly(contactNoSaleStub, callLog)
  })
})

import sinon from 'sinon'
import { CallEvent, callEmitter } from '../../../src/call/events/call-events'
import { registerCallCycleListener } from '../../../src/call/events/call-cycle.listener'

describe('registerCallCycleListener', () => {
  let callService: any
  let logger: any

  beforeEach(() => {
    callEmitter.removeAllListeners()

    callService = {
      processNextBuilding: sinon.stub(),
      processBuildingContactCall: sinon.stub()
    }

    logger = {
      error: sinon.stub(),
      info: sinon.stub()
    }
  })

  afterEach(() => {
    callEmitter.removeAllListeners()
    sinon.restore()
  })

  it('calls processNextBuilding when vende is si', async () => {
    callService.processNextBuilding.resolves({
      status: 'ok'
    })

    registerCallCycleListener(callService, logger)

    callEmitter.emit(CallEvent.CALL_COMPLETED, {
      city: 'MADRID',
      buildingId: 'building-1',
      vende: true
    })

    await new Promise(resolve => setImmediate(resolve))

    sinon.assert.calledOnceWithExactly(
      callService.processNextBuilding,
      'MADRID'
    )

    sinon.assert.notCalled(callService.processBuildingContactCall)
  })

  it('calls processBuildingContactCall when vende is no', async () => {
    callService.processBuildingContactCall.resolves({
      status: 'ok',
      city: 'MADRID',
      buildingId: 'building-1',
      batchId: 'batch-1'
    })

    registerCallCycleListener(callService, logger)

    callEmitter.emit(CallEvent.CALL_COMPLETED, {
      city: 'MADRID',
      buildingId: 'building-1',
      vende: false
    })

    await new Promise(resolve => setImmediate(resolve))

    sinon.assert.calledOnceWithExactly(
      callService.processBuildingContactCall,
      'building-1',
      'MADRID'
    )

    sinon.assert.notCalled(callService.processNextBuilding)
  })
  it('moves to next building when vende is no and current building has no more contacts', async () => {
    callService.processBuildingContactCall.resolves({
      status: 'empty',
      message: 'No quedan contactos'
    })

    callService.processNextBuilding.resolves({
      status: 'ok'
    })

    registerCallCycleListener(callService, logger)

    callEmitter.emit(CallEvent.CALL_COMPLETED, {
      city: 'MADRID',
      buildingId: 'building-1',
      vende: false
    })

    await new Promise(resolve => setImmediate(resolve))

    sinon.assert.calledOnceWithExactly(
      callService.processBuildingContactCall,
      'building-1',
      'MADRID'
    )

    sinon.assert.calledOnceWithExactly(
      callService.processNextBuilding,
      'MADRID'
    )
  })
})

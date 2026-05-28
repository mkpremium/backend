import { expect } from 'chai'
import sinon from 'sinon'
import { CallService } from '../../../src/call/service/call.service'

describe('CallService.processNextBuilding', () => {
  let callService: CallService

  let contactService: any
  let callScheduleRepository: any
  let logger: any
  let retellCallProvider: any

  beforeEach(() => {
    contactService = {
      getBuildingIdFromCallQueue: sinon.stub(),
      getNextContactInBuilding: sinon.stub()
    }

    callScheduleRepository = {
      getDailyRemainingBuildings: sinon.stub(),
      updateDailyRemainingBuildings: sinon.stub()
    }

    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    retellCallProvider = {
      createBatchCall: sinon.stub()
    }

    callService = new CallService(
      contactService as any,
      callScheduleRepository as any,
      logger as any,
      retellCallProvider as any,
      {} as any,
      {} as any,
      {} as any
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns error when city is missing', async () => {
    const result = await callService.processNextBuilding('')

    expect(result.status).to.equal('error')

    sinon.assert.notCalled(callScheduleService.getRemainingDailyBuildings)
    sinon.assert.notCalled(contactService.getBuildingIdFromCallQueue)
  })

  it('returns finished when daily remaining buildings is 0', async () => {
    callScheduleService.getRemainingDailyBuildings.resolves(0)

    const result = await callService.processNextBuilding('MADRID')

    expect(result.status).to.equal('finished')

    sinon.assert.calledOnceWithExactly(
      callScheduleService.getRemainingDailyBuildings,
      'MADRID'
    )

    sinon.assert.notCalled(contactService.getBuildingIdFromCallQueue)
  })

  it('returns empty when there are no pending buildings', async () => {
    callScheduleService.getRemainingDailyBuildings.resolves(5)
    contactService.getBuildingIdFromCallQueue.resolves(null)

    const result = await callService.processNextBuilding('MADRID')

    expect(result.status).to.equal('empty')

    sinon.assert.calledOnceWithExactly(
      contactService.getBuildingIdFromCallQueue,
      'MADRID'
    )
  })

  it('returns result when building has callable contact', async () => {
    callScheduleService.getRemainingDailyBuildings.resolves(5)
    contactService.getBuildingIdFromCallQueue.resolves('building-1')

    sinon.stub(callService, 'processBuildingContactCall').resolves({
      status: 'ok',
      city: 'MADRID',
      buildingId: 'building-1',
      batchId: 'batch-1'
    } as any)

    const result = await callService.processNextBuilding('MADRID')

    expect(result.status).to.equal('ok')

    sinon.assert.calledOnceWithExactly(
      contactService.getBuildingIdFromCallQueue,
      'MADRID'
    )

    sinon.assert.calledOnceWithExactly(
    callService.processBuildingContactCall as sinon.SinonStub,
    'building-1',
    'MADRID'
    )

    sinon.assert.notCalled(
      callScheduleService.decrementRemainingDailyBuildings
    )
  })

  it('decrements remaining and tries next building when current building has no contacts', async () => {
    callScheduleService.getRemainingDailyBuildings.resolves(5)
    contactService.getBuildingIdFromCallQueue
      .onFirstCall()
      .resolves('building-empty')
      .onSecondCall()
      .resolves('building-valid')

    const processBuildingContactCallStub = sinon.stub(
      callService,
      'processBuildingContactCall'
    )

    processBuildingContactCallStub
      .onFirstCall()
      .resolves({
        status: 'empty',
        message: 'No quedan contactos pendientes en el edificio building-empty'
      } as any)
      .onSecondCall()
      .resolves({
        status: 'ok',
        city: 'MADRID',
        buildingId: 'building-valid',
        batchId: 'batch-1'
      } as any)

    callScheduleService.decrementRemainingDailyBuildings.resolves(true)

    const result = await callService.processNextBuilding('MADRID')

    expect(result.status).to.equal('ok')

    sinon.assert.calledTwice(contactService.getBuildingIdFromCallQueue)

    sinon.assert.calledOnceWithExactly(
      callScheduleService.decrementRemainingDailyBuildings,
      'MADRID'
    )

    sinon.assert.calledTwice(processBuildingContactCallStub)
    sinon.assert.calledWithExactly(
      processBuildingContactCallStub.firstCall,
      'building-empty',
      'MADRID'
    )
    sinon.assert.calledWithExactly(
      processBuildingContactCallStub.secondCall,
      'building-valid',
      'MADRID'
    )
  })
})

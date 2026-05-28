import sinon from 'sinon'
import { CallLogService } from '../../../src/call/service/call-log.service'

describe('CallLogService.contactSale', () => {
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
      freezeSale: sinon.stub().resolves(),
      changeAllBuildingSaleContactStatus: sinon.stub().resolves()
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

  it('changes negotiation status, saves notes and marks building as sale', async () => {
    const changeNegotiationStatusStub = sinon
      .stub(callLogService, 'changeNegotiationStatus')
      .resolves()

    const saveBuildingNotesStub = sinon
      .stub(callLogService, 'saveBuildingNotes')
      .resolves()

    const callLog: any = {
      buildingId: 'building-1',
      callQueueId: 'queue-1',
      toNumberNorm: '666111222',
      resumen: 'El propietario quiere vender.',
      recordingUrl: 'https://recording.test/audio.mp3',
      startTimestamp: new Date('2026-05-25T10:00:00.000Z')
    }

    await callLogService.contactSale(callLog)

    sinon.assert.calledOnceWithExactly(
      changeNegotiationStatusStub,
      'building-1'
    )

    sinon.assert.calledOnceWithExactly(
      saveBuildingNotesStub,
      'building-1',
      [
        'El propietario quiere vender.',
        'https://recording.test/audio.mp3'
      ]
    )

    sinon.assert.calledOnceWithExactly(
      callQueueRepository.changeAllBuildingSaleContactStatus,
      'building-1'
    )
  })

  it('does not save notes when resumen or recordingUrl is missing', async () => {
    sinon.stub(callLogService, 'changeNegotiationStatus').resolves()

    const saveBuildingNotesStub = sinon
      .stub(callLogService, 'saveBuildingNotes')
      .resolves()

    const callLog: any = {
      buildingId: 'building-1',
      callQueueId: 'queue-1',
      toNumberNorm: '666111222',
      resumen: null,
      recordingUrl: null,
      startTimestamp: new Date('2026-05-25T10:00:00.000Z')
    }

    await callLogService.contactSale(callLog)

    sinon.assert.notCalled(saveBuildingNotesStub)

    sinon.assert.calledOnceWithExactly(
      callQueueRepository.changeAllBuildingSaleContactStatus,
      'building-1'
    )
  })

  it('throws when changing negotiation status fails', async () => {
    sinon
      .stub(callLogService, 'changeNegotiationStatus')
      .rejects(new Error('Negotiation error'))

    sinon.stub(callLogService, 'saveBuildingNotes').resolves()

    const callLog: any = {
      buildingId: 'building-1',
      callQueueId: 'queue-1',
      toNumberNorm: '666111222',
      resumen: 'Resumen',
      recordingUrl: 'https://recording.test/audio.mp3',
      startTimestamp: new Date('2026-05-25T10:00:00.000Z')
    }

    try {
      await callLogService.contactSale(callLog)
      throw new Error('Expected contactSale to throw')
    } catch (error) {
      sinon.assert.notCalled(
        callQueueRepository.changeAllBuildingSaleContactStatus
      )
    }
  })
})

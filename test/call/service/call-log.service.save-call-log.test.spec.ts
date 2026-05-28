import sinon from 'sinon'
import { CallLogService } from '../../../src/call/service/call-log.service'
import { callEmitter, CallEvent } from '../../../src/call/events/call-events'

describe('CallLogService.saveCallLog', () => {
  let callLogService: CallLogService

  let logger: any
  let updateBuildingNegotiationStatusService: any
  let callLogRepository: any
  let callQueueRepository: any

  beforeEach(() => {
    callEmitter.removeAllListeners()

    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    updateBuildingNegotiationStatusService = {}

    callLogRepository = {
      save: sinon.stub().resolves()
    }

    callQueueRepository = {}

    callLogService = new CallLogService(
      logger as any,
      updateBuildingNegotiationStatusService as any,
      callLogRepository as any,
      callQueueRepository as any
    )
  })

  afterEach(() => {
    callEmitter.removeAllListeners()
    sinon.restore()
  })

  it('saves call log, checks status, emits CALL_COMPLETED and sends log to Umind', async () => {
    const checkCallLogStub = sinon
      .stub(callLogService, 'checkCallLog')
      .resolves()

    const sendCallLogToUmindStub = sinon
      .stub(callLogService, 'sendCallLogToUmind')
      .resolves()

    const emitSpy = sinon.spy(callEmitter, 'emit')

    const body: any = {
      call: {
        call_id: 'retell-call-1',
        from_number: '+34910000000',
        to_number: '+34666111222',
        duration_ms: 60000,
        transcript: 'Hola, llamada de prueba',
        disconnection_reason: 'user_hangup',
        recording_url: 'https://recording.test/audio.mp3',
        start_timestamp: '2026-05-25T10:00:00.000Z',
        call_status: 'ended',
        call_cost: {
          combined_cost: 25
        },
        agent_name: 'Retell Agent',
        agent_id: 'agent-1',
        metadata: {
          buildingId: 'building-1',
          ownerId: 'owner-1',
          contactId: 'contact-1',
          callQueueId: 'queue-1',
          city: 'MADRID',
          use: 'RESIDENTIAL'
        },
        call_analysis: {
          call_summary: 'Resumen de la llamada',
          user_sentiment: 'positive',
          call_successful: true,
          custom_analysis_data: {
            vende: true,
            no_llamar: false,
            resumen: 'El propietario quiere vender.',
            rellamada: 'no'
          }
        }
      }
    }

    await callLogService.saveCallLog(body)

    sinon.assert.calledOnce(callLogRepository.save)
    sinon.assert.calledOnce(checkCallLogStub)
    sinon.assert.calledOnce(sendCallLogToUmindStub)

    sinon.assert.calledWith(
      emitSpy,
      CallEvent.CALL_COMPLETED,
      sinon.match({
        city: 'MADRID',
        buildingId: 'building-1',
        vende: true
      })
    )
  })
})

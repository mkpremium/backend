import { expect } from 'chai'
import sinon from 'sinon'
import { CallService } from '../../../src/call/service/call-service'

describe('CallService', () => {
  let contactService: any
  let logger: any
  let updateBuildingNegotiationStatusService: any
  let callScheduleRepository: any
  let retellCallProvider: any

  let service: CallService

  beforeEach(() => {
    contactService = {
      getCityContacts: sinon.stub()
    }

    logger = {
      info: sinon.spy(),
      debug: sinon.spy(),
      error: sinon.spy()
    }

    updateBuildingNegotiationStatusService = {
      updateBuildingStatus: sinon.stub()
    }

    callScheduleRepository = {
      getAll: sinon.stub(),
      saveAll: sinon.stub()
    }

    retellCallProvider = {
      createBatchCall: sinon.stub()
    }

    service = new CallService(
      contactService,
      logger,
      updateBuildingNegotiationStatusService,
      callScheduleRepository,
      retellCallProvider
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should call provider with transformed contacts', async () => {
    contactService.getCityContacts.resolves([
      {
        phoneNumber: '+34111111111',
        name: 'Juan',
        lastName: 'Perez',
        address: 'Calle 1',
        buildingId: '1',
        ownerId: '2',
        contactId: '3',
        city: 'Madrid',
        use: 'sale',
        callQueueId: '4'
      }
    ])

    retellCallProvider.createBatchCall.resolves({
      batchId: 'batch-123',
      totalCalls: 1
    })

    const request = {
      city: 'Madrid',
      limit: 1,
      timeWindow: {
        startHour: '09:00',
        endHour: '18:00'
      }
    }

    const result = await service.makeBatchCall(request as any)

    expect(retellCallProvider.createBatchCall.calledOnce).to.be.true

    const args = retellCallProvider.createBatchCall.getCall(0).args[0]

    expect(args.tasks).to.have.length(1)
    expect(args.tasks[0].toNumber).to.equal('+34111111111')

    expect(result.status).to.equal('ok')
  })
})

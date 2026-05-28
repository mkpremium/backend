import { expect } from 'chai'
import sinon from 'sinon'
import { CallService } from '../../../src/call/service/call.service'

describe('CallService.processBuildingContactCall', () => {
  let callService: CallService
  let contactService: any
  let callScheduleRepository: any
  let logger: any
  let retellCallProvider: any
  let addOwnerService: any
  let updateOwnerTypeService: any
  let searchOwnerOrBuildingService: any

  beforeEach(() => {
    contactService = {
      getBuildingIdFromCallQueue: sinon.stub(),
      getNextContactInBuilding: sinon.stub(),
      changeContactStatus: sinon.stub()
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

    addOwnerService = {}
    updateOwnerTypeService = {}
    searchOwnerOrBuildingService = {}
    /**
     * IMPORTANTE:
     * Ajusta este constructor al constructor real de tu CallService.
     * Las dependencias que no se usen en estos tests pueden ir como {} as any.
     */
    callService = new CallService(
      contactService,
      callScheduleRepository,
      logger,
      retellCallProvider,
      addOwnerService,
      updateOwnerTypeService,
      searchOwnerOrBuildingService
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns error when buildingId is missing', async () => {
    const result = await callService.processBuildingContactCall('', 'MADRID')

    expect(result.status).to.equal('error')
    sinon.assert.notCalled(contactService.getNextContactInBuilding)
    sinon.assert.notCalled(retellCallProvider.createBatchCall)
  })

  it('returns empty when there are no callable contacts in building', async () => {
    contactService.getNextContactInBuilding.resolves(null)

    const result = await callService.processBuildingContactCall(
      'building-1',
      'MADRID'
    )

    expect(result.status).to.equal('empty')

    sinon.assert.calledOnceWithExactly(
      contactService.getNextContactInBuilding,
      'building-1'
    )

    sinon.assert.notCalled(retellCallProvider.createBatchCall)
  })

  it('sends one Retell call and returns sent when contact exists', async () => {
    const contact = {
      callQueueId: 'queue-1',
      contactId: 'contact-1',
      phoneNumber: '666111222',
      address: 'CALLE TEST 1',
      city: 'MADRID',
      buildingId: 'building-1',
      ownerId: 'owner-1',
      variables: {},
      metadata: {}
    }

    contactService.getNextContactInBuilding.resolves(contact)

    sinon.stub(callService, 'assignOriginTelf').returns('+34910000000')

    retellCallProvider.createBatchCall.resolves({
      batchId: 'batch-1'
    })

    const result = await callService.processBuildingContactCall(
      'building-1',
      'MADRID'
    )

    expect(result.status).to.equal('sent')
    if (result.status !== 'sent') {
      throw new Error(`Expected status sent but got ${result.status}`)
    }

    expect(result.city).to.equal('MADRID')
    expect(result.buildingId).to.equal('building-1')
    expect(result.callQueueId).to.equal('queue-1')

    sinon.assert.calledOnceWithExactly(
      contactService.getNextContactInBuilding,
      'building-1'
    )
    sinon.assert.calledOnceWithExactly(
      contactService.changeContactStatus,
      'IN_PROGRESS',
      false,
      'queue-1'
    )
    sinon.assert.calledOnce(retellCallProvider.createBatchCall)
  })
})

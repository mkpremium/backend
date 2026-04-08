import { expect } from 'chai'
import sinon from 'sinon'
import { RetellCallProvider } from '../../../../src/call/infrastructure/retell/retell-call.provider'
import { BatchCallRequest } from '../../../../src/call/types/batch-call-request'

describe('RetellCallProvider', () => {
  let retellClient: any
  let logger: any
  let provider: RetellCallProvider

  beforeEach(() => {
    retellClient = {
      batchCall: {
        createBatchCall: sinon.stub()
      }
    }

    logger = {
      info: sinon.spy(),
      error: sinon.spy()
    }

    provider = new RetellCallProvider(retellClient, logger)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should create batch call successfully', async () => {
    // mock respuesta de Retell
    retellClient.batchCall.createBatchCall.resolves({
      batch_call_id: 'batch-123',
      total_task_count: 2
    })

    const request: BatchCallRequest = {
      originTelf: '+34123456789',
      tasks: [
        {
          toNumber: '+34111111111',
          variables: {
            name: 'Juan',
            lastName: 'Perez',
            address: 'Calle 1'
          },
          metadata: {
            buildingId: '1',
            ownerId: '2',
            contactId: '3',
            city: 'Madrid',
            use: 'sale',
            callQueueId: '4',
            address: 'Calle 1'
          }
        }
      ]
    }

    const response = await provider.createBatchCall(request)

    // assertions
    expect(response.batchId).to.equal('batch-123')
    expect(response.totalCalls).to.equal(2)

    // verifica que se llamó a Retell
    expect(retellClient.batchCall.createBatchCall.calledOnce).to.be.true

    // verifica logging
    expect(logger.info.called).to.be.true
  })

  it('should throw error if retell fails', async () => {
    retellClient.batchCall.createBatchCall.rejects(new Error('Retell error'))

    const request: BatchCallRequest = {
      originTelf: '+34123456789',
      tasks: []
    }

    try {
      await provider.createBatchCall(request)
      throw new Error('should have failed')
    } catch (err: any) {
      expect(err.message).to.equal('Retell error')
      expect(logger.error.called).to.be.true
    }
  })

  it('should throw error if both timeStamp and timeWindow are provided', async () => {
    const request: BatchCallRequest = {
      originTelf: '+34123456789',
      tasks: [],
      timeStamp: Date.now(),
      timeWindow: {
        startTime: 600,
        endTime: 1200
      }
    }

    try {
      await provider.createBatchCall(request)
      throw new Error('should have failed')
    } catch (err: any) {
      expect(err.message).to.include('timeWindow o timeStamp')
    }
  })
})

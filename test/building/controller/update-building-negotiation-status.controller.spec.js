import { expect } from 'chai'
import { createUpdateBuildingNegotiationStatusController } from '../../../src/building/controller/update-building-negotiation-status.controller'
import { spy, stub } from 'sinon'

describe('Update Building Negotiation Status Controller', () => {
  let controller
  let updateBuildingNegotiationStatusServiceSpy

  beforeEach(() => {
    updateBuildingNegotiationStatusServiceSpy = {
      updateBuildingStatus: stub()
    }
    controller = createUpdateBuildingNegotiationStatusController({
      updateBuildingNegotiationStatusService: updateBuildingNegotiationStatusServiceSpy
    })
  })

  it('update building negotiation status using service', () => {
    const testBuildingId = 'test-building-id'
    const testRequest = {
      params: {
        buildingId: testBuildingId
      },
      user: {
        id: 'test-user-id'
      },
      body: {
        status: 'COMPRADO',
        sourceOwnerId: 'test-source-owner-id'
      }
    }
    const testResponse = {
      sendStatus: spy()
    }

    updateBuildingNegotiationStatusServiceSpy.updateBuildingStatus.resolves()
    return controller(testRequest, testResponse).then(() => {
      expect(updateBuildingNegotiationStatusServiceSpy.updateBuildingStatus)
        .to.have.been.calledWith(testBuildingId, {
          userId: 'test-user-id',
          sourceOwnerId: 'test-source-owner-id',
          status: 'COMPRADO'
        })
      expect(testResponse.sendStatus).to.have.been.calledWith(200)
    })
  })
})

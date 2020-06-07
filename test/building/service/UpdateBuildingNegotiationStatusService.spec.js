import { spy } from 'sinon'
import { expect } from 'chai'
import {
  InvalidBuildingNegotiationStatus,
  UpdateBuildingNegotiationStatusService
} from '../../../src/building/service/UpdateBuildingNegotiationStatusService'

describe('UpdateBuildingNegotiationStatusService', () => {
  let buildingRepository, service

  beforeEach(() => {
    buildingRepository = {
      setBuildingNegotiationStatus: spy(() => undefined)
    }
    service = new UpdateBuildingNegotiationStatusService(buildingRepository)
  })

  const validNegotiationStatuses = [
    'PENDIENTE',
    'PROPUESTA ENVIADA',
    'COMPRADO',
    'VENDIDO',
    'NO VENDE',

    'DESCARTADO'
  ]
  validNegotiationStatuses.forEach((status) => {
    it(`accepts ${status} as valid negotiation status`, async () => {
      await service.updateBuildingStatus('building-id', status)

      expect(buildingRepository.setBuildingNegotiationStatus).to.have.been.calledWith('building-id', status)
    })
  })

  it('rejects invalid negotiation statuses', async () => {
    try {
      await service.updateBuildingStatus('building-id', 'unknown status')
      expect.fail()
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidBuildingNegotiationStatus)
    }
  })
})

import { expect } from 'chai'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'

describe('AddProposalForBuildingService', () => {
  let service

  beforeEach(() => {
    service = new AddProposalForBuildingService()
  })

  it('works', () => {
    expect(service).to.be.not.undefined
  })
})

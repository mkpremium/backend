import { LeadCreatorService, createLeadCommand } from '../../../src/calls/service/lead-creator.service'
import { expect } from 'chai'

describe('LeadCreatorService', () => {
  let service: LeadCreatorService
  const testCmd: createLeadCommand = {}

  beforeEach(() => {
    service = new LeadCreatorService()
  })

  it('is not implemented', () => {
    expect(() => service.createLead(testCmd)).to.throw
  })
})

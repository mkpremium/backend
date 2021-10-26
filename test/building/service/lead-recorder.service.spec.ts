import { LeadRecorderService, RecordLeadCommand } from '../../../src/building/service/lead-recorder.service'
import { expect } from 'chai'

describe('LeadRecorderService', () => {
  let service: LeadRecorderService
  const testCmd: RecordLeadCommand = {}

  beforeEach(() => {
    service = new LeadRecorderService()
  })

  it('is not implemented', () => {
    expect(() => service.recordLead(testCmd)).to.throw
  })
})

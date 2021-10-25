import { FlipperLeadsService, LeadsForCommand } from './flipper-leads.service'
import { expect } from 'chai'

describe('FlipperLeadsService', () => {
  let service: FlipperLeadsService
  const testCmd: LeadsForCommand = {}

  beforeEach(() => {
    service = new FlipperLeadsService()
  })

  it('is not implemented', () => {
    expect(() => service.leadsFor(testCmd)).to.throw
  })
})

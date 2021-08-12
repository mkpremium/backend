import { expect } from 'chai'
import { CallerPhone, phoneBusy } from '../../../src/calls/domain/caller.phone'

describe('CallerPhone', () => {
  it('creates a valid caller phone', () => {
    const createdPhone = CallerPhone({ id: 'phone_+34123456' } as any)
    expect(createdPhone).to.have.property('createdAt')
    expect(createdPhone).to.include({
      _documentType: 'virtual-caller-phone',
      status: 'AVAILABLE',
    })
  })

  it('changes phone to busy without changing its ID', () => {
    const id = 'phone_+34123456'
    const createdPhone = CallerPhone({ id } as any)

    expect(phoneBusy(createdPhone).id).to.be.eql(id)
  })
})

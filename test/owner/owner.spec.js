import { expect } from 'chai'
import { mergeFeaturedContact } from '../../src/owner/owner'
import { ownerBuilder } from './owner.builder'

describe('mergeFeaturedContact', () => {
  it(`fails when given phoneId is not a owner's contact`, () => {
    const testOwner = ownerBuilder().build()
    expect(() => mergeFeaturedContact(testOwner, { phoneId: 'unknown-contact-id' }))
      .to.throw(/wrong featured contact/i)
  })

  it(`fails when given emailId is not a owner's contact`, () => {
    const testOwner = ownerBuilder().build()
    expect(() => mergeFeaturedContact(testOwner, { emailId: 'unknown-contact-id' }))
      .to.throw(/wrong featured contact/i)
  })

  it('adds only given contact id', () => {
    const testOwner = ownerBuilder()
      .withPhoneContact('test-phone-id').withFeaturedPhone('test-phone-id')
      .withEmailContact()
      .build()

    expect(mergeFeaturedContact(testOwner, { emailId: 'test-email-id' }).featuredContact)
      .to.be.eql({ phoneId: 'test-phone-id', emailId: 'test-email-id' })
  })
})

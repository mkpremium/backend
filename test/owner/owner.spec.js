import { expect } from 'chai'
import { contactOfId, mergeFeaturedContact } from '../../src/owner/owner'
import { ownerBuilder } from './owner.builder'

describe('mergeFeaturedContact', function () {
  it('fails when given phoneId is not a owner\'s contact', function () {
    const testOwner = ownerBuilder().build()
    expect(() => mergeFeaturedContact(testOwner, { phoneId: 'unknown-contact-id' }))
      .to.throw(/wrong featured contact/i)
  })

  it('fails when given emailId is not a owner\'s contact', function () {
    const testOwner = ownerBuilder().build()
    expect(() => mergeFeaturedContact(testOwner, { emailId: 'unknown-contact-id' }))
      .to.throw(/wrong featured contact/i)
  })

  it('adds only given contact id', function () {
    const testOwner = ownerBuilder()
      .withPhoneContact('test-phone-id').withFeaturedPhone('test-phone-id')
      .withEmailContact()
      .build()

    expect(mergeFeaturedContact(testOwner, { emailId: 'test-email-id' }).featuredContact)
      .to.be.eql({ phoneId: 'test-phone-id', emailId: 'test-email-id' })
  })

  it('marks featured phone as validated', function () {
    const testOwner = ownerBuilder().withPhoneContact('test-phone-id').build()

    const updatedOwner = mergeFeaturedContact(testOwner, { phoneId: 'test-phone-id' })

    expect(contactOfId(updatedOwner, 'test-phone-id').status).to.be.equal('GOOD')
  })

  it('marks featured email as validated', function () {
    const testOwner = ownerBuilder().withEmailContact('test-email-id').build()

    const updatedOwner = mergeFeaturedContact(testOwner, { emailId: 'test-email-id' })

    expect(contactOfId(updatedOwner, 'test-email-id').status).to.be.equal('GOOD')
  })
})

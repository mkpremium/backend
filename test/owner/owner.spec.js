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
})

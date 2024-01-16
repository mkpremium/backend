import { expect } from 'chai'
import { selectBuildingOwner } from '../../../src/building/service/owner-selection.policy'

describe('Owner selection policy', () => {
  const testFeaturedOwnerId = 'test-featured-owner-id'
  const testMeeting = {}

  it('returns nothing when no owners are provided', () => {
    expect(selectBuildingOwner(undefined, testFeaturedOwnerId, testMeeting))
      .to.be.undefined
  })

  it('returns nothing when there is no owner with some contact validated', () => {
    expect(selectBuildingOwner([ {
      id: 'test-owner-id',
      contacts: []
    } ], testFeaturedOwnerId, testMeeting)).to.be.undefined
  })
})

/* eslint-disable max-len */
import _flatten from 'lodash/flatten'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { isTest } from '../../config'
import { OwnerWithInclude } from '../types/owner'

t.OwnerCompactView = t.struct(
  {
    id: t.String,
    type: t.OwnerType,
    status: t.OwnerStatus,
    buildingId: isTest() ? t.maybe(t.String) : t.String,
    confirmedByOperator: t.OwnerConfirmed,
    person: t.struct({
      id: t.String,
      name: t.String
    }, 'person'),
    contact: t.TypedContactInfo
  },
  {
    name: 'OwnerView',
    defaultProps: {
      confirmedByOperator: {
        value: false
      }
    }
  }
)

t.OwnerLitResponse = t.struct(
  {
    results: t.list(OwnerWithInclude)
  },
  {
    name: 'OwnerLitResponse',
    defaultProps: {
      results: []
    }
  }
)

export const OwnerListQuery = t.OwnerListQuery = t.ListQuery.extend(
  {
    contactNumber: t.maybe(t.String)
  },
  {
    name: 'OwnerListQuery',
    defaultProps: {
    }
  }
)

export function ownersContactViews (owners, worksheet) {
  function mapOwner (owner) {
    return ownerContactsView(owner, worksheet.relatedBuildings[0])
  }

  return _flatten(owners.map(mapOwner))
}

export function ownerContactsView (owner, building) {
  return owner.person.contacts
    .map((contact) => fromJSON(Object.assign({}, owner, {
      person: owner.person,
      contact
    }), t.OwnerCompactView))
}

export default t

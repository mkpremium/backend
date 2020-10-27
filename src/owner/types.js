/* eslint-disable max-len */
import _flatten from 'lodash/flatten'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { isTest } from '../../config'
import { TypedContactInfo } from '../types/common'
import { OwnerStatusEnum, OwnerTypeEnum } from '../types/enums'
import { ListQuery } from '../types/params'
import { OwnerConfirmed, OwnerWithInclude } from './owner'

export const OwnerCompactView = t.struct(
  {
    id: t.String,
    type: OwnerTypeEnum,
    status: OwnerStatusEnum,
    buildingId: isTest() ? t.maybe(t.String) : t.String,
    confirmedByOperator: OwnerConfirmed,
    person: t.struct({
      name: t.String
    }, 'person'),
    contact: TypedContactInfo
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

export const OwnerListQuery = ListQuery.extend(
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
    }), OwnerCompactView))
}

export default t

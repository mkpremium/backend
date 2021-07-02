/* eslint-disable max-len */
import t from 'tcomb'
import { ListQuery } from '../types/params'
import { OwnerWithInclude } from './owner'

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

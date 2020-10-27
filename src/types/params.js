import t from 'tcomb'
import { Positive } from './refinement'

export const ListQuery = t.struct(
  {
    limit: Positive,
    offset: Positive
  },
  {
    name: 'ListQuery',
    defaultProps: {
      limit: 20,
      offset: 0
    }
  }
)

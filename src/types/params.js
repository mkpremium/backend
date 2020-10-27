import t from 'tcomb'

export const ListQuery = t.struct(
  {
    limit: t.Positive,
    offset: t.Positive
  },
  {
    name: 'ListQuery',
    defaultProps: {
      limit: 20,
      offset: 0
    }
  }
)

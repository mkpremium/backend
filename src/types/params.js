import t from 'tcomb';

t.ListQuery = t.struct(
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
);

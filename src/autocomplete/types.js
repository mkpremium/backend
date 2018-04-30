import t from 'tcomb';

t.AutoCompleteQuery = t.struct(
  {
    query: t.String
  },
  {
    name: 'AutoCompleteQuery',
    defaultProps: {
      query: '*'
    }
  }
);

export default t;

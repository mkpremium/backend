import t from 'tcomb';

t.History = t.struct({
  model: t.struct({
    name: t.String,
    id: t.String
  }),
  user: t.struct({
    id: t.String
  }),
  type: t.RecordAction,
  description: t.String,
  timestamp: t.Date,
  _documentType: t.String
},
{
  name: 'History',
  defaultProps: {
    _documentType: 'history'
  }
});

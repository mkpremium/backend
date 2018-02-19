import t from 'tcomb';

t.Record = t.struct({
  model: t.String,
  id: t.String,
  user: t.struct({
    id: t.String,
    permissions: t.list(t.OperatorRole)
  }),
  details: t.struct({
    action: t.RecordAction,
    context: t.String
  }),
  timestamp: t.Date,
  _documentType: t.String
},
{
  name: 'Record',
  defaultProps: {
    _documentType: 'record'
  }
});

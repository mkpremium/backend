import t from 'tcomb';

t.EmailBody = t.struct({
  to: t.String,
  cc: t.maybe(t.String),
  cco: t.maybe(t.String),
  body: t.String,
  subject: t.String
}, 'EmailBody');

export default t;

import t from 'tcomb';

t.EmailBody = t.struct({
  to: t.String,
  body: t.String,
  subject: t.String
}, 'EmailBody');

export default t;

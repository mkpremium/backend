import t from 'tcomb'

t.EmailBody = t.struct({
  to: t.String,
  cc: t.maybe(t.String),
  cco: t.maybe(t.String),
  body: t.String,
  html: t.maybe(t.String),
  text: t.maybe(t.String),
  subject: t.String
}, {
  name: 'EmailBody',
  defaultProps: {
    body: ''
  }
})

export default t
